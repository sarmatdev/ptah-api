'use strict';

const ObjectID = require("bson-objectid");

const findLandings = require('./helpers/find-landings');
const getLandingMeta = require('./helpers/get-landing-meta');
const updateLandingData = require('./helpers/update-landing-data');
const deletePublishedLanding = require('./helpers/delete-published-landing');
const getDbCollection = require('../../../common/utils/get-db-collection');

module.exports = async (ctx, next) => {
    const id = ctx.params.id;
    let data = {};
    try {
        const landings = await findLandings(ctx, false, [id]);
        const landing = landings[0];
        if (landing) {

            // remove published landing (and external domain config too), if exists
            await deletePublishedLanding(id);

            data = updateLandingData(ctx, landing, {
                isPublished: false
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
