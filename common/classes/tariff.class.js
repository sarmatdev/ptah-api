"use strict";

const _ = require('lodash');
const ObjectID = require('bson-objectid');

const config = require('../../config/config')
const getDbCollection = require('../utils/get-db-collection');

const TARIFF_FEATURES_FIELD = 'features'

const TARIFF_PUBLIC_FIELDS = ['_id', 'name', 'description', 'dayPrice', 'periodDays', 'isArchived',
    'isDefault', TARIFF_FEATURES_FIELD, 'createDate', 'updateDate'];

function getDefaultTariff() {
    const now = (new Date).toISOString();
    const id = ObjectID();
    return {
        _id: id,
        name: '',
        description: '',
        dayPrice: 0,
        periodDays: 30,
        isDefault: false,
        features: [],
        createDate: now,
        updateDate: now,
        isArchived: false,
    }
}

class Tariff {

    omitFields = [];

    publicFields = TARIFF_PUBLIC_FIELDS;

    constructor(ctx, tariff = null) {
        this.ctx = ctx;
        this.collection = getDbCollection.tariffs(ctx);
        this.collectionHistory = getDbCollection.tariffsHistory(ctx);
        this.tariff = Object.assign({}, getDefaultTariff(), tariff ? tariff : {});
        return this;
    }

    async FindById(id) {
        if (!ObjectID.isValid(id)) {
            return null;
        }
        const condition = {_id: ObjectID(id)}
        return await this.find(condition);
    }

    GetId() {
        return this.tariff._id.toString();
    }

    GetTariff() {
        return _.pick(this.tariff, this.publicFields);
    }

    async Create(name, description, dayPrice, periodDays, features) {

        if (!name) {
            return null;
        }
        dayPrice = dayPrice || 0;
        periodDays = periodDays || 30;

        features = features || {};

        try {
            const tariff = {
                name: name,
                description: description,
                dayPrice: dayPrice,
                periodDays: periodDays,
                features: features,
            }

            return await this.updateTariff(Object.assign({}, getDefaultTariff(), tariff));
        } catch (e) {
            throw e
        }
    }

    async Update(params) {

        const updatableFields = ['name', 'description', 'dayPrice', 'periodDays', 'features', 'isArchived'];
        const t = _.pick(params, updatableFields);

        if (!t.name) {
            delete t.name;
        }
        if (!t.description) {
            delete t.description;
        }
        if (!t.periodDays) {
            delete t.periodDays;
        }

        try {
            return await this.updateTariff(t);
        } catch (e) {
            throw e
        }
    }

    async MarkArchived() {
        try {
            return await this.updateTariff({
                isArchived: true,
            });
        } catch (e) {
            throw e
        }
    }

    async UnmarkArchived() {
        try {
            return await this.updateTariff({
                isArchived: false,
            });
        } catch (e) {
            throw e
        }
    }

    async SetDefault() {
        if (this.tariff.isDefault) {
            return this.GetTariff();
        }
        try {
            return await this.updateTariff({
                isDefault: true,
            });
        } catch (e) {
            throw e
        }
    }

    async UnsetDefault() {
        if (!this.tariff.isDefault) {
            return this.GetTariff();
        }
        try {
            return await this.updateTariff({
                isDefault: false,
            });
        } catch (e) {
            throw e
        }
    }

    async find(conditions) {
        const options = {
            projection: {}
        };
        this.omitFields.forEach((field) => {
            options.projection[field] = 0
        });

        const defaultConditions = {
            //isArchived: false,
        };

        const query = Object.assign({}, conditions, defaultConditions)

        try {
            const result = await this.ctx.mongoTransaction(
                this.collection,
                'findOne',
                [
                    query,
                    options
                ]
            )

            if (!result) {
                return null;
            }

            result._id = ObjectID(result._id.toString());

            return this.fillTariff(Object.assign({}, getDefaultTariff(), result));

        } catch (err) {
            throw e
        }
    }

    fillTariff(tariffObject) {
        Object.assign(this.tariff, tariffObject);
        return this.GetTariff();
    }

    async updateTariff(tariffObject) {
        try {
            tariffObject.updateDate = (new Date).toISOString();

            delete tariffObject._id;

            await this.ctx.mongoTransaction(
                this.collection,
                'updateOne',
                [
                    {_id: this.tariff._id},
                    {$set: tariffObject},
                    {upsert: true}
                ]
            )

            const userId = _.get(this.ctx, config.userIdStatePath);
            const historyObject = Object.assign({}, this.tariff, {tariffId: this.tariff._id, currentUserId: userId});
            delete historyObject._id;

            await this.ctx.mongoTransaction(
                this.collection,
                'insertOne',
                [
                    historyObject
                ]
            )

            return this.fillTariff(tariffObject);
        } catch (e) {
            throw e
        }
    }
}


module.exports = {
    Tariff,
    TARIFF_PUBLIC_FIELDS,
    TARIFF_FEATURES_FIELD
};
