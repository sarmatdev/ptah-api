'use strict';

const {Payment} = require('../../../common/classes/payment.class');

module.exports = async (ctx, next) => {
    try {
        await Payment.ProcessStripeWebhook(ctx)

        ctx.status = 200;
        ctx.body = {};

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
