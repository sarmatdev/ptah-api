"use strict";

const _ = require('lodash');
const jwt = require('jsonwebtoken');
const ObjectID = require('bson-objectid');
const {Crypt, Compare} = require('password-crypt');

const config = require('../../config/config')
const getDbCollection = require('../utils/get-db-collection');
const subscriptionStates = require('./subscription-state');

const REGISTRATION_SOURCE_LOCAL = 'local';
const REGISTRATION_SOURCE_GOOGLE = 'google';
const REGISTRATION_SOURCE_MAILCHIMP = 'mailchimp';

const PUBLIC_FIELDS = ['_id', 'name', 'email', 'emailConfirmed', 'mailchimpIntegration',
    'registrationSource', 'createDate', 'updateDate', 'tariff', 'subscriptionState', 'cardBrand', 'cardLast4'];

function getDefaultUser() {
    const now = (new Date).toISOString();
    const id = ObjectID();
    return {
        _id: id,
        name: '',
        email: '',
        password: '',
        emailConfirmed: false,
        mailchimpIntegration: false,
        mailchimpAccessToken: '',
        registrationSource: '',
        createDate: now,
        updateDate: now,
        isAdmin: false,
        tariff: null,
        subscriptionState: subscriptionStates.inactive,
        stripeCustomerId: null,
        stripePaymentMethodId: null,
        cardBrand: '',
        cardLast4: '',
        isDeleted: false,
        lastBillingDate: null,
    }
}

class User {

    omitFields = [];

    publicFields = PUBLIC_FIELDS;


    /*
    params.passwordSecret
    params.restorePasswordSecret
    params.restorePasswordLifetime (seconds)
    params.confirmEmailSecret
    params.confirmEmailLifetime (seconds)
     */
    constructor(ctx, params, user) {
        params = params || {};
        console.log('💥', params)
        if (Object.values(params).filter(Boolean).length < 5) {
            throw new Error("not enough params to init user");
        }

        this.ctx = ctx;
        this.collection = getDbCollection.users(ctx);
        this.collectionHistory = getDbCollection.usersHistory(ctx);
        this.params = params;

        user = user || {}
        this.user = Object.assign({}, getDefaultUser(), user);
        return this;
    }

    async FindById(id) {
        if (!ObjectID.isValid(id)) {
            return null;
        }
        const condition = {_id: ObjectID(id)}
        return await this.find(condition);
    }

    async FindByStripeCustomerId(stripeCustomerId) {
        const condition = {stripeCustomerId: stripeCustomerId}
        return await this.find(condition);
    }

    async FindByEmail(email) {
        const condition = {email: email.toLowerCase()};
        return await this.find(condition);
    }

    GetId() {
        return this.user._id.toString();
    }

    GetStripeCustomerId() {
        return this.user.stripeCustomerId;
    }

    GetTariffId() {
        return this.user.tariff;
    }

    async SetStripeCustomerId(stripeCustomerId) {
        try {
            return await this.updateUser({
                stripeCustomerId: stripeCustomerId,
            });
        } catch (e) {
            throw e
        }
    }

    GetStripePaymentMethodId() {
        return this.user.stripePaymentMethodId;
    }

    async SetStripePaymentMethodId(stripePaymentMethodId) {
        try {
            return await this.updateUser({
                stripePaymentMethodId: stripePaymentMethodId,
            });
        } catch (e) {
            throw e
        }
    }

    async SetStripeCardData(brand, last4) {
        try {
            return await this.updateUser({
                cardBrand: brand || null,
                cardLast4: last4 || null,
            });
        } catch (e) {
            throw e
        }
    }

    async DeleteStripePaymentMethod() {
        try {
            return await this.updateUser({
                stripePaymentMethodId: null,
                cardBrand: null,
                cardLast4: null,
            });
        } catch (e) {
            throw e
        }
    }

    GetUser() {
        return _.pick(this.user, this.publicFields);
    }

    GetIsAdmin() {
        return !!this.user.isAdmin;
    }

    async CreateUser(name, email, password, registrationSource) {

        if (!email) {
            return null;
        }
        try {
            const user = {
                name: name || '',
                email: email.toLowerCase(),
                password: await Crypt(this.params.passwordSecret, password),
                registrationSource: registrationSource  || '',
            }

            return await this.updateUser(Object.assign({}, getDefaultUser(), user));
        } catch (e) {
            throw e
        }
    }

    async CheckUserPassword(password) {
        try {
            return await Compare(this.params.passwordSecret, password, this.user.password);
        } catch (e) {
            throw e
        }
    }

    async SetNewPassword(password) {
        try {
            const user = {
                password: await Crypt(this.params.passwordSecret, password),
            }
            return await this.updateUser(user);
        } catch (e) {
            throw e
        }
    }

    async ChangeName(name) {
        try {
            return await this.updateUser({
                name: name,
            });
        } catch (e) {
            throw e
        }
    }

    async SetEmailConfirmed() {
        try {
            return await this.updateUser({
                emailConfirmed: true,
            });
        } catch (e) {
            throw e
        }
    }

    async EnableMailchimpIntegration(mailchimpAccessToken) {
        try {
            return await this.updateUser({
                mailchimpIntegration: true,
                mailchimpAccessToken: mailchimpAccessToken,
            });
        } catch (e) {
            throw e
        }
    }

    async DisableMailchimpIntegration() {
        try {
            return await this.updateUser({
                mailchimpIntegration: false,
                mailchimpAccessToken: '',
            });
        } catch (e) {
            throw e
        }
    }

    async MarkDeleted() {
        try {
            return await this.updateUser({
                isDeleted: true,
            });
        } catch (e) {
            throw e
        }
    }

    async GrantAdmin() {
        try {
            return await this.updateUser({
                isAdmin: true,
            });
        } catch (e) {
            throw e
        }
    }

    async RevokeAdmin() {
        try {
            return await this.updateUser({
                isAdmin: false,
            });
        } catch (e) {
            throw e
        }
    }

    async SetTariff(tariffId) {
        tariffId = tariffId || null;
        if (!tariffId) {
            return null;
        }
        try {
            return await this.updateUser({
                tariff: tariffId,
            });
        } catch (e) {
            throw e
        }
    }

    async SetSubscriptionState(state = null) {
        if (!Number.isInteger(state) || Object.values(subscriptionStates).indexOf(state) < 0) {
            return null;
        }
        try {
            return await this.updateUser({
                subscriptionState: state,
            });
        } catch (e) {
            throw e
        }
    }

    async SetLastBillingDate(date) {
        date = date || new Date();

        try {
            return await this.updateUser({
                lastBillingDate: date
            });
        } catch (e) {
            throw e
        }
    }

    GetMailchimpIntegrationToken() {
        if (!this.user.mailchimpIntegration) {
            return '';
        }
        return this.user.mailchimpAccessToken
    }

    GetRestorePasswordToken() {
        return this.createToken(this.params.restorePasswordSecret, this.params.restorePasswordLifetime)
    }

    GetConfirmEmailToken() {
        return this.createToken(this.params.confirmEmailSecret, this.params.confirmEmailLifetime)
    }

    async FindByRestorePasswordToken(token) {
        try {
            return await this.findByToken(token, this.params.restorePasswordSecret);
        } catch (e) {
            throw e
        }
    }

    async FindByConfirmEmailToken(token) {
        try {
            return await this.findByToken(token, this.params.confirmEmailSecret);
        } catch (e) {
            throw e
        }
    }

    createToken(secret, expires) {
        const payload = {
            id: this.user._id.toString(),
            email: this.user.email,
        }
        return jwt.sign(payload, secret, {expiresIn: expires});
    }

    async findByToken(token, secret) {
        try {
            const decoded = jwt.verify(token, secret);

            const condition = {
                _id: ObjectID(decoded.id),
                email: decoded.email
            };
            return await this.find(condition);
        } catch (e) {
            this.ctx.log.error(e);
            return null;
        }
    }

    async find(conditions) {
        const options = {
            projection: {}
        };
        this.omitFields.forEach((field) => {
            options.projection[field] = 0
        });

        const defaultConditions = {
            isDeleted: false,
        };

        const query = Object.assign({}, conditions, defaultConditions)

        try {
            const result = await this.ctx.mongoTransaction(
                this.collection,
                'findOne',
                [
                    query,
                    options
                ]
            )

            if (!result) {
                return null;
            }

            result._id = ObjectID(result._id.toString());

            return this.fillUser(Object.assign({}, getDefaultUser(), result));

        } catch (e) {
            throw e
        }
    }

    fillUser(userObject) {
        Object.assign(this.user, userObject);
        return this.GetUser();
    }

    async updateUser(userObject) {
        try {
            userObject.updateDate = (new Date).toISOString();
            delete userObject._id;

            await this.ctx.mongoTransaction(
                this.collection,
                'updateOne',
                [
                    {_id: this.user._id},
                    {$set: userObject},
                    {upsert: true}
                ]
            )

            const currentUserId = _.get(this.ctx, config.userIdStatePath);
            const historyObject = Object.assign({}, this.user, {userId: this.user._id, currentUserId: currentUserId});
            delete historyObject._id;

            await this.ctx.mongoTransaction(
                this.collectionHistory,
                'insertOne',
                [
                    historyObject
                ]
            )

            return this.fillUser(userObject);
        } catch (e) {
            throw e
        }
    }
}


module.exports = {
    User,
    PUBLIC_FIELDS,
    REGISTRATION_SOURCE_LOCAL,
    REGISTRATION_SOURCE_GOOGLE,
    REGISTRATION_SOURCE_MAILCHIMP,
};
