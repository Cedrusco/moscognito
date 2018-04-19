const getPort = require('get-port');
const MoscognitoClient = require('../src/lib/moscognito-client');
const MoscognitoServer = require('../src/lib/moscognito-server');

describe('MoscognitoClient', () => {
  const token = 'ejsabsCawelaj.asasdfasdfasdf.asdRJenavjem';
  const setupServerEnvironment = async () => {
    // Get a random port, then start the server on that port
    const promise = getPort().then((port) => {
      // Set up and mock server
      const server = new MoscognitoServer({
        port,
        backend: {}
      }, {});

      // Mock authorization
      server.validateToken = (c, t, cb) => {
        if (t === token) {
          cb(null, true);
        } else {
          cb(false);
        }
      };
      server.start();

      // Return reference to server and port
      return {
        server,
        port
      };
    });
    return promise;
  };

  const setupClient = async (username, password, onMessage) => {
    const { server, port } = await setupServerEnvironment();
    const client = new MoscognitoClient({
      connection: {
        url: `mqtt://localhost:${port}`
      }
    }, username, password || token, onMessage);
    return {
      server,
      port,
      client
    };
  };

  const runTestWith = async (clientParams, test) => {
    // Set up environment
    const environment = await setupClient(...clientParams);

    // Run tests
    test(environment);

    // Tear down environment
    environment.client.disconnect(true);
    environment.server.stop();
  };

  it('should exist', () => {
    expect(MoscognitoClient).toBeTruthy();
  }, 5000);

  it('should have a valid constructor', (done) => {
    runTestWith([], (environment) => {
      expect(environment.client.constructor).toBeTruthy();
      done();
    });
  });

  // describe('initialization', () => {
  // });

  // describe('connection', () => {
  //   let client;
  //   let connected = false;
  //   beforeEach((done) => {
  //     client = new MoscognitoClient({
  //       connection: {
  //         url: 'mqtt://localhost:1883'
  //       }
  //     }, 'username', token);

  //     client.on('connect', () => {
  //       connected = true;
  //       done();
  //     });
  //   });

  //   afterEach((done) => {
  //     client.disconnect(true, () => {
  //       done();
  //     });
  //   });

  //   it('should connect upon instantiation', () => {
  //     expect(connected).toBe(true);
  //   });
  // });
});