"use strict";

const getDbCollection = require('../utils/get-db-collection');
const subscriptionStates = require('./subscription-state');
const {PUBLIC_FIELDS} = require('./user.class');

class UsersList {

    constructor(ctx) {
        this.ctx = ctx;
        this.collection = getDbCollection.users(ctx);
        return this;
    }

    async GetActive() {
        const condition = {
            isDeleted: false
        }
        return this.find(condition);
    }

    async GetByFilters(filters = {}, limit = 100, offset = 0) {
        const condition = {
            isDeleted: false
        }

        filters = filters || {};

        if (filters.hasOwnProperty('subscriptionState')) {
            condition.subscriptionState = filters.subscriptionState;
        }

        if (filters.hasOwnProperty('emailConfirmed')) {
            condition.emailConfirmed = filters.emailConfirmed;
        }

        if (filters.hasOwnProperty('mailchimpIntegration')) {
            condition.mailchimpIntegration = filters.mailchimpIntegration;
        }

        if (filters.hasOwnProperty('tariff')) {
            condition.tariff = filters.tariff;
        }

        const projection = {};
        PUBLIC_FIELDS.forEach(f => projection[f] = 1);

        const cursor = await this.find(condition, projection);

        return {
            limit: limit,
            offset: offset,
            total: await cursor.count(),
            users: await cursor.skip(offset).limit(limit).toArray(),
        }
    }

    async GetSuspendedBilling() {
        const todayBegin = new Date((new Date()).toISOString().split('T')[0] + 'T00:00:00');

        const daysAgo = new Date();
        daysAgo.setDate(todayBegin.getDate() - 3);

        const condition = {
            tariff: {"$ne": null},
            subscriptionState: {"$in": [subscriptionStates.active, subscriptionStates.cancelled]},
            "$or": [
                {lastBillingDate: {"$ne": null}},
                {lastBillingDate: {"$gte": daysAgo}},
                {lastBillingDate: {"$lt": todayBegin}},
            ],
            isDeleted: false,
        }
        const cursor = this.find(condition);
        return cursor.toArray();
    }

    async GetActiveBilling() {
        const todayBegin = new Date((new Date()).toISOString().split('T')[0] + 'T00:00:00');

        const condition = {
            tariff: {"$ne": null},
            subscriptionState: {"$in": [subscriptionStates.active, subscriptionStates.cancelled]},
            "$or": [
                {lastBillingDate: {"$eq": null}},
                {lastBillingDate: {"$lt": todayBegin}},
            ],
            isDeleted: false,
        }
        const cursor = this.find(condition);
        return cursor.toArray();
    }

    async find(conditions, projection) {
        conditions = conditions || {};
        projection = projection || {};

        const options = {
            projection: projection,
        };

        const query = Object.assign({}, conditions, {})

        try {
            return this.ctx.mongoTransaction(
                this.collection,
                'find',
                [
                    query,
                    options
                ]
            )

            /*const result = await r.toArray();

            if (!result) {
                return null;
            }

            return result;*/

        } catch (err) {
            throw err;
        }
    }
}


module.exports = {
    UsersList
};
