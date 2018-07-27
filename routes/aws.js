const express = require('express');
const aws = require('aws-sdk');

const router = express.Router();
const { S3_BUCKET } = process.env;
aws.config.region = process.env.AWS_REGION;

router.get('/sign-s3', (req, res, next) => {
    const s3 = new aws.S3();
    const fileName = req.query['file-name'];
    const fileType = req.query[' file-Type'];
    const s3Params = {
        Bucket: S3_BUCKET,
        Key: fileName,
        Expires: 60,
        ContentType: fileType,
        ACL: 'public-read',
    };

    s3.getSignedUrl('putObject', s3Params, (err, data) => {
        if (err) {
            next(err);
        }
        const returnData = {
            signedRequest: data,
            url: `https://${S3_BUCKET}.s3.amazonaws.com/${fileName}`,
        };
        res.write(JSON.stringify(returnData));
        res.status(200).end();
    });
});

module.exports = router;
