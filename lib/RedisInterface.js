//imports
let config = require('./Config');
let redis = require('redis');
//variables


function RedisInterface() {
    console.log(`RedisInterface()`);
    var self = this;

    this.redisClient = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
        password: config.REDIS_PASSWORD,
        tls: {servername: config.REDIS_ENDPOINT}
    });


    // this.redisSubscriber = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
    //     password: config.REDIS_PASSWORD,
    //     tls: {servername: config.REDIS_ENDPOINT}
    // });
    //
    // this.redisPublisher = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
    //     password: config.REDIS_PASSWORD,
    //     tls: {servername: config.REDIS_ENDPOINT}
    // });

    this.redisClient.on('error',function(err){ console.error(new Date(), 'redisClient error', err);})
    // this.redisSubscriber.on('error',function(err){console.error(new Date(), 'redisSubscriber error', err);})
    // this.redisPublisher.on('error',function(err){ console.error(new Date(), 'redisPublisher error', err);})

    this.redisClient.on('reconnecting',function(err){  console.warn(new Date(), 'redisClient reconnecting', arguments);})
    // this.redisSubscriber.on('reconnecting',function(err){ console.warn(new Date(), 'redisSubscriber reconnecting', arguments);})
    // this.redisPublisher.on('reconnecting',function(err){ console.warn(new Date(), 'redisPublisher reconnecting', arguments);})

    this.redisClient.on('connect',function(err){  console.log(new Date(), 'redisClient is now connected!');})
    // this.redisSubscriber.on('connect',function(err){ console.log(new Date(), 'redisSubscriber is now connected!');})
    // this.redisPublisher.on('connect',function(err){ console.log(new Date(), 'redisPublisher is now connected!');})


    this.redisClient.on('end',function(err){  console.log(new Date(), 'redisClient connection ended??');})
    // this.redisSubscriber.on('end',function(err){ console.log(new Date(), 'redisSubscriber connection ended??');})
    // this.redisPublisher.on('end',function(err){ console.log(new Date(), 'redisPublisher connection ended??');})

    //
    // this.redisClient.set("foo", 'bar');
    //
    // this.redisClient.get("foo", function (err, reply) {
    //     console.log(reply.toString())
    // });


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

/**
 * init RedisInterface Controller
 *
 * @param
 **/
RedisInterface.prototype._getPublisher = function () {
    var self = this;
    return self.redisPublisher;
};

/**
 * init RedisInterface Controller
 *
 * @param
 **/
RedisInterface.prototype._getSubscriber = function () {
    var self = this;
    return self.redisSubscriber;
};