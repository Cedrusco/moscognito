const CognitoExpress = require('cognito-express');
const mosca = require('mosca');
const stringify = require('json-stringify-safe');

class MoscognitoServer {
  constructor(moscaConfig, authConfig, logger) {
    this.moscaConfig = moscaConfig;
    this.authConfig = authConfig;
    this.logger = logger || console; // Console by default
  }

  start() {
    // Set up the Mosca server
    this.server = new mosca.Server(this.moscaConfig);

    // Set up authentication via JWT
    this.server.authenticate = (client, username, password, callback) => {
      // Get the token from password field
      const token = password ? password.toString() : '';
      this.validateToken(client, token, callback);
    };

    // Set callback for controlling publish authorization
    this.server.authorizePublish = (client, topic, payload, callback) => {
      callback(null, this.allowUserToPublish(client.profile, topic));
      if (!this.allowUserToPublish(client.profile, topic)) {
        client.close();
      }
    };

    // Set callback for controlling subscription authorization
    this.server.authorizeSubscribe = (client, topic, callback) => {
      callback(null, this.allowUserToSubscribe(client.profile, topic));
      if (!this.allowUserToSubscribe(client.profile, topic)) {
        client.close();
      }
    };

    // Fired when the mqtt server is ready
    this.server.on('ready', () => {
      this.logger.info('Moscognito server is up and running:');
      if (this.moscaConfig.port) this.logger.info(`MQTT on port ${this.moscaConfig.port}`);
      if (this.moscaConfig.http && this.moscaConfig.http.port) this.logger.info(`MQTT/HTTP on port ${this.moscaConfig.http.port}`);
      if (this.moscaConfig.secure && this.moscaConfig.secure.port) this.logger.info(`MQTTS/TLS on port ${this.moscaConfig.secure.port}`);
      if (this.moscaConfig.https && this.moscaConfig.https.port) this.logger.info(`WSS/HTTPS on port ${this.moscaConfig.https.port}`);
    });

    // Events
    // =========================================================================

    // - clientConnected, when a client is connected
    // the client is passed as a parameter.
    this.server.on('clientConnected', (client) => {
      this.onClientConnected(client);
    });

    // - clientDisconnecting, when a client is being disconnected
    // the client is passed as a parameter.
    this.server.on('clientDisconnecting', (client) => {
      this.onClientDisconnecting(client);
    });

    // - clientDisconnected, when a client is disconnected
    // the client is passed as a parameter.
    this.server.on('clientDisconnected', (client) => {
      this.onClientDisconnected(client);
    });

    // - published, when a new message is published
    // the packet and the client are passed as parameters.
    this.server.on('published', (message, client) => {
      this.onPublished(message, client);
    });

    // - subscribed, when a client is subscribed to a topic
    // the topic and the client are passed as parameters.
    this.server.on('subscribed', (topic, client) => {
      this.onSubscribed(topic, client);
    });

    // - unsubscribed, when a client is unsubscribed to a topic
    // the topic and the client are passed as parameters.
    this.server.on('unsubscribed', (topic, client) => {
      this.onSubscribed(topic, client);
    });
  }

  /**
   * Stop the Moscognito server
   */
  stop() {
    this.server.close();
  }

  /**
   * Decode and validate JWT
   * @param {string} token The undecoded JWT to validate and decode
   */
  validateToken(client, token, callback) {
    const {
      region, userPoolId, tokenUse, tokenExpiration
    } = this.authConfig;
    const cognitoExpress = new CognitoExpress({
      region,
      cognitoUserPoolId: userPoolId,
      tokenUse,
      tokenExpiration: tokenExpiration || 3600000 // Default: 1 hour
    });

    cognitoExpress.validate(token, (err, decodedToken) => {
      if (err) {
        // Return error if any
        this.logger.error(err);
        callback(err);
      } else {
        // If user is authenticated, set authorized to true, add profile to client
        this.getUserInfo(decodedToken, (userErr, profile) => {
          if (userErr) {
            callback(err);
          } else {
            client.profile = profile;
            callback(null, true);
          }
        });
      }
    });
  }

  /**
   * Get user information.  Default = decodedToken.  Override to augment user information
   * @param {object} token Decoded JWT used to get user information
   */
  getUserInfo(decodedToken, callback) { // eslint-disable-line class-methods-use-this
    callback(null, decodedToken);
  }

  /**
   * Return array of topics the user is allowed to access. Default = profile.topics
   * @param {object} profile The user profile to check for permissions
   */
  getUserTopics(profile) { // eslint-disable-line class-methods-use-this
    return profile.topics || [];
  }

  /**
   * Rules to allow the user to subscribe.
   * Default = user has topic name in the topics array object} topic
   * @param {string} topic The name of the topic attempting to subscribe to
   * @param {object} profile The user profile to check for permissions
   */
  allowUserToSubscribe(profile, topic) {
    return this.topicMatches(topic, this.getUserTopics(profile));
  }

  /**
   * Rules to allow the user to publish.
   * Default = user has topic name in the topics array object} topic
   * @param {string} topic The name of the topic attempting to publish to
   * @param {object} profile The user profile to check for permissions
   */
  allowUserToPublish(profile, topic) {
    return this.topicMatches(topic, this.getUserTopics(profile));
  }

  /**
   * Determine if topic matches.  Allows for MQTT + and # wildcards.
   * @param {string} requestedTopic The topic to determine if they match
   * @param {string[]} topics The array of topics to compare to
   */
  topicMatches(requestedTopic, topics = []) { // eslint-disable-line class-methods-use-this
    // Return true if topic matches at least one regex
    return topics.filter((topic) => {
      // Get regex representation of topic (needs escape chars for string)
      const metachars = /[\-\[\]\/\{\}\(\)\*\?\.\\\^\$\|]/g; // eslint-disable-line no-useless-escape
      const replace = topic
        .replace(metachars, '\\$&') // Replace metachars except +
        .replace(/#/g, '(([^#])*(#)?)') // Replace # wildcard (multi-level: anything without # except at end)
        .replace(/\+/g, '([^\\/#])+'); // Replace + wildcard (single-level: anything before a slash or #)
      const regex = new RegExp(`^${replace}$`); // Add start/end metachars

      // If requested topic matches, return true
      return requestedTopic.match(regex);
    }).length > 0;
  }

  /**
   * Hook fired after successful client connection
   * @param {object} client Client reference
   */
  onClientConnected(client) {
    this.logger.debug('New connection: ', stringify(client.profile, null, 2));
  }

  /**
   * Hook fired when client disconnecting
   * @param {object} client Client reference
   */
  onClientDisconnecting(client) {
    this.logger.debug('Disconnecting: ', stringify(client.profile, null, 2));
  }

  /**
   * Hook fired after disconnection
   * @param {object} client Client reference
   */
  onClientDisconnected(client) {
    this.logger.debug('Disconnected: ', stringify(client.profile, null, 2));
  }

  /**
   * Hook fired after message published to topic
   * @param {object} message The message published to the topic
   * @param {object} client Client reference
   */
  onPublished(message, client) { // eslint-disable-line no-unused-vars
    this.logger.debug('Published: ', stringify({ topic: message.topic, payload: message.payload.toString() }, null, 2));
  }

  /**
   * Hook fired after client subscribed to topic
   * @param {object} topic The topic subscribed to
   * @param {object} client Client reference
   */
  onSubscribed(topic, client) { // eslint-disable-line no-unused-vars
    this.logger.debug('Subscribed: ', stringify({ topic }, null, 2));
  }

  /**
   * Hook fired after client unsubscribed
   * @param {object} topic The topic the user unsubscribed from
   * @param {object} client Client reference
   */
  onUnsubscribed(topic, client) { // eslint-disable-line no-unused-vars
    this.logger.debug('Unsubscribed: ', stringify({ topic }, null, 2));
  }
}

module.exports = MoscognitoServer;