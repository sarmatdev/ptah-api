"use strict";

const _ = require('lodash');

const config = require('../../config/config');

const {Mail} = require('./mail.class');
const {User} = require('./user.class');
const {UserSession} = require('./user-session.class');
const {UserUploads} = require('./user-uploads.class');
const {TariffsList} = require('./tariffs-list.class')
const {BACKEND_FEATURE_CODE_UPLOADS_QUOTE} = require('./feature.class')

module.exports = {

    Mail: function (ctx) {
        const params = {
            emailPostmarkToken: config.emailpostmarkToken,
            emailSenderFrom: config.emailSenderFrom,
            publicHost: config.publicHost,
        }

        const templates = {
            emailTemplateConfirmEmail: config.emailTemplateConfirmEmail,
            emailTemplateUserSignupLocal: config.emailTemplateUserSignupLocal,
            emailTemplateUserSignupSocial: config.emailTemplateUserSignupSocial,
            emailTemplateRestorePassword: config.emailTemplateRestorePassword,
            emailTemplateRestorePasswordRequest: config.emailTemplateRestorePasswordRequest,
        }

        return new Mail(ctx, params, templates);
    },

    User: function (ctx, user) {
        if (!ctx) {
            throw new Error('no ctx')
        }

        const params = {
            passwordSecret: config.passwordSecret,
            restorePasswordSecret: config.restorePasswordSecret,
            restorePasswordLifetime: config.restorePasswordLifetime,
            confirmEmailSecret: config.confirmEmailSecret,
            confirmEmailLifetime: config.confirmEmailLifetime,
        }

        return new User(ctx, params, user);
    },

    UserSession: function(ctx) {
        if (!ctx) {
            throw new Error('no ctx')
        }

        const params = {
            authTokenSecret: config.authTokenSecret,
            accessTokenLifetime: config.accessTokenLifetime,
            refreshTokenLifetime: config.refreshTokenLifetime,
            authCheckUserAgent: config.authCheckUserAgent,
            authCheckIP: config.authCheckIP,
        }

        return new UserSession(ctx, params);
    },

    UserUploads: async function(ctx, params) {
        if (!ctx) {
            throw new Error('no ctx')
        }

        params = params || {};

        const user = params.user || _.get(ctx, config.userStatePath);

        let maxTotalFilesSize = -1;

        const tariffsList = new TariffsList(ctx);
        const tariff = await tariffsList.GetById(user.tariff);

        if (tariff) {
            const feature = tariff.features.find(f => f.feature.code === BACKEND_FEATURE_CODE_UPLOADS_QUOTE);
            if (feature) {
                maxTotalFilesSize = feature.volume * 1024 * 1024;
            }
        }

        params = Object.assign({}, {
            userId: user.GetId ? user.GetId() : user._id.toString(),
            maxFileSize: config.maxFileSize,
            maxTotalFilesSize: maxTotalFilesSize,
        }, params || {});


        return new UserUploads(ctx, params);
    }
};
