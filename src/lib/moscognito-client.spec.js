const nock = require('nock');
const MoscognitoClient = require('./moscognito-client');

describe('MoscognitoClient', () => {
  const domain = 'localhost:1883/';

  // Set up mock responses
  const tokenDomain = 'https://testing123.auth.us-east-1.amazoncognito.com';
  const clientId = 'ID123456';
  const clientSecret = 'SECRETSAUCE';
  const clientScope = 'testing123.scope';
  const tokenEndpoint = '/oauth2/token';
  const mockResponse = {
    access_token: 'aaaeyJz9sdfsdfsdfsd',
    token_type: 'Bearer',
    expires_in: 3600
  };

  beforeEach(() => {
    // Setup Cognito mock
    nock(tokenDomain)
      .post(tokenEndpoint)
      .reply(() => mockResponse);
  });

  afterEach(() => {
    nock.cleanAll();
  });

  describe('initialization', () => {
    // Create client
    const client = new MoscognitoClient({
      connection: {
        url: domain
      }
    });

    it('should be defined', () => {
      expect(MoscognitoClient).toBeTruthy();
    });

    it('should be a valid instance', () => {
      expect(client.constructor).toBe(MoscognitoClient);
    });
  });

  describe('authorization', () => {
    it('should use username/password if accessType is not provided', (done) => {
      const client = new MoscognitoClient(
        {
          connection: {
            url: domain
          }
        },
        'username',
        'password'
      );
      client.getCredentials().then((credentials) => {
        expect(credentials).toEqual({
          username: 'username',
          password: 'password'
        });
        done();
      });
    });

    it('should use token if accessType is provided and is "client_credentials"', (done) => {
      const client = new MoscognitoClient(
        {
          connection: {
            url: domain
          },
          accessType: 'client_credentials',
          authDomain: tokenDomain,
          clientScope
        },
        clientId,
        clientSecret
      );
      client.getCredentials().then((credentials) => {
        expect(credentials).toEqual({
          username: clientId,
          password: mockResponse.access_token
        });
        done();
      });
    });
  });

  describe('connect/disconnect', () => {
    const client = new MoscognitoClient(
      {
        connection: {
          url: domain
        }
      },
      'username',
      'password'
    );

    it('should connect to broker with given credentials', (done) => {
      spyOn(client, 'initializeClient').andCallFake((credentials) => {
        expect(credentials).toEqual({
          username: 'username',
          password: 'password'
        });
        done();
      });
      client.connect();
    });

    it('should attempt to disconnect from broker before making a new connection', (done) => {
      let disconnectCount = 0;
      spyOn(client, 'disconnect').andCallFake(() => {
        disconnectCount += 1;
      });
      spyOn(client, 'initializeClient').andCallFake(() => {
        expect(disconnectCount).toBe(1);
        done();
      });
      client.connect();
    });

    it('should disconnect client if a client exists', () => {
      let endCount = 0;
      client.mqtt = {
        end() {}
      };
      spyOn(client.mqtt, 'end').andCallFake(() => {
        endCount += 1;
      });
      client.disconnect();
      expect(endCount).toBe(1);
    });
  });

  describe('events', () => {
    it('should attach onMessage to message event upon connect', (done) => {
      const client = new MoscognitoClient(
        {
          connection: {
            url: domain
          }
        },
        'username',
        'password',
        () => {}
      );
      spyOn(client, 'disconnect').andCallFake(() => {});
      spyOn(client, 'initializeClient').andCallFake(() => {});
      spyOn(client, 'on').andCallFake((event, onMessage) => {
        expect(event).toBe('message');
        expect(onMessage).toBe(client.onMessage);
        done();
      });
      client.connect();
    });

    it('should attach a handler to an event by a given name', (done) => {
      const client = new MoscognitoClient({});
      const eventName = 'subscribe';
      const eventHandler = () => {};
      spyOn(client, 'on').andCallFake((event, onMessage) => {
        expect(event).toBe(eventName);
        expect(onMessage).toBe(eventHandler);
        done();
      });
      client.on(eventName, eventHandler);
    });
  });

  describe('pub/sub', () => {
    it('should subscribe to topic with given settings', (done) => {
      const subscribeSettings = {
        qos: 1
      };
      const topic = 'topic1';
      const client = new MoscognitoClient({
        subscribe: subscribeSettings
      });
      client.mqtt = {
        subscribe(topics, options, callback) {} // eslint-disable-line
      };
      spyOn(client.mqtt, 'subscribe').andCallFake((topics, options) => {
        expect(topics).toBe(topic);
        expect(options).toBe(subscribeSettings);
        done();
      });
      client.subscribe(topic);
    });

    it('should publish to topic with given settings', (done) => {
      const publishSettings = {
        qos: 1
      };
      const topic = 'topic1';
      const client = new MoscognitoClient({
        publish: publishSettings
      });
      const payload = 'testing1,2,3';
      client.mqtt = {
        publish(topics, message, options, callback) {} // eslint-disable-line
      };
      spyOn(client.mqtt, 'publish').andCallFake((topics, message, options) => {
        expect(topics).toBe(topic);
        expect(message).toBe(payload);
        expect(options).toBe(publishSettings);
        done();
      });
      client.publish(topic, payload);
    });

    it('should unsubscribe from a given topic', (done) => {
      const topic = 'topic1';
      const client = new MoscognitoClient({});
      client.mqtt = {
        unsubscribe(topics, callback) {} // eslint-disable-line
      };
      spyOn(client.mqtt, 'unsubscribe').andCallFake((topics) => {
        expect(topics).toBe(topic);
        done();
      });
      client.unsubscribe(topic);
    });
  });
});