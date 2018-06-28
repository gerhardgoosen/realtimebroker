//imports
let config = require('./config');
let redis = require('redis');
//let redisAdapter = require('socket.io-redis');

//variables


function RedisInterface() {
    console.log(`RedisInterface()`);
    var self = this;

    this.redisClient = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
        password: config.REDIS_PASSWORD,
        tls: {servername: config.REDIS_ENDPOINT}
    });

    this.redisClient.set("foo", 'bar');

    this.redisClient.get("foo", function (err, reply) {
        console.log(reply.toString())
    })
}

module.exports = new RedisInterface();

/**
 * init RedisInterface Controller
 *
 * @param
 **/
RedisInterface.prototype._getClient = function () {
    var self = this;
    return self.redisClient;
};