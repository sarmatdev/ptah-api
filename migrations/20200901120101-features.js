const ObjectID = require('bson-objectid');

module.exports = {
    async up(db) {
        await db.createCollection('ptah-features');
        await db.collection('ptah-features').createIndexes([
                {
                    "key": {
                        "isArchived": 1
                    },
                    "name": "isArchived_idx",
                },
                {
                    "key": {
                        "code": 1
                    },
                    "name": "code_idx",
                    "unique": true
                }
            ]
        );
        await db.collection('ptah-features').insertMany([
            {
                "_id": ObjectID("5f51769630e5fb53e0b94cbd"),
                "code": "landings_count",
                "createDate": "2020-09-03T23:04:54.368Z",
                "isArchived": false,
                "isBackend": true,
                "isMeasurable": true,
                "measureName": "landings",
                "name": "Landings count",
                "description": "Maximum number of created landings",
                "updateDate": "2020-09-03T23:04:54.370Z"
            },
            {
                "_id": ObjectID("5f5176d730e5fb53e0b94cce"),
                "code": "uploads_quote",
                "createDate": "2020-09-03T23:05:59.483Z",
                "isArchived": false,
                "isBackend": true,
                "isMeasurable": true,
                "measureName": "megabytes",
                "name": "Uploads size",
                "description": "Total size of user uploaded files",
                "updateDate": "2020-09-03T23:15:10.845Z"
            },
            {
                "_id": ObjectID("5f53e591e36dd80b9caaf9f2"),
                "code": "own_domain",
                "createDate": "2020-09-05T19:22:57.563Z",
                "isArchived": false,
                "isBackend": true,
                "isMeasurable": false,
                "measureName": "",
                "name": "Own domain",
                "description": "Publish landing on your own domain",
                "updateDate": "2020-09-05T19:22:57.565Z"
            }
        ], {upsert: true});
    },
    async down(db) {
        await db.collection('ptah-features').drop()
    }
};

