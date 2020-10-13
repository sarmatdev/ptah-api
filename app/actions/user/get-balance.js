'use strict';

const _ = require('lodash');

const config = require('../../../config/config');
const {AccountingUser} = require('../../../common/classes/accounting.class');

module.exports = async (ctx, next) => {
    try {
        const userId = _.get(ctx, config.userIdStatePath);
        const accountingUser = new AccountingUser(ctx);

        const balance = await accountingUser.GetUserBalance(userId);

        ctx.status = 200;
        ctx.body = {
            balance: balance,
            currency: 'USD',
        };

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
