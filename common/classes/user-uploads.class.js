"use strict";

const _ = require('lodash');
const ObjectID = require('bson-objectid');

const getDbCollection = require('../utils/get-db-collection');

function getDefaultUserUpload() {
    return {
        _id: ObjectID(),
        userId: '',
        type: '',
        mimeType: '',
        originalFilename: '',
        url: '',
        filesize: 0,
        hash: '',
        createdAt: (new Date).toISOString(),
    }
}

class UserUploads {

    publicFields = ['type', 'mimeType', 'originalFilename', 'url', 'filesize', 'createdAt'];

    allowedTypes = [
        {
            type: 'image',
            mimeType: 'image/jpeg',
            extention: 'jpg',
        },
        {
            type: 'image',
            mimeType: 'image/gif',
            extention: 'gif',
        },
        {
            type: 'image',
            mimeType: 'image/svg+xml',
            extention: 'svg',
        },
        {
            type: 'image',
            mimeType: 'image/png',
            extention: 'png',
        },
        {
            type: 'document',
            mimeType: 'application/pdf',
            extention: 'pdf',
        },
        {
            type: 'video',
            mimeType: 'video/mp4',
            extention: 'mp4',
        },
        {
            type: 'video',
            mimeType: 'video/webm',
            extention: 'webm',
        },
    ];

    /**
     * params.userId
     * params.maxFileSize
     * params.maxTotalFilesSize
     */
    constructor(ctx, params) {
        this.params = Object.assign({
            userId: '',
            maxFileSize: 0,
            maxTotalFilesSize: 0,
        }, params || {});


        if (!this.params.userId || !this.params.maxFileSize || !this.params.maxTotalFilesSize) {
            throw new Error("not enough params to init user upload");
        }

        /*if (this.params.maxFileSize > this.params.maxTotalFilesSize) {
            throw new Error(` invalid params to init user upload: params.maxFileSize (${params.maxFileSize}) must be gte params.maxTotalFilesSize ${params.maxTotalFilesSize}`);
        }*/

        this.ctx = ctx;
        this.collection = getDbCollection.usersUploads(this.ctx);

        this.projection = {}
        Object.keys(getDefaultUserUpload()).forEach(k => {
            if (this.publicFields.indexOf(k) < 0) {
                this.projection[k] = 0;
            }
        });

        return this;
    }

    async FindAll() {
        const condition = {userId: this.params.userId};
        return await this.find(condition);
    }

    async FindByHash(hash) {
        hash = hash || '';
        if (!hash) {
            return []
        }
        const condition = {userId: this.params.userId, hash: hash};
        return await this.find(condition);
    }

    async Add(file, url, hash) {
        const fileType = this.GetFileType(file.type);
        if (!fileType) {
            throw new Error("unsupported file type");
        }

        const u = Object.assign({}, getDefaultUserUpload(), {
            userId: this.params.userId,
            url: url,
            originalFilename: file.name,
            filesize: file.size,
            type: fileType.type,
            mimeType: fileType.mimeType,
            hash: hash || ''
        });

        return this.createUserUpload(u)
    }

    GetFileType(mimeType) {
        return _.find(this.allowedTypes, {mimeType: mimeType});
    }

    IsFileSizeOk(filesize) {
        return filesize <= this.params.maxFileSize
    }

    async GetUserQuoteRest() {
        const spaceUsed = await this.getUserUploadsSize();
        return Math.max(this.params.maxTotalFilesSize - spaceUsed, 0);
    }

    async IsUserUploadQuoteOk(filesize) {
        const rest = await this.GetUserQuoteRest()
        return filesize <= rest;
    }

    async getUserUploadsSize() {
        const pipeline = [
            {'$match': {'userId': this.params.userId}},
            {'$group': {'_id': "$userId", 'filesize': {'$sum': '$filesize'}}},
        ];

        const options = {};

        const r = await this.ctx.mongoTransaction(
            this.collection,
            'aggregate',
            [
                pipeline,
                options
            ]
        )

        const result = await r.toArray();

        if (!result || !result.length) {
            return 0
        }

        return result[0].filesize;
    }

    async find(conditions) {
        const options = {
            projection: this.projection,
            sort: {_id: -1}
        };

        const defaultConditions = {};

        const query = Object.assign({}, conditions, defaultConditions)

        try {
            const r = await this.ctx.mongoTransaction(
                this.collection,
                'find',
                [
                    query,
                    options
                ]
            )

            const result = await r.toArray();

            if (!result) {
                return [];
            }

            return result

        } catch (err) {
            throw e
        }
    }

    async createUserUpload(uploadObject) {
        try {
            await this.ctx.mongoTransaction(
                this.collection,
                'insertOne',
                [
                    uploadObject
                ]
            )
        } catch (e) {
            throw e
        }
    }

}


module.exports = {
    UserUploads,
};
