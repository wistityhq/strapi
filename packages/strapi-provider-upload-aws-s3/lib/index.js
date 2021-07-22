'use strict';

/**
 * Module dependencies
 */

/* eslint-disable no-unused-vars */
// Public node modules.
const _ = require('lodash');
const AWS = require('aws-sdk');

const getFilePath = (filePath, s3Prefix) => {
  const path = filePath ? `${filePath}/` : '';
  if (s3Prefix) {
    return `${s3Prefix}${path}`;
  }
  return path;
};

module.exports = {
  init(config) {
    // we create a new config so that we don't delete the s3Prefix from the original object
    const newConfig = { ...config };
    const s3Prefix = newConfig.s3Prefix ? `${newConfig.s3Prefix}/` : '';

    delete newConfig.s3Prefix;
    const S3 = new AWS.S3({
      apiVersion: '2006-03-01',
      ...newConfig,
    });

    return {
      upload(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // upload file on S3 bucket
          const path = getFilePath(file.path, s3Prefix);
          S3.upload(
            {
              Key: `${path}${file.hash}${file.ext}`,
              Body: Buffer.from(file.buffer, 'binary'),
              ACL: 'public-read',
              ContentType: file.mime,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              // set the bucket file url
              file.url = data.Location;

              resolve();
            }
          );
        });
      },
      delete(file, customParams = {}) {
        return new Promise((resolve, reject) => {
          // delete file on S3 bucket
          const path = getFilePath(file.path, s3Prefix);
          S3.deleteObject(
            {
              Key: `${path}${file.hash}${file.ext}`,
              ...customParams,
            },
            (err, data) => {
              if (err) {
                return reject(err);
              }

              resolve();
            }
          );
        });
      },
    };
  },
};
