```text
         _____   ____    ____     _____   ____    __  __  ______  ______  _____      
 /'\_/`\/\  __`\/\  _`\ /\  _`\  /\  __`\/\  _`\ /\ \/\ \/\__  _\/\__  _\/\  __`\    
/\      \ \ \/\ \ \,\L\_\ \ \/\_\\ \ \/\ \ \ \L\_\ \ `\\ \/_/\ \/\/_/\ \/\ \ \/\ \   
\ \ \__\ \ \ \ \ \/_\__ \\ \ \/_/_\ \ \ \ \ \ \L_L\ \ , ` \ \ \ \   \ \ \ \ \ \ \ \  
 \ \ \_/\ \ \ \_\ \/\ \L\ \ \ \L\ \\ \ \_\ \ \ \/, \ \ \`\ \ \_\ \__ \ \ \ \ \ \_\ \ 
  \ \_\\ \_\ \_____\ `\____\ \____/ \ \_____\ \____/\ \_\ \_\/\_____\ \ \_\ \ \_____\
   \/_/ \/_/\/_____/\/_____/\/___/   \/_____/\/___/  \/_/\/_/\/_____/  \/_/  \/_____/
                                                                                     
=====================================================================================  

```

## Moscognito Overview

Modified Mosca MQTT server with AWS Cognito as both standalone and integrated Node.js class authorizing client connections and pub/sub.

## Getting Started

Install dependencies by running `npm install --production` for production, or `npm install` if you want to develop live using Nodemon. These configurations use a testing certificate and key for TLS/HTTPS tunneling. These should be replaced with the correct certs for each environment.

## Scripts

### Building

```bash
npm run build
```

### Lint

```bash
npm run lint
```

### Publishing

```bash
npm run publish
```

### Test

Without coverage

```bash
npm run test
```

With coverage `(TODO: currently below 70%, hit threshold)`

```bash
npm run test:coverage
```

## Node.js Integration

You can configure different environments using an object structured with the following properties:

```javascript
const { MoscognitoServer } = require('moscognito');

// Set up the configuration (see below for specifications)
const config = {
    authorization: { ... },
    broker: { ... }
};

// Instantiate and start the server
const server = new MoscognitoServer(config.broker, config.authorization);
server.start();
```

* `authorization`: The configuration properties for authorizing a token authored by AWS Cognito.

    ```javascript
    "authorization": {
        "region": "<region>",
        "tokenExpiration": 3600000,
        "tokenUse": "<access|id>",
        "userPoolId": "<region>_<client id>"
    }
    ```

* `broker`: The Mosca configuration using the `moscaSettings` properties defined [here](https://github.com/mcollina/mosca/wiki/Mosca-basic-usage).

## Standalone

Start a test standalone server using Docker (this assumes you have Docker installed on your system).

Build the initial image:

```bash
npm run docker:build
```

Run the Moscognito server as a standalone with test credentials:

```bash
npm run docker:run -- -r <region> -e <expiry> -u <access|id> -i <pool id> -t <topics>
```

* `-r, --cognito-region`:  The AWS Cognito region
* `-e, --cognito-expiration`:  The AWS Cognito token expiration timeframe (default = 3600000)
* `-u, --cognito-usage`:  The AWS Cognito token usage.  Acceptable values are "access" and "token"
* `-i, --cognito-id`:  The AWS Cognito user pool ID
* `-t, --topics`:  Topics the valid user is allowed to connect to as a comma-separated list. e.g. `topic/1,topic/2`.

## TODO

* Add backend configuration for standalone
* Add certificate configuration for standalone
* Increase code coverage

## Authors / Contributors

* Matt Johnson (src-system42)

## Credits / Inspiration

* Matteo Collina for Mosca (https://github.com/mcollina/mosca/blob/master/lib/client.js)
* Eugenio Pace for Auth0 Mosca inspiration (https://github.com/eugeniop/auth0mosca)
* Logo generated using http://patorjk.com/software/taag/#p=display&f=Larry%203D&t=MOSCOGNITO

## Copyright

MIT - Copyright (c) 2018 Cedrus, LLC.