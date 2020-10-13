'use strict';

const fs = require('fs');
const _ = require('lodash');
const path = require('path');
const decompress = require('decompress');
const ObjectID = require("bson-objectid");

const config = require('../../../config/config');

const {BAD_REQUEST, PRECONDITION_FAILED} = require('../../../config/errors');
const findLandings = require('./helpers/find-landings');
const getLandingMeta = require('./helpers/get-landing-meta');
const updateLandingData = require('./helpers/update-landing-data');
const deletePublishedLanding = require('./helpers/delete-published-landing');
const addDomainConfig = require('./helpers/add-domain-config');
const getDbCollection = require('../../../common/utils/get-db-collection');
const checkFeature = require('./helpers/check-feature');
const {BACKEND_FEATURE_CODE_OWN_DOMAIN} = require('../../../common/classes/feature.class');


module.exports = async (ctx, next) => {
    const id = ctx.params.id;

    const user = _.get(ctx, config.userStatePath);
    if (!user) {
        return ctx.throw(401, AUTHENTICATION_ERROR);
    }

    if (!ctx.request.files) {
        return ctx.throw(400, BAD_REQUEST);
    }

    const file = ctx.request.files.file;
    if (!file) {
        return ctx.throw(400, BAD_REQUEST);
    }
    if (!(file.type === 'application/zip' && file.name === 'project.zip')) {
        return ctx.throw(400, BAD_REQUEST);
    }

    let data = {};
    try {
        const landings = await findLandings(ctx, false, [id]);
        const landing = landings[0];
        if (landing) {

            if (!landing.domain) {
                return ctx.throw(412, PRECONDITION_FAILED);
            }

            const checkFeatureResult = await checkFeature(ctx, user, BACKEND_FEATURE_CODE_OWN_DOMAIN, landing);
            if (!checkFeatureResult) {
                return ctx.throw(412, FEATURE_NOT_ALLOWED_OR_LIMIT_EXCEEDED);
            }

            // remove previous published landing (and external domain config too), if exists
            await deletePublishedLanding(id);

            const landingDestinationDir = path.resolve(config.landingsHtmlDir, id);
            fs.mkdirSync(landingDestinationDir, { recursive: true });

            // unzip archive contents to landing's html dir
            await decompress(file.path, landingDestinationDir, {strip: 1});

            // adding config for external domain, if exist

            await addDomainConfig(id, landing.domain);

            // finally, updating data in DB
            // finally, updating data in DB
            data = updateLandingData(ctx, landing, {
                isPublished: true,
                hasUnpublishedChanges: false
            });

            const collection = getDbCollection.landings(ctx);

            await ctx.mongoTransaction(
                collection,
                'updateOne',
                [
                    {_id: ObjectID(id)},
                    {$set: data}
                ]
            )
        }
    } catch (err) {
        throw err
    }

    ctx.status = 200;
    ctx.body = getLandingMeta(data);
    next();
};
