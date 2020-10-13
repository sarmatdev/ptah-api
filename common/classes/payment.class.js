'use strict';

const stripe = require("stripe")
const unparsed = require('koa-body/unparsed.js');

const config = require('../../config/config')
const Factory = require('./factory');
const {AccountingUser, OPERATION_CODE_TOPUP} = require('./accounting.class');

const CURRENCY = 'usd';

class Payment {

    stripe = stripe(config.stripeSecretKey);

    constructor(ctx) {
        this.ctx = ctx;
        return this;
    }

    static async ProcessStripeWebhook(ctx) {
        try {
            let data, eventType;
            let amount = 0;
            if (config.stripeWebhookSecret) {
                // Retrieve the event by verifying the signature using the raw body and secret.
                let event;
                let signature = ctx.headers["stripe-signature"];
                try {
                    event = this.stripe.webhooks.constructEvent(
                        ctx.request.body[unparsed],
                        signature,
                        config.stripeWebhookSecret
                    );
                } catch (err) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Webhook signature verification failed');
                }
                data = event.data;
                eventType = event.type;
            } else {
                // Webhook signing is recommended, but if the secret is not configured in `config.js`,
                // we can retrieve the event data directly from the request body.
                data = ctx.request.body.data;
                eventType = ctx.request.body.type;
            }
            if (eventType === "payment_intent.succeeded") {

                const user = Factory.User(ctx);

                let userId = data.object.metadata.user_id;

                if (userId) {
                    await user.FindById(userId);
                } else {
                    const customerId = data.object.customer ? data.object.customer.id : '';
                    if (customerId) {
                        await user.FindByStripeCustomerId(customerId);
                    }
                }

                if (!userId) {
                    // noinspection ExceptionCaughtLocallyJS
                    throw new Error('Webhook user not found');
                }

                const paymentMethod = data.object.payment_method;
                if (paymentMethod) {
                    await user.SetStripePaymentMethodId(paymentMethod);
                }

                const chargesData = data.object.charges ? data.object.charges.data : [];
                const card = Array.isArray(chargesData) && chargesData.length
                    ? chargesData[0].payment_method_details ? chargesData[0].payment_method_details.card : null
                    : null;

                if (card) {
                    await user.SetStripeCardData(card.brand, card.last4);
                }

                amount = data.object.amount;

                const accountingUser = new AccountingUser(ctx);
                await accountingUser.AddUserOperation(user.GetId(), amount, OPERATION_CODE_TOPUP, 'user balance topup');
            } else if (eventType === "payment_intent.payment_failed") {
                // The payment failed to go through due to decline or authentication request
                const error = data.object.last_payment_error ? data.object.last_payment_error.message : '';
                // noinspection ExceptionCaughtLocallyJS
                throw new Error("Payment failed with error: " + error);
            }
            /*else if (eventType === "payment_method.attached") {
                // A new payment method was attached to a customer
                console.log("💳 Attached " + data.object.id + " to customer");
            }*/
        } catch (e) {
            throw e;
        }
    }

    async TryRecurringTopup(user, amount) {
        try {

            let stripeCustomerId = user.GetStripeCustomerId();
            if (!stripeCustomerId) {
                const customer = await this.stripe.customers.create({
                    email: user.email,
                });
                stripeCustomerId = customer.id;
                await user.SetStripeCustomerId(stripeCustomerId)
            }

            let stripePaymentMethodId = user.GetStripePaymentMethodId();
            if (!stripeCustomerId) {

                const paymentMethods = await this.stripe.paymentMethods.list({
                    customer: stripeCustomerId,
                    type: "card"
                });

                if (paymentMethods.data.length) {
                    stripePaymentMethodId = paymentMethods.data[0].id;
                    await user.SetStripePaymentMethodId(stripePaymentMethodId)
                }

                return false;
            }

            // Create and confirm a PaymentIntent with the order amount, currency,
            // Customer and PaymentMethod ID
            // const paymentIntent =
            await this.stripe.paymentIntents.create({
                amount: amount,
                currency: CURRENCY,
                payment_method: stripePaymentMethodId,
                customer: stripeCustomerId,
                off_session: true,
                confirm: true
            });

            const accountingUser = new AccountingUser(this.ctx);
            await accountingUser.AddUserOperation(user.GetId(), amount, OPERATION_CODE_TOPUP, 'user balance topup (recurring)');

            return true;

        } catch (err) {
            this.ctx.log.error(err);
        }

        return false;
    }

    async PreparePayment(user, amount) {
        try {

            let stripeCustomerId = user.GetStripeCustomerId();
            if (!stripeCustomerId) {
                const customer = await this.stripe.customers.create({
                    email: user.email,
                });
                stripeCustomerId = customer.id;
                await user.SetStripeCustomerId(stripeCustomerId)
            }

            // Create a PaymentIntent with the order amount and currency and the customer id
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: CURRENCY,
                customer: stripeCustomerId
            });

            return {
                publicKey: config.stripePublishableKey,
                clientSecret: paymentIntent.client_secret,
                id: paymentIntent.id
            }

        } catch (e) {
            throw e;
        }
    }

    async RemoveCard(user) {
        try {
            await user.DeleteStripePaymentMethod();
        } catch (e) {
            throw e;
        }
    }
}

module.exports = {
    Payment
}
