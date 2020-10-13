"use strict";

const ObjectID = require('bson-objectid');

const getDbCollection = require('../utils/get-db-collection');
const {Tariff, TARIFF_PUBLIC_FIELDS, TARIFF_FEATURES_FIELD} = require('./tariff.class');
const {Feature} = require('./feature.class');


class TariffsList {

    constructor(ctx) {
        this.ctx = ctx;
        this.collection = getDbCollection.tariffs(ctx);
        return this;
    }

    async GetAll() {
        const condition = {}
        return this.find(condition);
    }

    async GetActive() {
        const condition = {isArchived: false}
        return this.find(condition);
    }

    async GetDefault() {
        const condition = {isDefault: true, dayPrice: 0, isArchived: false}
        const t = await this.find(condition);
        return t[0] || null;
    }

    async GetById(id) {
        if (!ObjectID.isValid(id)) {
            return null;
        }
        const condition = {_id: ObjectID(id)}
        const t = await this.find(condition);
        return t[0] || null;
    }

    async GetActiveByFeature(featureId) {
        return this.getByFeature(featureId, true);
    }

    async GetAllByFeature(featureId) {
        return this.getByFeature(featureId, false);
    }

    async SetAsDefault(id) {
        if (!ObjectID.isValid(id)) {
            return null;
        }
        const dt = new Tariff(this.ctx);
        await dt.FindById(id);
        if (!dt) {
            return null
        }

        const condition = {_id: {"$ne": ObjectID(id)}, isDefault: true, isArchived: false}
        const tariffs = await this.find(condition, false);

        for (let t of tariffs) {
            const _t = new Tariff(this.ctx, t);
            await _t.UnsetDefault();
        }

        return this.enhance([await dt.SetDefault()]);
    }

    async getByFeature(featureId, onlyActive = true) {
        if (!ObjectID.isValid(featureId)) {
            return null;
        }

        onlyActive = !!onlyActive;

        const condition = {}
        if (onlyActive) {
            condition.isArchived = false;
        }

        const fieldName = `${TARIFF_FEATURES_FIELD}.${featureId}`;
        condition[fieldName] = {'$exists': true};
        return this.find(condition);
    }

    async find(conditions, enhance = true) {
        conditions = conditions || {};

        const options = {
            sort: {_id: -1},
            projection: {}
        };

        TARIFF_PUBLIC_FIELDS.forEach(f => options.projection[f] = 1);

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

            if (!enhance) {
                return result;
            }

            return await this.enhance(result);

        } catch (e) {
            throw e;
        }
    }

    async enhance(tariffsList) {
        const feature = new Feature(this.ctx);

        for (let tariff of tariffsList) {
            const features = [];
            const tariffFeatures = tariff[TARIFF_FEATURES_FIELD];
            for (let featureDesc of tariffFeatures) {
                const featureObj = await feature.FindById(featureDesc.id);
                const f = {
                    feature: featureObj,
                    volume: featureDesc.volume,
                }
                features.push(f);
            }

            tariff[TARIFF_FEATURES_FIELD] = features;
        }

        return tariffsList;
    }
}


module.exports = {
    TariffsList
};
