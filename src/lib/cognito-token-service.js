const axios = require('axios');
const { Base64 } = require('js-base64');
const querystring = require('querystring');

class CognitoTokenService {
  constructor(resourceUrl, clientId, clientSecret, clientScope) {
    this.resourceUrl = resourceUrl;
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.clientScope = clientScope;
  }

  getToken() {
    // Create Base64 token
    const baseToken = Base64.encode(`${this.clientId}:${this.clientSecret}`);
    const url = `${this.resourceUrl}/oauth2/token`;
    const body = querystring.stringify({ grant_type: 'client_credentials', scope: `${this.clientScope}` });
    const headers = {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${baseToken}`
      }
    };
    const promise = axios.post(url, body, headers)
      .then(response => response.data)
      .catch((error) => {
        console.error(error.message);
      });

    return promise;
  }
}

module.exports = CognitoTokenService;