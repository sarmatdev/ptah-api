'use strict';

const {INTERNAL_SERVER_ERROR, FEATURE_NOT_FOUND_OR_ARCHIVED, FEATURE_VOLUME_INVALID,
    NON_MEASUREABLE_FEATURE_VOLUME_INVALID, TARIFF_HAS_NO_FEATURES} = require('../../../../config/errors');

const {Tariff} = require('../../../../common/classes/tariff.class');
const {TariffsList} = require('../../../../common/classes/tariffs-list.class');
const {FeaturesList} = require('../../../../common/classes/features-list.class');

module.exports = async (ctx, next) => {
    try {
        const name = ctx.request.body.name || '';
        const description = ctx.request.body.description || '';
        const dayPrice = (ctx.request.body.dayPrice || 0) * 1;
        const periodDays = (ctx.request.body.periodDays || 30) * 1;
        const tariffFeatures = ctx.request.body.features || [];

        if (!tariffFeatures.length) {
            return ctx.throw(400, TARIFF_HAS_NO_FEATURES);
        }

        const featuresList = new FeaturesList(ctx);
        const features = await featuresList.GetAll();
        if (!features) {
            return ctx.throw(500, INTERNAL_SERVER_ERROR);
        }
        const activeFeaturesId = features.map(f => f.isArchived ? null : f._id.toString()).filter(Boolean);
        const activeNonMeasureableFeaturesId = features.map(f => (f.isArchived || f.isMeasurable) ? null : f._id.toString()).filter(Boolean);
        tariffFeatures.forEach(tf => {
            if (tf.volume < 0) {
                return ctx.throw(400, FEATURE_VOLUME_INVALID);
            }

            if (activeFeaturesId.indexOf(tf.id) < 0) {
                return ctx.throw(400, FEATURE_NOT_FOUND_OR_ARCHIVED);
            }
        })
        tariffFeatures.forEach(tf => {
            if (activeNonMeasureableFeaturesId.indexOf(tf.id) >= 0 && tf.volume > 1 ) {
                return ctx.throw(400, NON_MEASUREABLE_FEATURE_VOLUME_INVALID + '___' + tf.volume);
            }
        })

        const tariff = new Tariff(ctx);
        const result = await tariff.Create(name, description, dayPrice, periodDays, tariffFeatures);
        if (!result) {
            return ctx.throw(500, INTERNAL_SERVER_ERROR);
        }

        const tariffsList = new TariffsList(ctx);

        ctx.body = await tariffsList.GetById(result._id);

        ctx.status = 201;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
