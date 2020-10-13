'use strict';

const _ = require('lodash');
const urlJoin = require('url-join');

const config = require('../../../config/config');
const {AUTHENTICATION_ERROR} = require('../../../config/errors');
const Factory = require('../../../common/classes/factory');

module.exports = async (ctx, next) => {
    try {

        const userId = _.get(ctx, config.userIdStatePath);
        if (!userId) {
            return ctx.throw(401, AUTHENTICATION_ERROR);
        }

        const userUploads = await Factory.UserUploads(ctx);

        const uploads = await userUploads.FindAll();
        const totalSize = await userUploads.getUserUploadsSize();
        const quoteRest = await userUploads.GetUserQuoteRest();

        ctx.body = {
            uploads: uploads.map(u => {
                u.url = urlJoin([config.cdnHost, u.url]);
                return u
            }),
            count: uploads.length,
            totalSize: totalSize,
            quoteRest: quoteRest,
        }
    } catch (err) {
        throw err
    }
    next();
};
