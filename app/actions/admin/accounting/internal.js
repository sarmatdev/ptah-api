'use strict';

const ObjectID = require('bson-objectid');

const {BAD_REQUEST} = require('../../../../config/errors');
const {AccountingInternal} = require('../../../../common/classes/accounting.class');
const config = require('../../../../config/config');


module.exports = async (ctx, next) => {
    try {
        const userId = ctx.params.userId || '';
        if (userId && !ObjectID.isValid(userId)) {
            return ctx.throw(400, BAD_REQUEST);
        }

        const operationCode = ctx.query.operationCode || '';

        const limit = (ctx.query.limit || 0) * 1 || config.pagingDefaultLimit;
        const offset = (ctx.query.offset || 0) * 1 || 0;

        const accountingInternal = new AccountingInternal(ctx);

        ctx.body = await accountingInternal.GetUserHistory(userId, operationCode, limit, offset);

        if (userId) {
            ctx.body.balance = await accountingInternal.GetUserBalance(userId);
        }

        ctx.status = 200;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
