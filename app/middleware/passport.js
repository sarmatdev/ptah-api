"use strict";

const urlJoin = require('url-join');
const passport = require('koa-passport');

const config = require('../../config/config');
const {REGISTRATION_SOURCE_GOOGLE, REGISTRATION_SOURCE_MAILCHIMP} = require('../../common/classes/user.class');

const getSocialUser = function (req, name, email, accessToken, refreshToken, source) {
    return {
        req: req || {},
        email: email || '',
        name: name || '',
        accessToken: accessToken || '',
        refreshToken: refreshToken || '',
        source: source || ''
    }
}

// google strategy of Passport.js
if (config.googleAuthClientId && config.googleAuthClientSecret) {
    const GoogleStrategy = require('passport-google-oauth2').Strategy
    passport.use(new GoogleStrategy({
            clientID: config.googleAuthClientId,
            clientSecret: config.googleAuthClientSecret,
            callbackURL: urlJoin([config.publicHost, '/oauth2']),
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const email = profile.emails[0].value;
                const name = profile.name.givenName + ' ' + profile.name.familyName;
                done(null, getSocialUser(req, name, email, accessToken, refreshToken, REGISTRATION_SOURCE_GOOGLE));
            } catch (e) {
                done(null, false)
            }
        }
    ));
}

// mailchimp strategy of Passport.js
if (config.mailchimpAuthClientId && config.mailchimpAuthClientSecret) {
    const MailChimpStrategy = require('passport-mailchimp').Strategy
    passport.use(new MailChimpStrategy({
            clientID: config.mailchimpAuthClientId,
            clientSecret: config.mailchimpAuthClientSecret,
            callbackURL: urlJoin([config.publicHost, '/oauth2']),
            passReqToCallback: true
        },
        async (req, accessToken, refreshToken, profile, done) => {
            try {
                const details = JSON.parse(profile._raw || '{}');
                details.login = details.login || {};
                const email = details.login.email;
                const name = '';
                done(null, getSocialUser(req, name, email, accessToken, refreshToken, REGISTRATION_SOURCE_MAILCHIMP));
            } catch (e) {
                done(null, false)
            }
        }
    ));
}

