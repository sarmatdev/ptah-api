'use strict';
const _ = require('lodash');
const config = require('../../../config/config');

const {INTERNAL_SERVER_ERROR, BAD_REQUEST, NOT_FOUND} = require('../../../config/errors');

const {TariffsList} = require('../../../common/classes/tariffs-list.class');

module.exports = async (ctx, next) => {
    try {

        const user = _.get(ctx, config.userStatePath);

        if (!(user && user.tariff)) {
            return ctx.throw(400, BAD_REQUEST);
        }

        const tariffsList = new TariffsList(ctx);
        const result = await tariffsList.GetById(user.tariff);
        if (!result && result.length) {
            return ctx.throw(404, NOT_FOUND);
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
