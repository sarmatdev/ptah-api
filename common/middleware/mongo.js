'use strict';

/* inspired by koa-mongo-driver npm package
 * https://www.npmjs.com/package/koa-mongo-driver
 * except this implementation does no modify ctx.body on db connection errors
 * but simply throws the exception
 */

const DSNParser = require('dsn-parser');
const {MongoClient} = require('mongodb');

const defaultConnectionOptions = {
    useNewUrlParser: true,
    useUnifiedTopology: true
};

function getFnParamNames(fn) {
    return fn
        .toString()
        .match(/\(.*?\)/)[0].replace(/[()]/gi, '')
        .replace(/\s/gi, '')
        .split(',');
}

const mongo = (dsn, customConnectionOptions, enableTransactions = false) => {
    const connectionOptions = Object.assign(
        {},
        defaultConnectionOptions,
        customConnectionOptions,
    );

    const dsnParsed = new DSNParser(dsn);
    const dbName = dsnParsed.get('database');

    const transactionOptions = {
        readPreference: 'primary',
        readConcern: {level: 'local'},
        writeConcern: {w: 'majority'}
    };

    return async (ctx, next) =>
        MongoClient.connect(dsn, connectionOptions)
            .then(async (connection) => {
                ctx.mongoConnection = connection;
                ctx.mongoSession = ctx.mongoConnection.startSession();
                ctx.mongo = ctx.mongoConnection.db(dbName);

                ctx.mongoTransaction = async function (collection, fn, args) {

                    try {
                        let result;
                        if (!enableTransactions) {
                            result = await collection[fn](...args);
                        } else {

                            if (!ctx.transactionStarted) {
                                ctx.transactionStarted = true;
                            }

                            const fnParamsNames = getFnParamNames(collection[fn]);
                            const optionsArgIndex = fnParamsNames.indexOf('options');
                            args[optionsArgIndex] = args[optionsArgIndex] || {};
                            args[optionsArgIndex].session = ctx.mongoSession;

                            const transactionResults = await ctx.mongoSession.withTransaction(async () => {
                                result = await collection[fn](...args);
                            }, transactionOptions);

                            if (!transactionResults) {
                                // noinspection ExceptionCaughtLocallyJS
                                throw new Error('transaction failed');
                            }
                        }
                        return result;
                    } catch (e) {
                        throw e;
                    }
                }

                ctx.commitTransaction = async function () {
                    if (ctx.mongoSession && !!ctx.transactionStarted) {
                        await ctx.mongoSession.commitTransaction();

                        ctx.mongoSession = ctx.mongoConnection.startSession();
                        ctx.transactionStarted = false;
                    }
                }
                return await next();
            })
        .then(async () => {
            if (ctx.mongoSession && !!ctx.transactionStarted) {
                await ctx.mongoSession.commitTransaction();
            }
            if (ctx.mongoConnection) {
                await ctx.mongoConnection.close();
            }
        })
        .catch(async (error) => {
            if (ctx.mongoSession && !!ctx.transactionStarted) {
                await ctx.mongoSession.abortTransaction();
            }
            if (ctx.mongoConnection) {
                await ctx.mongoConnection.close();
            }
            throw error;
        });
};

module.exports = {
    mongo,
    defaultConnectionOptions,
}

