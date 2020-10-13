module.exports = {
    async up(db) {
        await db.collection('ptah-users').createIndexes([
                {
                    "key": {
                        "subscriptionState": 1
                    },
                    "name": "subscriptionState_idx",
                },
                {
                    "key": {
                        "stripeCustomerId": 1
                    },
                    "name": "stripeCustomerId_idx",
                }
            ]
        );
        await db.createCollection('ptah-users-history');
        await db.collection('ptah-users-history').createIndexes([
                {
                    "key": {
                        "userId_idx": 1
                    },
                    "name": "userId_idx",
                }
            ]
        );
        await db.collection('ptah-users').updateMany(
            {'tariff': {'$exists': false}},
            {'$set': {'tariff': '5f53ee77ea0c9a00a8c88082'}}
        );
        await db.collection('ptah-users').updateMany(
            {'subscriptionState': {'$exists': false}},
            {'$set': {'subscriptionState': 0}}
        );
        await db.collection('ptah-users').updateMany(
            {'defaultPaymentSystem': {'$exists': false}},
            {'$set': {'defaultPaymentSystem': '5f54179dc2ae3f01341b9039'}}
        );
        await db.collection('ptah-users').updateMany(
            {'lastBillingDate': {'$exists': false}},
            {'$set': {'lastBillingDate': null}}
        );
    },
    async down(db) {

    }
};

