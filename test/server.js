'use strict';

const app = require('../app/app');
const logger = require('../common/middleware/logger')
const server = app.start(logger)

module.exports = server;
