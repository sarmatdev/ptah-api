'use strict';

const {INTERNAL_SERVER_ERROR, NOT_FOUND} = require('../../../../config/errors');

const {Feature} = require('../../../../common/classes/feature.class');
const {FeaturesList} = require('../../../../common/classes/features-list.class');

module.exports = async (ctx, next) => {
    try {
        const id = ctx.params.id || '';

        let result;

        if (id) {
            const feature = new Feature(ctx);
            result = await feature.FindById(id);
            if (!result) {
                return ctx.throw(404, NOT_FOUND);
            }
        } else {
            const featuresList = new FeaturesList(ctx);
            result = {features: await featuresList.GetAll()};
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
