'use strict';
const _ = require('lodash');
const config = require('../../../config/config');

module.exports = async (ctx, next) => {
    try {
        ctx.status = 200;
        ctx.body = _.get(ctx, config.userStatePath);
    } catch (err) {
        throw err
    }
    next();
};
