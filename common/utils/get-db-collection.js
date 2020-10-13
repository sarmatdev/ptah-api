'use strict';

const config = require('../../config/config');

module.exports.landings = function (ctx) {
    return ctx.mongo.collection(config.dbLandingsCollectionName)
};

module.exports.users = function (ctx) {
    return ctx.mongo.collection(config.dbUsersCollectionName)
};

module.exports.usersHistory = function (ctx) {
    return ctx.mongo.collection(config.dbUsersHistoryCollectionName)
};

module.exports.usersSessions = function (ctx) {
    return ctx.mongo.collection(config.dbUsersSessionsCollectionName)
};

module.exports.usersUploads = function (ctx) {
    return ctx.mongo.collection(config.dbUsersUploadsCollectionName)
};

module.exports.features = function (ctx) {
    return ctx.mongo.collection(config.dbUsersFeaturesCollectionName)
};

module.exports.tariffs = function (ctx) {
    return ctx.mongo.collection(config.dbUsersTariffsCollectionName)
};

module.exports.tariffsHistory = function (ctx) {
    return ctx.mongo.collection(config.dbUsersTariffsHistoryCollectionName)
};


module.exports.accountingUsers = function (ctx) {
    return ctx.mongo.collection(config.dbAccountingUsersCollectionName)
};

module.exports.accountingInternal = function (ctx) {
    return ctx.mongo.collection(config.dbAccountingInternalCollectionName)
};
