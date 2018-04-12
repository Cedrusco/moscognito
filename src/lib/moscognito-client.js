const mqtt = require('mqtt');
const CognitoTokenService = require('./cognito-token-service');

class MoscognitoClient {
  constructor(config, username, password, onMessage) {
    this.config = config;
    this.onMessage = onMessage;

    // Use Cognito token to get value if configured, otherwise, use user/pass
    const { accessType, authDomain, clientScope } = this.config;
    this.username = username;
    this.password = password;
    if (accessType === 'client_credentials') {
      this.tokenService = new CognitoTokenService(authDomain, username, password, clientScope);
    }
  }

  /**
   * Initiate connection to broker
   */
  connect() {
    // Disconnect first
    this.disconnect(true);

    // Attempt connection
    return this.getCredentials().then((credentials) => {
      this.initializeClient(credentials);
      if (this.onMessage) {
        this.on('message', this.onMessage);
      }
    }).catch((error) => {
      console.error(error);
    });
  }

  initializeClient(credentials) {
    const options = Object.assign(credentials, this.config.options);
    this.mqtt = mqtt.connect(this.config.connection.url, options);
  }

  /**
   * Get credentials for use in connection
   */
  getCredentials() {
    // If a token service is instantiated, use service
    if (this.tokenService) {
      return this.tokenService.getToken().then((response) => {
        const credentials = {
          username: this.username,
          password: response.access_token
        };
        return credentials;
      });
    }
    // Otherwise, resolve with username/pass
    return Promise.resolve({
      username: this.username,
      password: this.password
    });
  }

  /**
   * Disconnect from broker
   * @param {boolean} force Set to true to disconnect without waiting for messages to complete
   * @param {function} callback Function to call after disconnecting
   */
  disconnect(force, callback) {
    if (this.mqtt) {
      try {
        this.mqtt.end(force, callback);
      } catch (err) {
        console.error(err.message);
      }
    }
  }

  /**
   * Subscribe to a topic or topics
   * @param {string[]} topics Topics to subscribe to
   */
  subscribe(topics) {
    if (this.mqtt) {
      try {
        this.mqtt.subscribe(topics, this.config.subscribe, this.handleDefaultResponse);
      } catch (err) {
        console.error(err.message);
      }
    }
  }

  /**
   * Publish a message to a given topic
   * @param {string} topic Topic to publish to
   * @param {object} message The message payload
   */
  publish(topic, message) {
    if (this.mqtt) {
      try {
        this.mqtt.publish(topic, message, this.config.publish, this.handleDefaultResponse);
      } catch (err) {
        console.error(err.message);
      }
    }
  }

  /**
   * Unsusbscribe from one or more topics
   * @param {string} topics Topics to unsubscribe from
   */
  unsubscribe(topics) {
    if (this.mqtt) {
      try {
        this.mqtt.unsubscribe(topics, this.handleDefaultResponse);
      } catch (err) {
        console.error(err.message);
      }
    }
  }

  /**
   * Register a handler for a specific event type
   * @param {string} event The event to listen for
   * @param {function} handler The handler for that event
   */
  on(event, handler) {
    this.mqtt.on(event, handler);
  }

  /**
   * Handle error response scenearios
   * @param {object} err Error object
   * @param {object[]} responses Responses returned from broker
   */
  handleDefaultResponse(err, responses) {
    if (err) {
      console.error(err);
    } else if (
      responses &&
      responses.length &&
      responses.filter(response => response.qos === 128).length > 0
    ) {
      // If there is a 128 response (refused), close connection
      console.error('Broker refused client connection.  Disconnecting.');
      this.disconnect(true);
    }
  }
}

module.exports = MoscognitoClient;