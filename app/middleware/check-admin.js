'use strict'

const {FORBIDDEN} = require('../../config/errors');

module.exports = async (ctx, next) => {
    try {
        const User = ctx.user.User;
        if (!(User && User.GetIsAdmin())) {
            const err = new Error(FORBIDDEN);
            err.status = 403;
            // noinspection ExceptionCaughtLocallyJS
            throw err;
        }

        return next()
    } catch (err) {
        ctx.throw(err.status || 500, err.message)
    }

}
