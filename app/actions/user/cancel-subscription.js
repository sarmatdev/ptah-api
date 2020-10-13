'use strict';
const _ = require('lodash');
const config = require('../../../config/config');

const Factory = require('../../../common/classes/factory');

const subscriptionStates = require('../../../common/classes/subscription-state');

module.exports = async (ctx) => {
    try {

        const user = Factory.User(ctx, _.get(ctx, config.userStatePath));

        ctx.body = await user.SetSubscriptionState(subscriptionStates.cancelled);

        ctx.status = 200;


    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }
};
