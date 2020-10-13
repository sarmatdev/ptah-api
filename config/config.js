'use strict';

const path = require('path');

const envUtils = require('../common/utils/env');
const getEnvVariable = envUtils.getEnvVariable;
const getEnvVariableArray = envUtils.getEnvVariableArray;

const landingsHtmlDir = getEnvVariable('LANDINGS_HTML_DIR', 'landings_html');
const nginxConfigsDir = getEnvVariable('NGINX_CONFIGS_DIR', 'sites_enabled');

const config = {
    serverPort: +getEnvVariable('SERVER_PORT', 3000),

    mongoDsn: getEnvVariable('MONGO_DSN', 'mongodb+srv://sarmat:AdUN3rcUbpEVuif@cluster0.awznj.mongodb.net/test'),

    publicHost: getEnvVariable('PUBLIC_HOST', 'http://127.0.0.1'),

    landingsPublishingHost: getEnvVariable('LANDINGS_PUBLISHING_HOST', 'http://127.0.0.1'),

    dbLandingsCollectionName: 'ptah-landings',
    dbUsersCollectionName: 'ptah-users',
    dbUsersHistoryCollectionName: 'ptah-users-history',
    dbUsersSessionsCollectionName: 'ptah-users-sessions',
    dbUsersUploadsCollectionName: 'ptah-users-uploads',
    dbUsersFeaturesCollectionName: 'ptah-features',
    dbUsersTariffsCollectionName: 'ptah-tariffs',
    dbUsersTariffsHistoryCollectionName: 'ptah-tariffs-history',
    dbAccountingUsersCollectionName: 'ptah-accounting-users',
    dbAccountingInternalCollectionName: 'ptah-accounting-internal',
    dbUserPaymentDataCollectionName: 'ptah-user-payment-data',

    routesPrefix: getEnvVariable('ROUTES_PREFIX', '/api/v1'),

    adminRoutesNamespace: '/admin',
    authRoutesNamespace: '/auth',
    landingsRoutesNamespace: '/landings',
    mailchimpRoutesNamespace: '/mailchimp',
    userRoutesNamespace: '/user',
    uploadRoutesNamespace: '/upload',
    tariffsRoutesNamespace: '/tariffs',
    webhooksRoutesNamespace: '/webhooks',

    landingsHtmlDir: path.resolve(landingsHtmlDir),
    nginxConfigsDir: path.resolve(nginxConfigsDir),
    nginxConfigTemplatePath: path.resolve('templates/nginx.conf.template'),

    sentryDsn: getEnvVariable('SENTRY_DSN', 'https://f1fe9d5210df4b82aabe49839b197763@sentry.tst.protocol.one/4'),

    mailchimpMetadataUrl: getEnvVariable('MAILCHIMP_METADATA_URL', 'https://login.mailchimp.com/oauth2/metadata'),
    mailchimpMaillistsPath: getEnvVariable('MAILCHIMP_MAILLISTS_PATH', '/3.0/lists'),

    userStatePath: 'state.user',
    userIdStatePath: 'state.user._id',

    corsValidOrigins: getEnvVariableArray('CORS_VALID_ORIGINS', '*'),

    authCheckUserAgent: getEnvVariable('AUTH_CHECK_USER_AGENT', '') === 'true',
    authCheckIP: getEnvVariable('AUTH_CHECK_IP', '') === 'true',

    authTokenSecret: getEnvVariable('AUTH_TOKEN_SECRET', 'secret'),
    accessTokenLifetime: +getEnvVariable('ACCESS_TOKEN_LIFETIME', 1) * 60 * 60,
    refreshTokenLifetime: +getEnvVariable('REFRESH_TOKEN_LIFETIME', 72) * 60 * 60,

    passwordSecret: getEnvVariable('PASSWORD_SECRET', 'secret'),

    restorePasswordSecret: getEnvVariable('RESTORE_PASSWORD_SECRET', ''),
    restorePasswordLifetime: +getEnvVariable('RESTORE_PASSWORD_LIFETIME', 15) * 60,

    confirmEmailSecret: getEnvVariable('CONFIRM_EMAIL_SECRET', ''),
    confirmEmailLifetime: +getEnvVariable('CONFIRM_EMAIL_LIFETIME', 24) * 60 * 60,

    emailpostmarkToken: getEnvVariable('EMAIL_POSTMARK_TOKEN', ''),
    emailSenderFrom: getEnvVariable('EMAIL_SENDER_FROM', ''),

    emailTemplateConfirmEmail: +getEnvVariable('EMAIL_TEMPLATE_CONFIRM_EMAIL', ''),
    emailTemplateUserSignupLocal: +getEnvVariable('EMAIL_TEMPLATE_USER_SIGNUP_LOCAL', ''),
    emailTemplateUserSignupSocial: +getEnvVariable('EMAIL_TEMPLATE_USER_SIGNUP_SOCIAL', ''),
    emailTemplateRestorePassword: +getEnvVariable('EMAIL_TEMPLATE_RESTORE_PASSWORD', ''),
    emailTemplateRestorePasswordRequest: +getEnvVariable('EMAIL_TEMPLATE_RESTORE_PASSWORD_REQUEST', ''),

    googleAuthClientId: getEnvVariable('GOOGLE_AUTH_CLIENT_ID', ''),
    googleAuthClientSecret: getEnvVariable('GOOGLE_AUTH_CLIENT_SECRET', ''),

    mailchimpAuthClientId: getEnvVariable('MAILCHIMP_AUTH_CLIENT_ID', ''),
    mailchimpAuthClientSecret: getEnvVariable('MAILCHIMP_AUTH_CLIENT_SECRET', ''),

    s3AccessKeyId: getEnvVariable('S3_ACCESS_KEY_ID', ''),
    s3SecretAccessKey: getEnvVariable('S3_SECRET_ACCESS_KEY', ''),
    s3Bucket: getEnvVariable('S3_BUCKET', ''),
    s3Region: getEnvVariable('S3_REGION', ''),
    cdnHost: getEnvVariable('CDN_HOST', ''),
    cdnPath: getEnvVariable('CDN_PATH', ''),

    pagingDefaultLimit: 100,

    passwordRequirements: {
        length: 8,
        lowercase: false,
        uppercase: false,
        numbers: true,
        symbols: false,
    },

    maxFileSize: +getEnvVariable('MAX_FILE_SIZE', 30 * 1024 * 1024),

    enableTransactions: (getEnvVariable('ENABLE_TRANSACTIONS', '') || '').toLowerCase() === 'true',

    stripeSecretKey: getEnvVariable('STRIPE_SECRET_KEY', ''),
    stripePublishableKey: getEnvVariable('STRIPE_PUBLISHABLE_KEY', ''),
    stripeWebhookSecret: getEnvVariable('STRIPE_WEBHOOK_SECRET', ''),



};

module.exports = config;
