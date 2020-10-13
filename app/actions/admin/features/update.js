'use strict';

const {NOT_FOUND, INTERNAL_SERVER_ERROR, FEATURE_ALREADY_IN_USE} = require('../../../../config/errors');

const {Feature} = require('../../../../common/classes/feature.class');
const {TariffsList} = require('../../../../common/classes/tariffs-list.class');

module.exports = async (ctx, next) => {
    try {

        const id = ctx.params.id || '';

        const feature = new Feature(ctx);
        const f = await feature.FindById(id);
        if (!f) {
            return ctx.throw(404, NOT_FOUND);
        }

        // todo: check included in tariff
        const tariffsList = new TariffsList(ctx);
        const featureTariffs = tariffsList.getByFeature(id);
        if (featureTariffs.length) {
            return ctx.throw(400, FEATURE_ALREADY_IN_USE);
        }

        const name = ctx.request.body.name || '';
        const description = ctx.request.body.description || '';
        const code = ctx.request.body.code || '';
        const isMeasurable = ctx.request.body.isMeasurable;
        const measureName = ctx.request.body.measureName || '';
        const isArchived = ctx.request.body.isArchived;

        const updateParams = {};
        if (name) {
            updateParams.name = name;
        }
        if (description) {
            updateParams.description = description;
        }
        if (code) {
            updateParams.code = code;
        }
        if (typeof isMeasurable !== 'undefined' ) {
            updateParams.isMeasurable = !!isMeasurable;
        }
        if (measureName) {
            updateParams.measureName = measureName;
        }
        if (typeof isArchived !== 'undefined' ) {
            updateParams.isArchived = !!isArchived;
        }

        let result = f;

        if (Object.keys(updateParams).length) {
            result = await feature.Update(updateParams);
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
