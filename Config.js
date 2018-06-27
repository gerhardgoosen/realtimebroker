
module.exports = {
    ENV_NAME: process.env.ENV_NAME,
    REDIS_ENDPOINT: process.env.REDIS_ENDPOINT || 'rtbrokercache.redis.cache.windows.net',
    REDIS_PORT: process.env.REDIS_PORT || 6380,
    REDIS_PASSWORD: 'IxWFBzCwZ2fAhmHu430u9YC7Rvv0viCjyUghrpCOUAM=',
    REDIS_URL: '//rtbrokercache.redis.cache.windows.net:6380,password=IxWFBzCwZ2fAhmHu430u9YC7Rvv0viCjyUghrpCOUAM=,ssl=True,abortConnect=False',
    // Controls how often clients ping back and forth
    HEARTBEAT_TIMEOUT: 8000,
    HEARTBEAT_INTERVAL: 4000
};

module.exports.SELF_URL = process.env.SELF_URL;