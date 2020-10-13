'use strict';

const _ = require('lodash');

const config = require('../../../config/config');
const {AccountingUser} = require('../../../common/classes/accounting.class');


module.exports = async (ctx, next) => {
    try {
        const userId = _.get(ctx, config.userIdStatePath);

        const limit = (ctx.query.limit || 0) * 1 || config.pagingDefaultLimit;
        const offset = (ctx.query.offset || 0) * 1 || 0;

        const accountingUser = new AccountingUser(ctx);

        ctx.body = await accountingUser.GetUserHistory(userId, '', limit, offset);
        ctx.status = 200;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
