const MoscognitoServer = require('./moscognito-server');

describe('moscognito-server: authorization functions', () => {
  let server;

  beforeEach(() => {
    server = new MoscognitoServer();
  });

  it('should return topics by default when calling getUserTopics(profile)', () => {
    const topics = ['topic1'];
    expect(server.getUserTopics({
      topics
    })).toBe(topics);
  });

  it('should allow user to subscribe if user has topics', () => {
    const topics = ['topic1'];
    expect(server.allowUserToSubscribe({
      topics
    }, 'topic1')).toBe(true);
  });

  it('should allow user to publish if user has topics', () => {
    const topics = ['topic1'];
    expect(server.allowUserToPublish({
      topics
    }, 'topic1')).toBe(true);
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