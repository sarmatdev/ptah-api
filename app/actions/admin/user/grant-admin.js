'use strict';

const {NOT_FOUND, BAD_REQUEST} = require('../../../../config/errors');
const Factory = require('../../../../common/classes/factory');

module.exports = async (ctx, next) => {
    try {

        const userId = ctx.params.userId || '';
        if (!userId) {
            return ctx.throw(400, BAD_REQUEST);
        }

        const user = Factory.User(ctx);

        if (!await user.FindById(userId)) {
            return ctx.throw(404, NOT_FOUND);
        }

        await user.GrantAdmin();

        ctx.status = 200;
        ctx.body = user.GetUser();

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();

};
