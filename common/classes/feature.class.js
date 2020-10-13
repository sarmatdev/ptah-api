"use strict";

const _ = require('lodash');
const ObjectID = require('bson-objectid');

const getDbCollection = require('../utils/get-db-collection');
const {FEATURE_NAME_EMPTY, FEATURE_CODE_EMPTY, FEATURE_CODE_ALREADY_EXISTS} = require('../../config/errors');

const FEATURE_PUBLIC_FIELDS = ['_id', 'name', 'description', 'code', 'isBackend', 'isMeasurable',
    'measureName', 'createDate', 'updateDate', 'isArchived'];

const BACKEND_FEATURE_CODE_LANDINGS_COUNT = 'landings_count'
const BACKEND_FEATURE_CODE_UPLOADS_QUOTE = 'uploads_quote'
const BACKEND_FEATURE_CODE_OWN_DOMAIN = 'own_domain'

function getDefaultFeature() {
    const now = (new Date).toISOString();
    const id = ObjectID();
    return {
        _id: id,
        name: '',
        description: '',
        code: '',
        isBackend: false,
        isMeasurable: false,
        measureName: '',
        createDate: now,
        updateDate: now,
        isArchived: false
    }
}

class Feature {

    omitFields = [];

    publicFields = FEATURE_PUBLIC_FIELDS;

    constructor(ctx) {
        this.ctx = ctx;
        this.collection = getDbCollection.features(ctx);
        this.feature = getDefaultFeature();
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
        return this.feature._id.toString();
    }

    GetFeature() {
        return _.pick(this.feature, this.publicFields);
    }

    async Create(name, description, code, isMeasurable, measureName) {

        if (!name) {
            throw new Error(FEATURE_NAME_EMPTY);
        }
        if (!code) {
            throw new Error(FEATURE_CODE_EMPTY);
        }

        isMeasurable = !!isMeasurable;
        measureName = measureName || ''
        if (!measureName) {
            isMeasurable = false;
        }

        try {
            const feature = {
                name: name,
                description: description,
                code: code,
                isMeasurable: isMeasurable,
                measureName: measureName,
            }

            return await this.updateFeature(Object.assign({}, getDefaultFeature(), feature));
        } catch (e) {
            throw e
        }
    }

    async Update(params) {

        const updatableFields = ['name', 'description', 'code', 'isMeasurable', 'measureName', 'isArchived'];
        const f = _.pick(params, updatableFields);

        if (!f.name) {
            delete f.name;
        }

        if (!f.description) {
            delete f.description;
        }

        if (!f.code) {
            delete f.code;
        }

        if (!f.measureName) {
            f.isMeasurable = false;
        }

        try {
            return await this.updateFeature(f);
        } catch (e) {
            throw e
        }
    }

    async MarkArchived() {
        try {
            return await this.updateFeature({
                isArchived: true,
            });
        } catch (e) {
            throw e
        }
    }

    async UnmarkArchived() {
        try {
            return await this.updateFeature({
                isArchived: false,
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
            // isArchived: false,
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

            return this.fillFeature(Object.assign({}, getDefaultFeature(), result));

        } catch (e) {
            throw e
        }
    }

    async checkIsFeatureCodeExists(code) {
        const options = {
        };

        const query = {
            _id: {'$ne': this.feature._id},
            code: code,
        };

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
                return false;
            }

            return result.length > 0

        } catch (e) {
            throw e
        }
    }

    fillFeature(featureObject) {
        Object.assign(this.feature, featureObject);
        return this.GetFeature();
    }

    async updateFeature(featureObject) {
        try {
            if (featureObject.code) {
                const codeExists = await this.checkIsFeatureCodeExists(featureObject.code);
                if (codeExists) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error(FEATURE_CODE_ALREADY_EXISTS);
                }
            }

            featureObject.updateDate = (new Date).toISOString();
            delete featureObject._id;


            await this.ctx.mongoTransaction(
                this.collection,
                'updateOne',
                [
                    {_id: this.feature._id},
                    {$set: featureObject},
                    {upsert: true}
                ]
            )

            return this.fillFeature(featureObject);
        } catch (e) {
            throw e
        }
    }
}


module.exports = {
    Feature,
    FEATURE_PUBLIC_FIELDS,
    BACKEND_FEATURE_CODE_LANDINGS_COUNT,
    BACKEND_FEATURE_CODE_UPLOADS_QUOTE,
    BACKEND_FEATURE_CODE_OWN_DOMAIN,
};
