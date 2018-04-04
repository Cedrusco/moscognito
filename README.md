# Moscognito

## Overview

Modified Mosca MQTT server with AWS Cognito as both standalone and integrated Node.js class authorizing client connections and pub/sub.

## Getting Started

Install dependencies by running `npm install --production` for production, or `npm install` if you want to develop live using Nodemon. These configurations use a testing certificate and key for TLS/HTTPS tunneling. These should be replaced with the correct certs for each environment.

## Scripts

### Building / Publishing

```bash
npm run build
```

```bash
npm run publish
```

### Lint

```bash
npm run lint
```

### Test

Without coverage

```bash
npm run test
```

With coverage (TODO: currently below 70%, hit threshold)

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

## Standalone (TODO)

Bacon ipsum dolor amet pork belly spare ribs fatback, pork chop hamburger corned beef salami frankfurter prosciutto tri-tip meatball capicola sausage. Tri-tip chuck drumstick, t-bone pastrami corned beef cupim prosciutto biltong alcatra tongue. Cupim bacon pancetta chicken cow. Jowl ham beef strip steak meatball burgdoggen ribeye biltong rump doner boudin tongue. Strip steak kielbasa pork loin, pastrami tri-tip swine capicola leberkas chuck cupim sirloin jerky. Alcatra jowl sausage rump swine ground round short ribs ball tip meatloaf filet mignon burgdoggen.

## Authors / Contributors

* Matt Johnson (src-system42)

## Copyright

MIT - Copyright (c) 2018 Cedrus, LLC.