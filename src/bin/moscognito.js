const commander = require('commander');
const fs = require('fs');
const path = require('path');
const MoscognitoServer = require('../lib/moscognito-server');

const argv = process.argv || [];
console.info(JSON.stringify(argv));
const program = new commander.Command();

// Define parameters
program
  .option('-r, --cognito-region <s>', 'The AWS Cognito region')
  .option('-e, --cognito-expiration <n>', 'The AWS Cognito token expiration timeframe (default = 3600000)', parseInt)
  .option('-u, --cognito-usage <s>', 'The AWS Cognito token usage.  Acceptable values are "access" and "token"')
  .option('-i, --cognito-id <s>', 'The AWS Cognito user pool ID')
  .option('-t, --topics <s>', 'Topics the valid user is allowed to connect to.')
  .parse(argv);

// Display text, then load server
fs.readFile(path.join(__dirname, 'logo.txt'), (err, logo) => {
  if (err) {
    console.error(err.message);
    process.exit(1);
  }

  // Display logo, start server
  // Credit: http://patorjk.com/software/taag/#p=display&f=Larry%203D&t=MOSCOGNITO
  console.info(logo.toString());

  // Load the server
  loadServer();
});

function loadServer() {
  // Get Cognito settings
  const {
    cognitoExpiration,
    cognitoId,
    cognitoRegion,
    cognitoUsage
  } = program;

  const cognitoSettings = {
    region: cognitoRegion || 'us-east-1',
    tokenExpiration: cognitoExpiration || 3600000,
    tokenUse: cognitoUsage || 'access',
    userPoolId: cognitoId
  };

  // Set Mosca settings
  // TODO: Allow for override/broker/moscognito.keys
  const moscaSettings = {
    backend: {
      type: 'mongo',
      url: 'mongodb://0.0.0.0:27017/mqtt',
      pubsubCollection: 'ascoltatori',
      mongo: {}
    },
    secure: {
      port: 8883,
      keyPath: '/broker/moscognito.key',
      certPath: '/broker/moscognito.crt'
    },
    https: {
      port: 8443,
      static: 'static',
      bundle: true
    }
  };

  // Get topics user is allowed to connect to
  const { topics } = program;
  const profileTopics = topics ? topics.split(',') : ['hello/world'];

  // Start the Moscognito Server, override topics with args
  const server = new MoscognitoServer(moscaSettings, cognitoSettings);
  server.getUserTopics = profile => profileTopics; // eslint-disable-line no-unused-vars
  server.start();
}