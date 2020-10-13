const fs = require('fs');
const {v4:uuidv4} = require('uuid');
const aws = require('aws-sdk');
const urlJoin = require('url-join');
const md5File = require('md5-file');

const Factory = require('../../../common/classes/factory');
const config = require('../../../config/config');

const {AUTHENTICATION_ERROR, BAD_REQUEST, FILE_TYPE_DISALLOWED, FILE_SIZE_LIMIT_EXCEEDED, FILE_SIZE_QUOTE_EXCEEDED, FILE_ALREADY_UPLOADED} = require('../../../config/errors');

module.exports = async (ctx) => {
    try {
        const user = ctx.user.User;
        if (!user) {
            return ctx.throw(401, AUTHENTICATION_ERROR);
        }

        const file = ctx.request.files.file;
        if (!file) {
            return ctx.throw(400, BAD_REQUEST);
        }

        const userUploads = await Factory.UserUploads(ctx);

        const fileType = userUploads.GetFileType(file.type);
        if (!fileType) {
            return ctx.throw(400, FILE_TYPE_DISALLOWED);

        }
        if (!userUploads.IsFileSizeOk(file.size)) {
            return ctx.throw(400, FILE_SIZE_LIMIT_EXCEEDED);
        }

        if (!await userUploads.IsUserUploadQuoteOk(file.size)) {
            return ctx.throw(400, FILE_SIZE_QUOTE_EXCEEDED);
        }

        const hash = await getFileHash(ctx, file.path);
        const found = await userUploads.FindByHash(hash)
        if (found.length) {
            return ctx.throw(400, FILE_ALREADY_UPLOADED);
        }

        const result = await uploadFile(file, fileType, user.GetId(), config);

        await userUploads.Add(file, result.file.name, hash)

        ctx.status = 200;
        ctx.body = result;

    } catch (err) {
        throw err
    }
};

const uploadFile = function (file, fileType, userId, config) {
    aws.config.update({
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey,
        region: config.s3Region,
    });

    const s3 = new aws.S3({
        apiVersion: '2006-03-01',
    });

    return new Promise((resolve, reject) => {
        const stream = fs.createReadStream(file.path);
        stream.on('error', (err) => {
            reject(err);
        });

        const preKey = uuidv4();

        const filepath = urlJoin([config.cdnPath, userId, `${preKey}.${fileType.extention}`]);

        s3.upload(
            {
                Bucket: config.s3Bucket,
                Body: stream,
                Key: filepath,
                ContentType: file.type,
            },
            (err, data) => {
                if (err) {
                    reject(err);
                } else if (data) {
                    resolve({
                        file: {
                            name: data.Key,
                            nameWithoutExtention: preKey,
                            extention: fileType.extention,
                        },
                        url: data.Location,
                        cdnUrl: urlJoin([config.cdnHost, filepath]),
                    });
                }
            },
        );
    });
}

const getFileHash = async function(ctx, filepath) {
    return new Promise((resolve) => {
        md5File(filepath).then((hash) => {
            return resolve(hash);
        }).catch((e) => {
            ctx.log.error(e);
            return resolve('')
        })
    })
}

