"use strict";

const ObjectID = require('bson-objectid');

const config = require('../../config/config');
const Factory = require('./factory');
const getDbCollection = require('../utils/get-db-collection');

class FeatureCheck {
    static codeMap = {
        landings_count: this.LandingsCountCheck,
        uploads_quote: this.UploadsQuoteCheck,
        own_domain: this.OwnDomainCheck,
    }

    // value - maximum allowed number of landings
    static async LandingsCountCheck(ctx, userId, value, includeEqual = false) {
        value = (value || 0) * 1;

        const condition = {
            isDeleted: false,
            userId: ObjectID(userId),
        };

        const collection = getDbCollection.landings(ctx);

        let count = 0;

        try {
            const r = await ctx.mongoTransaction(
                collection,
                'find',
                [
                    condition,
                    {projection: {_id: 1}},
                ]
            )

            count = await r.count();
        } catch (err) {
            return false;
        }

        return includeEqual ? count <= value : count < value;
    }

    // value - maximum allowed quote in megabytes
    static async UploadsQuoteCheck(ctx, userId, value, includeEqual = false) {
        const _value = (value || 0) * 1024 * 1024;

        const user = Factory.User(ctx);
        await user.FindById(userId);

        const params = {
            user: user,
        }

        const userUploads = await Factory.UserUploads(ctx, params);
        const spaceUsed = await userUploads.getUserUploadsSize();

        return includeEqual ? spaceUsed <= _value : spaceUsed < _value;
    }

    static async OwnDomainCheck(ctx, userId, value, includeEqual = false, landing = null) {
        value = (value || 0) * 1;

        if (value === 1) {
            return true;
        }

        if (landing) {
            return landing.domain.indexOf(config.landingsPublishingHost) >= 0;
        }

        const condition = {
            isDeleted: false,
            userId: ObjectID(userId),
        };

        const collection = getDbCollection.landings(ctx);

        let result = [];

        try {
            const r = await ctx.mongoTransaction(
                collection,
                'find',
                [
                    condition,
                    {projection: {landing: 0}}
                ]
            )

            result = await r.toArray();
        } catch (err) {
            return false;
        }

        for (let landing of result) {
            if (landing.isPublished && landing.domain.indexOf(config.landingsPublishingHost) < 0) {
                return false;
            }
        }

        return true;
    }

    static async CheckByCode(code, ctx, userId, value, includeEqual, landing) {
        return await this.codeMap[code](ctx, userId, value, includeEqual, landing);
    }
}

module.exports = {
    FeatureCheck
}
