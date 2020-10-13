'use strict';

const _ = require('lodash');

const config = require('../../../config/config');
const {BAD_REQUEST, FEATURE_NOT_ALLOWED_OR_LIMIT_EXCEEDED} = require('../../../config/errors');
const getLandingMeta = require('./helpers/get-landing-meta');
const updateLandingData = require('./helpers/update-landing-data');
const checkFeature = require('./helpers/check-feature');
const getDbCollection = require('../../../common/utils/get-db-collection');
const {BACKEND_FEATURE_CODE_LANDINGS_COUNT} = require('../../../common/classes/feature.class');

module.exports = async (ctx, next) => {

    const user = _.get(ctx, config.userStatePath);
    if (!user) {
        return ctx.throw(401, AUTHENTICATION_ERROR);
    }

    const checkFeatureResult = await checkFeature(ctx, user, BACKEND_FEATURE_CODE_LANDINGS_COUNT);
    if (!checkFeatureResult) {
        return ctx.throw(412, FEATURE_NOT_ALLOWED_OR_LIMIT_EXCEEDED);
    }

    const body = ctx.request.body || {};
    const name = (body.name || '').trim();
    const previewUrl = (body.previewUrl || '').trim();
    const landingUpdate = body.landing;

    const update = {};
    if (name) {
        update.name = name;
        update.previewUrl = previewUrl;
    } else {
        return ctx.throw(400, BAD_REQUEST);
    }
    if (landingUpdate && !_.isEmpty(landingUpdate)) {
        update.landing = landingUpdate;
    } else {
        return ctx.throw(400, BAD_REQUEST);
    }

    const data = updateLandingData(ctx, {}, update);

    const collection = getDbCollection.landings(ctx);
    try {
        await ctx.mongoTransaction(
            collection,
            'insertOne',
            [
                data
            ]
        )
    } catch (err) {
        throw err
    }

    ctx.status = 201;
    ctx.body = getLandingMeta(data);

    next();
};
