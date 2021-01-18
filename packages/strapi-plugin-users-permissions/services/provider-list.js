'use strict';

const request = require('request');
const purest = require('purest')({ request });
const purestConfig = require('@purest/providers');
const jwt = require('jsonwebtoken');

module.exports = {
  discord: async ({ access_token }, callback) => {
    const discord = purest({
      provider: 'discord',
      config: {
        discord: {
          'https://discordapp.com/api/': {
            __domain: {
              auth: {
                auth: { bearer: '[0]' },
              },
            },
            '{endpoint}': {
              __path: {
                alias: '__default',
              },
            },
          },
        },
      },
    });

    discord
      .query()
      .get('users/@me')
      .auth(access_token)
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          // Combine username and discriminator because discord username is not unique
          var username = `${body.username}#${body.discriminator}`;
          callback(null, {
            username: username,
            email: body.email,
          });
        }
      });
  },
  cognito: async ({ query }, callback) => {
    // get the id_token
    const idToken = query.id_token;
    // decode the jwt token
    const tokenPayload = jwt.decode(idToken);
    if (!tokenPayload) {
      callback(new Error('unable to decode jwt token'));
    } else {
      callback(null, {
        username: tokenPayload['cognito:username'],
        email: tokenPayload.email,
      });
    }
  },
  facebook: async ({ access_token }, callback) => {
    const facebook = purest({
      provider: 'facebook',
      config: purestConfig,
    });

    facebook
      .query()
      .get('me?fields=name,email')
      .auth(access_token)
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.name,
            email: body.email,
          });
        }
      });
  },
  google: async ({ access_token }, callback) => {
    const google = purest({ provider: 'google', config: purestConfig });

    google
      .query('oauth')
      .get('tokeninfo')
      .qs({ access_token })
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.email.split('@')[0],
            email: body.email,
          });
        }
      });
  },
  github: async ({ access_token }, callback) => {
    const github = purest({
      provider: 'github',
      config: purestConfig,
      defaults: {
        headers: {
          'user-agent': 'strapi',
        },
      },
    });

    github
      .query()
      .get('user')
      .auth(access_token)
      .request((err, res, userbody) => {
        if (err) {
          return callback(err);
        }

        // This is the public email on the github profile
        if (userbody.email) {
          return callback(null, {
            username: userbody.login,
            email: userbody.email,
          });
        }

        // Get the email with Github's user/emails API
        github
          .query()
          .get('user/emails')
          .auth(access_token)
          .request((err, res, emailsbody) => {
            if (err) {
              return callback(err);
            }

            return callback(null, {
              username: userbody.login,
              email: Array.isArray(emailsbody)
                ? emailsbody.find(email => email.primary === true).email
                : null,
            });
          });
      });
  },
  microsoft: async ({ access_token }, callback) => {
    const microsoft = purest({
      provider: 'microsoft',
      config: purestConfig,
    });

    microsoft
      .query()
      .get('me')
      .auth(access_token)
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.userPrincipalName,
            email: body.userPrincipalName,
          });
        }
      });
  },
  twitter: async ({ grant, access_token, query }, callback) => {
    const twitter = purest({
      provider: 'twitter',
      config: purestConfig,
      key: grant.twitter.key,
      secret: grant.twitter.secret,
    });

    twitter
      .query()
      .get('account/verify_credentials')
      .auth(access_token, query.access_secret)
      .qs({ screen_name: query['raw[screen_name]'], include_email: 'true' })
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.screen_name,
            email: body.email,
          });
        }
      });
  },
  instagram: async ({ grant, access_token }, callback) => {
    const instagram = purest({
      config: purestConfig,
      provider: 'instagram',
      key: grant.instagram.key,
      secret: grant.instagram.secret,
    });

    instagram
      .query()
      .get('users/self')
      .qs({ access_token })
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.data.username,
            email: `${body.data.username}@strapi.io`, // dummy email as Instagram does not provide user email
          });
        }
      });
  },
  vk: async ({ access_token, query }, callback) => {
    const vk = purest({
      provider: 'vk',
      config: purestConfig,
    });

    vk.query()
      .get('users.get')
      .qs({ access_token, id: query.raw.user_id, v: '5.122' })
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: `${body.response[0].last_name} ${body.response[0].first_name}`,
            email: query.raw.email,
          });
        }
      });
  },
  twitch: async ({ grant, access_token }, callback) => {
    const twitch = purest({
      provider: 'twitch',
      config: {
        twitch: {
          'https://api.twitch.tv': {
            __domain: {
              auth: {
                headers: {
                  Authorization: 'Bearer [0]',
                  'Client-ID': '[1]',
                },
              },
            },
            'helix/{endpoint}': {
              __path: {
                alias: '__default',
              },
            },
            'oauth2/{endpoint}': {
              __path: {
                alias: 'oauth',
              },
            },
          },
        },
      },
    });

    twitch
      .get('users')
      .auth(access_token, grant.twitch.key)
      .request((err, res, body) => {
        if (err) {
          callback(err);
        } else {
          callback(null, {
            username: body.data[0].login,
            email: body.data[0].email,
          });
        }
      });
  },
  linkedin: async ({ access_token }, callback) => {
    const linkedIn = purest({
      provider: 'linkedin',
      config: {
        linkedin: {
          'https://api.linkedin.com': {
            __domain: {
              auth: [{ auth: { bearer: '[0]' } }],
            },
            '[version]/{endpoint}': {
              __path: {
                alias: '__default',
                version: 'v2',
              },
            },
          },
        },
      },
    });

    try {
      const getDetailsRequest = () => {
        return new Promise((resolve, reject) => {
          linkedIn
            .query()
            .get('me')
            .auth(access_token)
            .request((err, res, body) => {
              if (err) {
                return reject(err);
              }
              resolve(body);
            });
        });
      };

      const getEmailRequest = () => {
        return new Promise((resolve, reject) => {
          linkedIn
            .query()
            .get('emailAddress?q=members&projection=(elements*(handle~))')
            .auth(access_token)
            .request((err, res, body) => {
              if (err) {
                return reject(err);
              }
              resolve(body);
            });
        });
      };

      const { localizedFirstName } = await getDetailsRequest();
      const { elements } = await getEmailRequest();
      const email = elements[0]['handle~'];

      callback(null, {
        username: localizedFirstName,
        email: email.emailAddress,
      });
    } catch (err) {
      callback(err);
    }
  },
};
