const MoscognitoServer = require('./moscognito-server');

describe('MoscognitoServer', () => {
  describe('authorization', () => {
    let moscognito;

    beforeEach(() => {
      moscognito = new MoscognitoServer();
      moscognito.server = {
        on(event, handler) {} // eslint-disable-line
      };
      spyOn(moscognito, 'initialize').and.callFake(() => {});
    });

    it('should return decoded token by default when getting user info', (done) => {
      const token = {
        id: '123456'
      };
      moscognito.getUserInfo(token, (err, user) => {
        expect(user).toBe(token);
        done();
      });
    });

    it('should return topics by default when calling getUserTopics(profile)', () => {
      const topics = ['topic1'];
      expect(moscognito.getUserTopics({
        topics
      })).toBe(topics);
    });

    it('should allow user to subscribe if user has topics', () => {
      const topics = ['topic1'];
      expect(moscognito.allowUserToSubscribe({
        topics
      }, 'topic1')).toBe(true);
    });

    it('should allow user to publish if user has topics', () => {
      const topics = ['topic1'];
      expect(moscognito.allowUserToPublish({
        topics
      }, 'topic1')).toBe(true);
    });

    it('should attach authenticate handler to server', () => {
      moscognito.start();
      expect(moscognito.server.authenticate).toBeTruthy();
    });

    it('should attach authorizePublish handler to server', () => {
      moscognito.start();
      expect(moscognito.server.authorizePublish).toBeTruthy();
    });

    it('should attach authorizeSubscribe handler to server', () => {
      moscognito.start();
      expect(moscognito.server.authorizeSubscribe).toBeTruthy();
    });
  });

  describe('moscognito-server: topicMatches(requestedTopic, topics = [])', () => {
    let server;

    beforeEach(() => {
      server = new MoscognitoServer();
    });

    it('should accept valid topic that matches string exactly', () => {
      expect(server.topicMatches('/topic/name', ['/topic/name'])).toBe(true);
    });

    it('should accept valid topic that is one of the string array', () => {
      expect(server.topicMatches('/topic/name', ['/topic/not-name', '/topic/name', '/topic/still-not-name'])).toBe(true);
    });

    it('should reject topic that does not match string exactly', () => {
      expect(server.topicMatches('/topic/name', ['/topic/not-name'])).toBe(false);
    });

    it('should accept single-level wildcard value', () => {
      expect(server.topicMatches('/topic/+/name', ['/topic/+/name'])).toBe(true);
    });

    it('should accept literal value that matches wildcard value', () => {
      expect(server.topicMatches('/topic/something/name', ['/topic/+/name'])).toBe(true);
    });

    it('should accept multiple single-level wildcard values', () => {
      expect(server.topicMatches('/topic/+/name/+', ['/topic/+/name/+'])).toBe(true);
    });

    it('should accept multiple literals in placement of single-value wildcards', () => {
      expect(server.topicMatches('/topic/something/name/something2', ['/topic/+/name/+'])).toBe(true);
    });

    it('should reject a single-value wildcard that is not immediately followed by a slash or the end of the string', () => {
      expect(server.topicMatches('/topic/something/this-shouldnt-work/name/something2', ['/topic/+/name/+'])).toBe(false);
      expect(server.topicMatches('/topic/something/name/this-shouldnt-work-either/something2', ['/topic/+/name/+'])).toBe(false);
    });

    it('should accept a singe multi-value wildcard', () => {
      expect(server.topicMatches('/topic/name/#', ['/topic/name/#'])).toBe(true);
    });

    it('should reject multiple multi-value wildcards', () => {
      expect(server.topicMatches('/topic/name/#/middle/#', ['/topic/name/#'])).toBe(false);
    });

    it('should reject multi-level wildcard that is not at the end', () => {
      expect(server.topicMatches('/topic/name/#/middle', ['/topic/name/#'])).toBe(false);
    });

    it('should accept literal in placement of a multi-value wildcard', () => {
      expect(server.topicMatches('/topic/name/multiple/topics/from/root', ['/topic/name/#'])).toBe(true);
    });
  });

  describe('events', () => {
    let moscognito;

    beforeEach(() => {
      moscognito = new MoscognitoServer();
      moscognito.server = {
        on(event, handler) {} // eslint-disable-line
      };
      spyOn(moscognito, 'initialize').and.callFake(() => {});
    });

    it('should attach onClientConnected hook to server instance', () => {
      const onClientConnected = () => {};
      moscognito.onClientConnected = onClientConnected;
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event, handler) => {
        if (event === 'clientConnected' && handler === onClientConnected) {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });

    it('should attach onClientDisconnecting hook to server instance', () => {
      const onClientDisconnecting = () => {};
      moscognito.onClientDisconnecting = onClientDisconnecting;
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event, handler) => {
        if (event === 'clientDisconnecting' && handler === onClientDisconnecting) {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });

    it('should attach onClientDisconnected hook to server instance', () => {
      const onClientDisconnected = () => {};
      moscognito.onClientDisconnected = onClientDisconnected;
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event, handler) => {
        if (event === 'clientDisconnected' && handler === onClientDisconnected) {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });

    it('should attach onPublished hook to server instance', () => {
      const onPublished = () => {};
      moscognito.onPublished = onPublished;
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event, handler) => {
        if (event === 'published' && handler === onPublished) {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });

    it('should attach onSubscribed hook to server instance', () => {
      const onSubscribed = () => {};
      moscognito.onSubscribed = onSubscribed;
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event, handler) => {
        if (event === 'subscribed' && handler === onSubscribed) {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });

    it('should attach onUnsubscribed hook to server instance', () => {
      const onUnsubscribed = () => {};
      moscognito.onUnsubscribed = onUnsubscribed;
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event, handler) => {
        if (event === 'unsubscribed' && handler === onUnsubscribed) {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });

    it('should attach to ready hook during initialization', () => {
      let eventCount = 0;
      spyOn(moscognito.server, 'on').and.callFake((event) => {
        if (event === 'ready') {
          eventCount += 1;
        }
      });
      moscognito.start();
      expect(eventCount).toBe(1);
    });
  });

  describe('start/initialize/stop', () => {
    let moscognito;
    let initializeCount = 0;
    let closeCount = 0;

    beforeEach(() => {
      moscognito = new MoscognitoServer();
      moscognito.server = {
        close() {
          closeCount += 1;
        },
        on(event, handler) {} // eslint-disable-line
      };
      spyOn(moscognito, 'initialize').and.callFake(() => {
        initializeCount += 1;
      });
    });

    afterEach(() => {
      initializeCount = 0;
      closeCount = 0;
    });

    it('should call initialize during start', () => {
      moscognito.start();
      expect(initializeCount).toBe(1);
    });

    it('should call close on server when stopping', () => {
      moscognito.start();
      moscognito.stop();
      expect(closeCount).toBe(1);
    });
  });
});