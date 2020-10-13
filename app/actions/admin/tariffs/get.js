'use strict';

const {INTERNAL_SERVER_ERROR, NOT_FOUND} = require('../../../../config/errors');

const {TariffsList} = require('../../../../common/classes/tariffs-list.class');

module.exports = async (ctx, next) => {
    try {
        const id = ctx.params.id || '';

        let result;

        const tariffsList = new TariffsList(ctx);
        if (id) {
            result = await tariffsList.GetById(id);
            if (!result && result.length) {
                return ctx.throw(404, NOT_FOUND);
            }
        } else {
            result = {tariffs: await tariffsList.GetAll()};
        }

        if (!result) {
            return ctx.throw(500, INTERNAL_SERVER_ERROR);
        }

        ctx.status = 200;
        ctx.body = result;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
