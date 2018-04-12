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
});