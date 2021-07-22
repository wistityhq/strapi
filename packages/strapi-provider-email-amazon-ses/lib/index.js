'use strict';

const nodeSES = require('node-ses');
const { removeUndefined } = require('strapi-utils');

module.exports = {
  init: (providerOptions = {}, settings = {}) => {
    var client = nodeSES.createClient({ ...providerOptions });

    return {
      send: options => {
        return new Promise((resolve, reject) => {
          const { from, to, cc, bcc, replyTo, subject, text, html, ...rest } = options;

          let msg = {
            from: from || settings.defaultFrom,
            to,
            cc,
            bcc,
            replyTo: replyTo || settings.defaultReplyTo,
            subject,
            altText: text,
            message: html,
            ...rest,
          };
          client.sendEmail(removeUndefined(msg), function(err) {
            if (err) {
              if (err.Message) {
                reject({message: `${err.Message} ${err.Detail ? err.Detail : ''}`});
              }
              reject(err);
            } else {
              resolve();
            }
          });
        });
      },
    };
  },
};
