'use strict';

const _ = require('lodash');

const config = require('../../../config/config');
const {Payment} = require('../../../common/classes/payment.class');
const Factory = require('../../../common/classes/factory');

module.exports = async (ctx, next) => {
    try {
        const user = Factory.User(ctx, _.get(ctx, config.userStatePath));
        const payment = new Payment(ctx);

        await payment.RemoveCard(user);

        ctx.status = 201;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
