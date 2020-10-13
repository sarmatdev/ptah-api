'use strict';

const _ = require('lodash');

const config = require('../../../config/config');
const {Payment} = require('../../../common/classes/payment.class');
const Factory = require('../../../common/classes/factory');

module.exports = async (ctx, next) => {
    try {
        const amount = (ctx.request.body.amount || 0) * 1

        const user = Factory.User(ctx, _.get(ctx, config.userStatePath));
        const Payment = new Payment(ctx);

        ctx.body = await Payment.PreparePayment(user, amount);

        ctx.status = 200;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
