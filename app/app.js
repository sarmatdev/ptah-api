'use strict';

const fs = require('fs');
const os = require('os');
const Koa = require('koa');
const cors = require('koa2-cors');
const unless = require('koa-unless');
const Sentry = require('@sentry/node');
const {KoaReqLogger} = require('koa-req-logger');
const cacheControl = require('koa-cache-control');
const config = require('../config/config');

const router = require('./middleware/router');
const mongo = require('../common/middleware/mongo').mongo;
const auth = require('./middleware/auth')

function start(loggerInstance) {

    Sentry.init({
        dsn: config.sentryDsn,
        serverName: `${os.hostname()}-${process.env.NODE_ENV}`
    });

    const app = new Koa();
    app.on('error', err => {
        Sentry.captureException(err);
    });
    // logger and errors handler

    const logger = new KoaReqLogger({
        pinoInstance: loggerInstance,
        alwaysError: true // treat all non-2** http codes as error records in logs
    });
    app.use(logger.getMiddleware());

    // list of endpoints than not requires authorization or cors origin header check
    const publicRoutes = {
        path: [
            `${config.routesPrefix}/_healthz`,
            `${config.routesPrefix}${config.authRoutesNamespace}/login`,
            `${config.routesPrefix}${config.authRoutesNamespace}/signup`,
            `${config.routesPrefix}${config.authRoutesNamespace}/refresh`,
            `${config.routesPrefix}${config.authRoutesNamespace}/confirm_email`,
            `${config.routesPrefix}${config.authRoutesNamespace}/restore_password_step1`,
            `${config.routesPrefix}${config.authRoutesNamespace}/restore_password_step2`,
            `${config.routesPrefix}${config.authRoutesNamespace}/google`,
            `${config.routesPrefix}${config.authRoutesNamespace}/google/callback`,
            `${config.routesPrefix}${config.authRoutesNamespace}/mailchimp`,
            `${config.routesPrefix}${config.authRoutesNamespace}/mailchimp/callback`,
            `${config.routesPrefix}${config.tariffsRoutesNamespace}`,
            `${config.routesPrefix}${config.webhooksRoutesNamespace}/stripe`,
        ]
    };

    // CORS setup
    app.use(cors({
        origin: function (ctx) {
            if (publicRoutes.path === ctx.url) {
                return false;
            }
            if (config.corsValidOrigins.includes('*')) {
                return '*';
            }
            const requestOrigin = ctx.accept.headers.origin;
            if (!config.corsValidOrigins.includes(requestOrigin)) {
                return ctx.throw(`${requestOrigin} is not a valid origin`);
            }
            return requestOrigin;
        },
        maxAge: 5,
        credentials: false,
        allowHeaders: ['Content-Type', 'Authorization', 'Accept'],
    }));

    // ensure that dirs are exists
    fs.mkdirSync(config.landingsHtmlDir, {recursive: true});
    fs.mkdirSync(config.nginxConfigsDir, {recursive: true});

    app.use(mongo(config.mongoDsn, {}, config.enableTransactions));

    // authentication
    require('./middleware/passport');
    const passport = require('koa-passport');
    app.use(passport.initialize());

    const requestAuthenticator = auth.requestAuthenticator();
    requestAuthenticator.unless = unless;
    app.use(requestAuthenticator.unless(publicRoutes));

    app.use(router.routes());
    app.use(router.allowedMethods());
    app.proxy = true;
    app.use(cacheControl({
        noCache: true
    }));

    // server
    const port = config.serverPort;
    return app.listen(port, '0.0.0.0', () => {
        loggerInstance.info(`Server listening on port: ${port}`);
    });

}

module.exports = {
    start: start,
};

