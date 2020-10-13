'use strict';

const _ = require('lodash');
const ObjectID = require("bson-objectid");

const config = require('../../../../config/config');
const getDefaultLanding = require('../../landings/helpers/default-landing');
const getDbCollection = require('../../../../common/utils/get-db-collection');

module.exports = async (ctx, next) => {
    try {

        const options = {
            projection: {
                landing: 0,
                isDeleted: 0,
            }
        };

        const condition = {
            isDeleted: false,
        };

        const limit = (ctx.query.limit || 0) * 1 || config.pagingDefaultLimit;
        const offset = (ctx.query.offset || 0) * 1 || 0;

        if (ctx.query.userId !== undefined) {
            condition.userId = ObjectID(ctx.query.userId);
        }

        if (typeof ctx.query.isPublished === 'string' && ctx.query.isPublished) {
            condition.isPublished = ctx.query.isPublished.toLowerCase() === 'true';
        }

        const collection = getDbCollection.landings(ctx);

        const r = await ctx.mongoTransaction(
            collection,
            'find',
            [
                condition,
                options
            ]
        )

        const defaultLanding = _.omit(getDefaultLanding(), ['landing', 'isDeleted']);

        const landings = await r.skip(offset).limit(limit).toArray();

        ctx.body = {
            limit: limit,
            offset: offset,
            total: await r.count(),
            landings: landings.map(l => Object.assign({}, defaultLanding, l))
        }

        ctx.status = 200;

    } catch (err) {
        throw err
    }
    next();
};
