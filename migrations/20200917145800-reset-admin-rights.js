module.exports = {
    async up(db) {
        await db.collection('ptah-users').updateMany(
            {},
            {'$set': {'isAdmin': false}}
        );
    },
    async down(db) {

    }
};

