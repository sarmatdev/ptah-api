"use strict";
const ObjectID = require('bson-objectid');

const getDbCollection = require('../utils/get-db-collection');

const OPERATION_CODE_TARIFF = 'tariff';
const OPERATION_CODE_TOPUP = 'topup';

class AbstractAccounting {
    ctx = null;
    collection = null;

    constructor(ctx, collection) {
        this.ctx = ctx;
        this.collection = collection;
    }

    async GetUserBalance(userId, operationCode = '') {
        try {

            const match = {};

            userId = userId || '';
            if (userId) {
                match.userId = ObjectID(userId);
            }

            operationCode = operationCode || '';
            if (operationCode) {
                match.operationCode = operationCode;
            }

            const pipeline = [
                {'$match': match},
                {'$group': {'_id': '$userId', 'balance': {'$sum': '$amount'}}},
            ];

            const options = {};

            const r = await this.ctx.mongoTransaction(
                this.collection,
                'aggregate',
                [
                    pipeline,
                    options
                ]
            )

            const result = await r.toArray();

            if (!result || !result.length) {
                return 0
            }

            return result[0].balance;

        } catch (e) {
            throw e;
        }
    }

    async GetUserHistory(userId, operationCode = '', limit = 100, offset = 0) {

        const match = {};

        userId = userId || '';
        if (userId) {
            match.userId = ObjectID(userId);
        }

        operationCode = operationCode || '';
        if (operationCode) {
            match.operationCode = operationCode;
        }

        const options = {
            sort: {_id: -1},
            projection: {}
        };

        try {
            const r = await this.ctx.mongoTransaction(
                this.collection,
                'find',
                [
                    match,
                    options
                ]
            )

            const count = await r.count();
            const items = await r.skip(offset).limit(limit).toArray();

            return {
                limit: limit,
                offset: offset,
                count: count,
                items: items,
                currency: 'USD',
            }

        } catch (err) {
            throw e;
        }
    }

    async AddUserOperation(userId, amount, operationCode, name, mask) {
        const operation = {
            userId: ObjectID(userId),
            createDate: (new Date).toISOString(),
            amount: amount,
            name: name || '',
            operationCode: operationCode || '',
            mask: mask || '',
            ip: this.ctx.request.ip || ''
        }

        try {
            await this.ctx.mongoTransaction(
                this.collection,
                'insertOne',
                [
                    operation
                ]
            )
        } catch (err) {
            throw err
        }
    }
}


class AccountingUser extends AbstractAccounting {

    constructor(ctx) {
        super(ctx, getDbCollection.accountingUsers(ctx));
        return this;
    }
}


class AccountingInternal extends AbstractAccounting {

    constructor(ctx) {
        super(ctx, getDbCollection.accountingInternal(ctx));
        return this;
    }
}

module.exports = {
    AccountingUser,
    AccountingInternal,
    OPERATION_CODE_TARIFF,
    OPERATION_CODE_TOPUP,
}
