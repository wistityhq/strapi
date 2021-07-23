'use strict';

/**
 * Module dependencies.
 */

// Public node modules.
const _ = require('lodash');
const request = require('request');

// Purest strategies.
const purest = require('purest')({ request });
const purestConfig = require('@purest/providers');
const { getAbsoluteServerUrl } = require('@strapi/utils');
const jwt = require('jsonwebtoken');

/**
 * Connect thanks to a third-party provider.
 *
 *
 * @param {String}    provider
 * @param {String}    access_token
 *
 * @return  {*}
 */

const connect = ({ strapi }) => (provider, query) => {
  const access_token = query.access_token || query.code || query.oauth_token;

  return new Promise((resolve, reject) => {
    if (!access_token) {
      return reject([null, { message: 'No access_token.' }]);
    }

    // Get the profile.
    getProfile(provider, query, async (err, profile) => {
      if (err) {
        return reject([null, err]);
      }

      // We need at least the mail.
      if (!profile.email) {
        return reject([null, { message: 'Email was not available.' }]);
      }

      try {
        const users = await strapi.query('plugins::users-permissions.user').findMany({
          where: { email: profile.email },
        });

        const advanced = await strapi
          .store({
            environment: '',
            type: 'plugin',
            name: 'users-permissions',
            key: 'advanced',
          })
          .get();

        const user = _.find(users, { provider });

        if (_.isEmpty(user) && !advanced.allow_register) {
          return resolve([
            null,
            [{ messages: [{ id: 'Auth.advanced.allow_register' }] }],
            'Register action is actualy not available.',
          ]);
        }

        if (!_.isEmpty(user)) {
          return resolve([user, null]);
        }

        if (
          !_.isEmpty(_.find(users, user => user.provider !== provider)) &&
          advanced.unique_email
        ) {
          return resolve([
            null,
            [{ messages: [{ id: 'Auth.form.error.email.taken' }] }],
            'Email is already taken.',
          ]);
        }

        // Retrieve default role.
        const defaultRole = await strapi
          .query('plugins::users-permissions.role')
          .findOne({ where: { type: advanced.default_role } });

        // Create the new user.
        const params = _.assign(profile, {
          provider: provider,
          role: defaultRole.id,
          confirmed: true,
        });

        const createdUser = await strapi
          .query('plugins::users-permissions.user')
          .create({ data: params });

        return resolve([createdUser, null]);
      } catch (err) {
        reject([null, err]);
      }
    });
  });
};

/**
 * Helper to get profiles
 *
 * @param {String}   provider
 * @param {Function} callback
 */

const getProfile = async (provider, query, callback) => {
  const access_token = query.access_token || query.code || query.oauth_token;

  const grant = await strapi
    .store({
      environment: '',
      type: 'plugin',
      name: 'users-permissions',
      key: 'grant',
    })
    .get();

  switch (provider) {
    case 'discord': {
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
      break;
    }
    case 'cognito': {
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
      break;
    }
    case 'facebook': {
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
      break;
    }
    case 'google': {
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
      break;
    }
    case 'github': {
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
      break;
    }
    case 'microsoft': {
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
      break;
    }
    case 'twitter': {
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
      break;
    }
    case 'instagram': {
      const instagram = purest({
        provider: 'instagram',
        key: grant.instagram.key,
        secret: grant.instagram.secret,
        config: purestConfig,
      });

      instagram
        .query()
        .get('me')
        .qs({ access_token, fields: 'id,username' })
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.username,
              email: `${body.username}@strapi.io`, // dummy email as Instagram does not provide user email
            });
          }
        });
      break;
    }
    case 'vk': {
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
      break;
    }
    case 'twitch': {
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
      break;
    }
    case 'linkedin': {
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
      break;
    }
    case 'reddit': {
      const reddit = purest({
        provider: 'reddit',
        config: purestConfig,
        defaults: {
          headers: {
            'user-agent': 'strapi',
          },
        },
      });

      reddit
        .query('auth')
        .get('me')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            callback(null, {
              username: body.name,
              email: `${body.name}@strapi.io`, // dummy email as Reddit does not provide user email
            });
          }
        });
      break;
    }
    case 'auth0': {
      const purestAuth0Conf = {};
      purestAuth0Conf[`https://${grant.auth0.subdomain}.auth0.com`] = {
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
      };
      const auth0 = purest({
        provider: 'auth0',
        config: {
          auth0: purestAuth0Conf,
        },
      });

      auth0
        .get('userinfo')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            const username =
              body.username || body.nickname || body.name || body.email.split('@')[0];
            const email = body.email || `${username.replace(/\s+/g, '.')}@strapi.io`;

            callback(null, {
              username,
              email,
            });
          }
        });
      break;
    }
    case 'cas': {
      const provider_url = 'https://' + _.get(grant['cas'], 'subdomain');
      const cas = purest({
        provider: 'cas',
        config: {
          cas: {
            [provider_url]: {
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
      cas
        .query()
        .get('oidc/profile')
        .auth(access_token)
        .request((err, res, body) => {
          if (err) {
            callback(err);
          } else {
            // CAS attribute may be in body.attributes or "FLAT", depending on CAS config
            const username = body.attributes
              ? body.attributes.strapiusername || body.id || body.sub
              : body.strapiusername || body.id || body.sub;
            const email = body.attributes
              ? body.attributes.strapiemail || body.attributes.email
              : body.strapiemail || body.email;
            if (!username || !email) {
              strapi.log.warn(
                'CAS Response Body did not contain required attributes: ' + JSON.stringify(body)
              );
            }
            callback(null, {
              username,
              email,
            });
          }
        });
      break;
    }
    default:
      callback(new Error('Unknown provider.'));
      break;
  }
};

const buildRedirectUri = strapi => (provider = '') =>
  `${getAbsoluteServerUrl(strapi.config)}/connect/${provider}/callback`;

module.exports = strapi => ({
  connect: connect(strapi),
  buildRedirectUri: buildRedirectUri(strapi),
});
