'use strict';

const {INTERNAL_SERVER_ERROR} = require('../../../../config/errors');

const {Feature} = require('../../../../common/classes/feature.class');

module.exports = async (ctx, next) => {
    try {
        const name = ctx.request.body.name || '';
        const description = ctx.request.body.description || '';
        const code = ctx.request.body.code || '';
        const isMeasurable = !!ctx.request.body.isMeasurable;
        const measureName = ctx.request.body.measureName || '';

        const feature = new Feature(ctx);
        const result = await feature.Create(name, description, code, isMeasurable, measureName);
        if (!result) {
            return ctx.throw(500, INTERNAL_SERVER_ERROR);
        }

        ctx.status = 201;
        ctx.body = result;

    } catch (err) {
        return ctx.throw(err.status || 500, err.message)
    }

    next();
};
