'use strict';

const {INTERNAL_SERVER_ERROR, NOT_FOUND, TARIFF_PRICE_TOO_MUCH_FOR_DEFAULT} = require('../../../../config/errors');

const {TariffsList} = require('../../../../common/classes/tariffs-list.class');

module.exports = async (ctx, next) => {
    try {
        const id = ctx.params.id || '';

        const tariffsList = new TariffsList(ctx);
        const tariff = await tariffsList.GetById(id);
        if (!tariff) {
            return ctx.throw(404, NOT_FOUND);
        }

        if (tariff.dayPrice > 0) {
            return ctx.throw(412, TARIFF_PRICE_TOO_MUCH_FOR_DEFAULT);
        }

        const result = await tariffsList.SetAsDefault(tariff._id);
        if (!result && result.length) {
            return ctx.throw(500, INTERNAL_SERVER_ERROR);
        }


        ctx.status = 200;
        ctx.body = result[0];

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
