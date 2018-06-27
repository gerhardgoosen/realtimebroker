
module.exports = {
    ENV_NAME: process.env.ENV_NAME,
    REDIS_ENDPOINT: process.env.REDIS_ENDPOINT || 'http://rtbrokercache.redis.cache.windows.net',
    REDIS_PORT: process.env.REDIS_PORT || 6379,
    // Controls how often clients ping back and forth
    HEARTBEAT_TIMEOUT: 8000,
    HEARTBEAT_INTERVAL: 4000
};

module.exports.SELF_URL = process.env.SELF_URL;