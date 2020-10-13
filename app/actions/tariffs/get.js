'use strict';

const {INTERNAL_SERVER_ERROR} = require('../../../config/errors');
const {TariffsList} = require('../../../common/classes/tariffs-list.class');

module.exports = async (ctx, next) => {
    try {
        const tariffsList = new TariffsList(ctx);

        const result = await tariffsList.GetActive();

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
