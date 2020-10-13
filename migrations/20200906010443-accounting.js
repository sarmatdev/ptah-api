module.exports = {
    async up(db) {
        await db.createCollection('ptah-accounting-users');
        await db.collection('ptah-accounting-users').createIndexes([
                {
                    "key": {
                        "userId": 1
                    },
                    "name": "userId_idx",
                }
            ]
        );
        await db.createCollection('ptah-accounting-internal');
        await db.collection('ptah-accounting-internal').createIndexes([
                {
                    "key": {
                        "userId": 1
                    },
                    "name": "userId_idx",
                },
            {
                "key": {
                    "operationCode": 1
                },
                "name": "operationCode_idx",
            }
            ]
        );
    },
    async down(db) {
        await db.collection('ptah-accounting-users').drop();
        await db.collection('ptah-accounting-internal').drop()
    }
};

