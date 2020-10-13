'use strict';

const {UsersList} = require('../../../../common/classes/users-list.class');
const config = require('../../../../config/config');


module.exports = async (ctx, next) => {
    try {
        const limit = (ctx.query.limit || 0) * 1 || config.pagingDefaultLimit;
        const offset = (ctx.query.offset || 0) * 1 || 0;

        const usersList = new UsersList(ctx);

        const filter = {};

        if (Number.isInteger(ctx.query.subscriptionState * 1)) {
            filter.subscriptionState = ctx.query.subscriptionState * 1;
        }

        if (ctx.query.tariff !== undefined) {
            filter.tariff = ctx.query.tariff;
        }

        if (typeof ctx.query.emailConfirmed === 'string' && ctx.query.emailConfirmed) {
            filter.emailConfirmed = ctx.query.emailConfirmed.toLowerCase() === 'true';
        }

        if (typeof ctx.query.mailchimpIntegration === 'string' && ctx.query.mailchimpIntegration) {
            filter.mailchimpIntegration = ctx.query.mailchimpIntegration.toLowerCase() === 'true';
        }

        ctx.body = await usersList.GetByFilters(filter, limit, offset);
        ctx.status = 200;


    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
