let redis = require('redis');
let config = require('./Config');

function Presence(socketInterface,redisInterface) {
    this.socketInterface = socketInterface;
    this.client = redisInterface._getClient();
    // this.publisher = redisInterface._getPublisher();
    // this.subscriber = redisInterface._getSubscriber();
    //
    // this.subscriber.subscribe('presense');
    // this.subscriber.on("message", function(channel, message) {
    //     console.log('channel : ' +channel + ', message : ' + message);
    // });


    this.client.set("foo", 'bar');

    this.client.get("foo", function (err, reply) {
        console.log(reply.toString())
    });

}

module.exports = function (socketInterface,redisInterface) {
    return new Presence(socketInterface,redisInterface);
}

/**
 * Remember a present user with their connection ID
 *
 * @param {string} username - The username of the connection
 * @param {object} meta - Any metadata about the connection
 **/
Presence.prototype.upsert = function (username, meta) {
    this.client.hset(
        'presence',
        username,
        JSON.stringify({
            meta: meta,
            when: Date.now()
        }),
        function (err) {
            if (err) {
                console.error('Failed to store presence in redis: ' + err);
            }
        }
    );

  //  this.publisher.publish('presense',username);

    // if(!this.client.hexists( 'presence',  username   )){
    //     this.client.hset(
    //         'presence',
    //         username,
    //         JSON.stringify({
    //             meta: meta,
    //             when: Date.now()
    //         }),
    //         function (err) {
    //             if (err) {
    //                 console.error('Failed to store presence in redis: ' + err);
    //             }
    //         }
    //     );
    //
    //     this.publisher.publish('presense',username);
    //
    // }else{
    //     this.client.hget(
    //         'presence',
    //         username,
    //         function (err,reply) {
    //             if (err) {
    //                 console.error('Failed to get presence in redis: ' + err);
    //             }
    //             if(reply){
    //                 console.error('Redis: ' + reply);
    //
    //                 reply.meta.socketId=meta.socketId;
    //
    //                 this.client.hset(
    //                     'presence',
    //                     username,
    //                     JSON.stringify({
    //                         meta: reply.meta,
    //                         when: Date.now()
    //                     }),
    //                     function (err) {
    //                         if (err) {
    //                             console.error('Failed to store presence in redis: ' + err);
    //                         }
    //                     }
    //                 );
    //
    //             }
    //         }
    //     );
    // }


};
// Presence.prototype.upsert = function (connectionId, meta) {
//     console.log(this.client.hexists( 'presence',  connectionId   ));
//
//     this.client.hset(
//         'presence',
//         connectionId,
//         JSON.stringify({
//             meta: meta,
//             when: Date.now()
//         }),
//         function (err) {
//             if (err) {
//                 console.error('Failed to store presence in redis: ' + err);
//             }
//         }
//     );
//
//     this.publisher.publish('presense',connectionId);
// };

/**
 * Remove a presence. Used when someone disconnects
 *
 * @param {string} connectionId - The ID of the connection
 * @param {object} meta - Any metadata about the connection
 **/
Presence.prototype.remove = function (connectionId) {
    this.client.hdel(
        'presence',
        connectionId,
        function (err) {
            if (err) {
                console.error('Failed to remove presence in redis: ' + err);
            }
        }
    );
};

/**
 * Returns a list of present users, minus any expired
 *
 * @param {function} callback - callback to return the present users
 **/
Presence.prototype.list = function (callback) {
    var active = [];
    var dead = [];
    var now = Date.now();
    var self = this;

    this.client.hgetall('presence', function (err, presence) {
        if (err) {
            console.error('Failed to get presence from Redis: ' + err);
            return returnPresent([]);
        }


        for (var username in presence) {
            var details = JSON.parse(presence[username]);
            details.username = username;

            if (now - details.when > 8000) {//8sec  of idle
                details.idle=true;
            }else{
                details.idle=false;
            }


            if (details.idle && (now - details.when > 60000)) {//one minute of idle
                dead.push(details);
            }else{
                active.push(details);
            }
        }

         if (dead.length) {
             self._clean(dead);
         }

        return callback(active);
    });
};

/**
 * Cleans a list of connections by removing expired ones
 *
 * @param
 **/
Presence.prototype._clean = function (toDelete) {
    console.log(`Cleaning ${toDelete.length} expired presences`);
    for (var presence of toDelete) {
        this.remove(presence.username);
    }

    this.socketInterface.updatePresence();
};