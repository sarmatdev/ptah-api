'use strict';

const _ = require('lodash');

const {AUTHENTICATION_ERROR} = require('../../../../config/errors');
const config = require('../../../../config/config');
const getDefaultLanding = require('./default-landing');
const getDbCollection = require('../../../../common/utils/get-db-collection');

module.exports = async (ctx, omitLandingBody, domain) => {

    const userId = _.get(ctx, config.userIdStatePath);
    if (!userId) {
        return ctx.throw(401, AUTHENTICATION_ERROR);
    }

    const omitFields = ['isDeleted'];
    if (omitLandingBody) {
        omitFields.push('landing');
    }

    const options = {
        projection: {}
    };
    omitFields.forEach((field) => {
        options.projection[field] = 0
    });

    const condition = {
        isDeleted: false,
        domain: domain,
    };

    const collection = getDbCollection.landings(ctx);

    let result = [];

    try {
        const r = await ctx.mongoTransaction(
            collection,
            'find',
            [
                condition,
                options
            ]
        )

        result = await r.toArray();
    } catch (err) {
        throw err
    }

    const defaultLanding = _.omit(getDefaultLanding(), omitFields);

    return result.map(l => Object.assign({}, defaultLanding, l));
};
