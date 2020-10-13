'use strict';

const argv = require('argv');

const logger = require('./common/middleware/logger');
const app = require('./app/app');
const billing = require('./billing/billing');
const migrate = require('./common/utils/migrate');

const argvOptions = [
    {
        name: 'task',
        type: 'string'
    }
];

(async function main() {

    logger.info('~~~ PTAH BACKEND ~~~');

    await migrate.start(logger);

    const args = argv.option(argvOptions).run();

    const task = (args.options.task || '').toLowerCase();
    if (task === 'billing') {
        logger.info('starting billing');
        return await billing.start(logger);
    }

    logger.info('starting app...');
    app.start(logger);
})()
    .then()
    .catch(err => {
        logger.error(err);
        process.exit(1);
    });


