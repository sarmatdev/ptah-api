module.exports = {
    async up(db) {
        await db.createCollection('ptah-users-uploads');
        await db.collection('ptah-users-uploads').createIndexes([
                {
                    "key": {
                        "userId": 1
                    },
                    "name": "userId_idx",
                },
                {
                "key": {
                    "userId": 1,
                    "hash": 1,
                },
                "name": "userId_hash_idx",
            },
            ]
        );
    },
    async down(db) {
        await db.collection('ptah-users-uploads').drop()
    }
};

