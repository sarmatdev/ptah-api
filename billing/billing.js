'use strict';

const config = require('../config/config');
const mongo = require('../common/middleware/mongo').mongo;

const Factory = require('../common/classes/factory');
const {Payment} = require('../common/classes/payment.class');
const {UsersList} = require('../common/classes/users-list.class');
const {TariffsList} = require('../common/classes/tariffs-list.class');
const subscriptionStates = require('../common/classes/subscription-state');
const {AccountingUser, AccountingInternal, OPERATION_CODE_TARIFF} = require('../common/classes/accounting.class');

async function processUser(ctx, u) {
    const user = Factory.User(ctx, u);

    const tariffsList = new TariffsList(ctx);
    const tariff = await tariffsList.GetById(user.GetTariffId());
    if (!tariff) {
        await user.SetLastBillingDate();
        return;
    }

    const cost = tariff.dayPrice;
    if (cost === 0) {
        await user.SetLastBillingDate();
        return;
    }

    const accountingInternal = new AccountingInternal(ctx);
    const balanceInternal = await accountingInternal.GetUserBalance(user.GetId(), OPERATION_CODE_TARIFF);

    if (balanceInternal < cost) {

        const periodCost = tariff.dayPrice * tariff.periodDays;

        const accountingUser = new AccountingUser(ctx);
        const balanceUser = await accountingInternal.GetUserBalance(user.GetId(), OPERATION_CODE_TARIFF);

        if (balanceUser < periodCost) {
            const payment = new Payment(ctx);
            if (!await payment.TryRecurringTopup(user, periodCost)) {
                await user.SetSubscriptionState(subscriptionStates.suspended);
                return;
            }
        }

        await accountingUser.AddUserOperation(user.GetId(), periodCost * -1, OPERATION_CODE_TARIFF, 'tariff prolongation');
        await accountingInternal.AddUserOperation(user.GetId(), periodCost, OPERATION_CODE_TARIFF, 'tariff prolongation');
        await user.SetSubscriptionState(subscriptionStates.active);
    }

    await accountingInternal.AddUserOperation(user.GetId(), -1 * cost, OPERATION_CODE_TARIFF,
        'tariff daily payment');

    await user.SetLastBillingDate();

    ctx.commitTransaction();
}

async function start(logger) {
    try {

        const ctx = {
            id: '',
            log: logger,
            session: {},
            query: {},
            header: {},
            body: undefined,
            status: 200,
            redirect: function () {
            },
            throw: function (e) {
                throw new Error(e)
            },
        };

        const mongoMw = mongo(config.mongoDsn, {}, config.enableTransactions);

        async function processBilling() {
            const usersList = new UsersList(ctx);

            const billingUsers = await usersList.GetActiveBilling();

            for (let u of billingUsers) {
                await processUser(ctx, u);
            }

            const suspendedUsers = await usersList.GetSuspendedBilling();

            for (let u of suspendedUsers) {
                await processUser(ctx, u);
            }
        }

        await mongoMw(ctx, processBilling);

    } catch (e) {
        logger.error(e);
        process.exit(1);
    }

    process.exit(0);
}

module.exports = {
    start: start,
};


