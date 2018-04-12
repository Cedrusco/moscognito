const nock = require('nock');
const CognitoTokenService = require('./cognito-token-service');

describe('CognitoTokenService', () => {
  let cognitoTokenService;

  // Set up mock responses
  const domain = 'https://testing123.auth.us-east-1.amazoncognito.com';
  const clientId = 'ID123456';
  const clientSecret = 'SECRETSAUCE';
  const clientScope = 'testing123.scope';
  const tokenEndpoint = '/oauth2/token';
  const mockResponse = {
    access_token: 'eyJz9sdfsdfsdfsd',
    token_type: 'Bearer',
    expires_in: 3600
  };

  beforeEach(() => {
    cognitoTokenService = new CognitoTokenService(domain, clientId, clientSecret, clientScope);
    nock(domain)
      .post(tokenEndpoint)
      .reply(function (uri, requestBody) { // eslint-disable-line prefer-arrow-callback
        return {
          request: {
            body: requestBody,
            path: uri,
            headers: this.req.headers
          },
          response: mockResponse
        };
      });
  });

  afterEach(() => {
    nock.cleanAll();
  });

  it('should be defined', () => {
    expect(CognitoTokenService).toBeTruthy();
  });

  it('should have a valid constructor', () => {
    expect(cognitoTokenService.constructor).toBeTruthy();
  });

  it('should make request to domain name + /oauth2/token', (done) => {
    cognitoTokenService.getToken().then((data) => {
      expect(data.request.path).toEqual(tokenEndpoint);
      done();
    });
  });

  it('should pass client ID and client credentials as Authorization header', (done) => {
    const base64Token = 'Basic SUQxMjM0NTY6U0VDUkVUU0FVQ0U=';
    cognitoTokenService.getToken().then((data) => {
      expect(data.request.headers.authorization).toEqual(base64Token);
      done();
    });
  });

  it('should pass in grant type and scopes as a x-www-form-urlencoded string', (done) => {
    const expectedBody = 'grant_type=client_credentials&scope=testing123.scope';
    cognitoTokenService.getToken().then((data) => {
      expect(data.request.body).toEqual(expectedBody);
      done();
    });
  });

  it('should pass in header content type as x-www-form-urlencoded', (done) => {
    const expectedContentType = 'application/x-www-form-urlencoded';
    cognitoTokenService.getToken().then((data) => {
      expect(data.request.headers['content-type']).toEqual(expectedContentType);
      done();
    });
  });
});