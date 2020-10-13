'use strict';
const chai = require('chai')
const spies = require('chai-spies')
chai.use(spies)

const fs = require('fs');
const path = require('path');
const {v4: uuidv4} = require('uuid');
const DSNParser = require('dsn-parser');
const MongoClient = require('mongodb').MongoClient;

const config = require('./../../config/config');
const getDbCollection = require('../../common/utils/get-db-collection');
const {User} = require('../../common/classes/user.class');
const {UserSession} = require('../../common/classes/user-session.class');
const {AccountingUser, AccountingInternal, OPERATION_CODE_TOPUP, OPERATION_CODE_TARIFF} = require('../../common/classes/accounting.class');
const generatePassword = require('../../common/utils/password').generatePassword;

const testTariffId = '5f6a5e4c046d52d20b9061bd';


const getRequestId = () => Math.random().toString(36).substring(2) +
    Math.random().toString(36).substring(2)

const getRedirect = () => {
    function redirect() {
    }

    return chai.spy(redirect)
}

const getThrow = () => {
    return chai.spy(function () {
    })
}


const getFakeCtx = (mongoClient, dbName, session, query, header) => {
    return {
        id: getRequestId(),
        log: console,
        session: session || {},
        query: query || {},
        header: header || {},
        request: {
            ip: '127.0.0.1',
        },
        body: undefined,
        status: 200,
        redirect: getRedirect(),
        throw: getThrow(),
        mongoConnection: mongoClient,
        mongoSession: mongoClient.startSession(),
        mongo: mongoClient.db(dbName),
        mongoTransaction: async function (collection, fn, args) {
            return await collection[fn](...args);
        }
    }
}

const dsn = new DSNParser(config.mongoDsn);
const dbName = dsn.get('database');

// Use connect method to connect to the server
MongoClient.connect(config.mongoDsn, {useUnifiedTopology: true}, async function (err, client) {
    if (err !== null) {
        console.error(err);
        client.close();
        process.exit(1);
    }

    const fakeCtx = getFakeCtx(client, dbName);

    const skipResetCollection = ['features', 'tariffs', 'tariffsHistory'];
    for (let key of Object.keys(getDbCollection)) {
        if (skipResetCollection.indexOf(key) >= 0) {
            continue;
        }
        let coll = getDbCollection[key](fakeCtx);
        await coll.deleteMany({});
    }

    const paramsUser = {
        passwordSecret: '111',
        restorePasswordSecret: '111',
        restorePasswordLifetime: 1,
        confirmEmailSecret: '111',
        confirmEmailLifetime: 1,
    }

    const paramsUserSession = {
        authTokenSecret: config.authTokenSecret,
        accessTokenLifetime: config.accessTokenLifetime,
        refreshTokenLifetime: config.refreshTokenLifetime,
        authCheckUserAgent: config.authCheckUserAgent,
        authCheckIP: config.authCheckIP,
    }

    const result = [];

    let i = 0;
    try {
        for (const uuid of [uuidv4(), uuidv4()]) {
            const user = new User(fakeCtx, paramsUser);
            await user.CreateUser(uuid, uuid + '@test.com', generatePassword(), 'unit-test');
            await user.SetTariff(testTariffId);
            await user.SetSubscriptionState(0);
            if (i) {
                await user.EnableMailchimpIntegration(uuidv4());
            } else {
                await user.GrantAdmin();
            }

            const us = new UserSession(fakeCtx, paramsUserSession);

            const s = await us.Create(user.GetId(), '::ffff:127.0.0.1', '');

            result.push(Object.assign({}, user.GetUser(), s));

            const au = new AccountingUser(fakeCtx);
            await au.AddUserOperation(user.GetId(), 100 * (i+1), OPERATION_CODE_TOPUP, 'user unit-test topup', '444444******4444');
            await au.AddUserOperation(user.GetId(), -10 * (i+1), OPERATION_CODE_TARIFF, 'user unit-test tariff payment');

            const ai = new AccountingInternal(fakeCtx);
            await ai.AddUserOperation(user.GetId(), 10 * (i+1), OPERATION_CODE_TARIFF, 'user unit-test tariff payment');

            i++;
        }
    } catch (e) {
        console.error(e);
        client.close();
        process.exit(1);
    }

    const filepath = path.resolve(__dirname, 'fake_users.json');
    fs.writeFileSync(filepath, JSON.stringify(result));

    client.close();
    process.exit(0);
});
