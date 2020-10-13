'use strict';
const _ = require('lodash');
const config = require('../../../config/config');

const {NOT_FOUND, FEATURE_NOT_ALLOWED_OR_LIMIT_EXCEEDED, NOT_ENOUGH_MONEY, INTERNAL_SERVER_ERROR} = require('../../../config/errors');

const {AccountingUser, AccountingInternal, OPERATION_CODE_TARIFF} = require('../../../common/classes/accounting.class');
const {TariffsList} = require('../../../common/classes/tariffs-list.class');
const Factory = require('../../../common/classes/factory');
const {Payment} = require('../../../common/classes/payment.class');
const {FeatureCheck} = require('../../../common/classes/features-check.class');
const subscriptionStates = require('../../../common/classes/subscription-state')

module.exports = async (ctx, next) => {
    try {

        const user = Factory.User(ctx, _.get(ctx, config.userStatePath));

        const newTariffId = ctx.request.body.id || '';
        if (!newTariffId) {
            return ctx.throw(404, NOT_FOUND);
        }

        const tariffsList = new TariffsList(ctx);
        const tariff = await tariffsList.GetById(newTariffId);
        if (!tariff) {
            return ctx.throw(404, NOT_FOUND);
        }

        if (user.tariff === tariff._id) {
            return await setTariff(ctx, next, user);
        }

        const backendFeatures = tariff.features.filter(f => f.feature.isBackend);
        for (let feature of backendFeatures) {
            if (!await FeatureCheck.CheckByCode(feature.feature.code, ctx, user.GetId(), feature.volume, true)) {
                return ctx.throw(412, FEATURE_NOT_ALLOWED_OR_LIMIT_EXCEEDED);
            }
        }

        const periodCost = tariff.dayPrice * tariff.periodDays;
        if (periodCost === 0) {
            return await setTariff(ctx, next, user, newTariffId, periodCost);
        }

        const accountingInternal = new AccountingInternal(ctx);
        const balanceInternal = await accountingInternal.GetUserBalance(user.GetId(), OPERATION_CODE_TARIFF);

        if (balanceInternal >= periodCost) {
            return await setTariff(ctx, next, user, newTariffId, periodCost);
        }

        const delta = periodCost - balanceInternal;

        const accountingUser = new AccountingUser(ctx);
        const balanceUser = await accountingInternal.GetUserBalance(user.GetId(), OPERATION_CODE_TARIFF);

        if (balanceUser < delta) {
            const topupAmount = delta - balanceUser;
            const payment = new Payment(ctx);
            if (! await payment.TryRecurringTopup(user, topupAmount)) {
                return needTopup(ctx, next, topupAmount);
            }
        }

        await accountingUser.AddUserOperation(user.GetId(), delta * -1, OPERATION_CODE_TARIFF, 'change tariff');
        await accountingInternal.AddUserOperation(user.GetId(), delta, OPERATION_CODE_TARIFF, 'change tariff');
        return await setTariff(ctx, next, user, newTariffId, periodCost);

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }
};

async function setTariff(ctx, nextFn, user, newTariffId, cost = 0) {
    if (newTariffId) {
        await user.SetTariff(newTariffId);
        const r = await user.SetSubscriptionState(cost > 0 ? subscriptionStates.active : subscriptionStates.inactive);
        if (!r) {
            return ctx.throw(500, INTERNAL_SERVER_ERROR);
        }
        ctx.body = r
    } else {
        ctx.body = user.GetUser();
    }
    ctx.status = 200;
    return nextFn();
}


async function needTopup(ctx, nextFn, amount) {
    ctx.body = {
        "error": {
            "code": 412,
            "message": NOT_ENOUGH_MONEY,
            "amount": amount,
        }
    }
    ctx.status = 412;
    return nextFn();
}

