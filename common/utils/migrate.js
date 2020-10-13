'use strict';

const {database, up} = require('migrate-mongo');

async function start(logger) {
    logger.info('starting migrations');
    return new Promise((resolve, reject) => {
        database.connect()
            .then((obj) => {
                up(obj.db, obj.client)
                    .then((migrated) => {
                        migrated.forEach(fileName => logger.info('Migrated:', fileName));
                        logger.info('migrations applied');
                        resolve();

                    });
            })
            .catch((err) => {
                logger.error('migrations failed', err);
                reject(err);
            });
    });
}

module.exports = {
    start: start,
};
