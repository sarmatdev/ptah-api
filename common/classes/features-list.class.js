"use strict";

const getDbCollection = require('../utils/get-db-collection');
const {FEATURE_PUBLIC_FIELDS} = require('./feature.class');

class FeaturesList {

    constructor(ctx) {
        this.ctx = ctx;
        this.collection = getDbCollection.features(ctx);
        return this;
    }

    async GetAll() {
        const condition = {}
        return this.find(condition);
    }

    async find(conditions) {
        conditions = conditions || {};

        const options = {
            projection: {}
        };

        FEATURE_PUBLIC_FIELDS.forEach(f => options.projection[f] = 1);

        const defaultConditions = {
            // isArchived: false,
        };

        const query = Object.assign({}, conditions, defaultConditions)

        try {
            const r = await this.ctx.mongoTransaction(
                this.collection,
                'find',
                [
                    query,
                    options
                ]
            )

            const result = await r.toArray();

            if (!result) {
                return null;
            }

            return result;

        } catch (err) {
            throw err;
        }
    }
}


module.exports = {
    FeaturesList
};
