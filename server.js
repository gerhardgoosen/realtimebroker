// Setup basic express server
//Setting up Redis Cache
//var redis = require('redis');

var config = require('./config');

var express = require('express');
var path = require('path');
var http = require('http');
var socket = require('socket.io');

const redis = require('redis');
const redisAdapter = require('socket.io-redis');


var Presence = require('./Presence');


var app = express();
var server = http.createServer(app);
var io = socket.listen(server);
var port = process.env.PORT || 1337;

var requests = [];
var requestsTrimThreshold = 5000;
var requestsTrimSize = 4000;


//io.adapter(redis({host: config.REDIS_ENDPOINT, port: config.REDIS_PORT,auth_pass:rtadmin#easy0N3}));

//const pub = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, { auth_pass: "T5Lt017Jkr57Qq68XVU9TbkuUdABofgD14KMJ16nJqw=" });
//const sub = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, { auth_pass: "T5Lt017Jkr57Qq68XVU9TbkuUdABofgD14KMJ16nJqw=" });
//
// const pubClient = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
//     auth_pass: 'T5Lt017Jkr57Qq68XVU9TbkuUdABofgD14KMJ16nJqw=',
//     tls: { servername: config.REDIS_ENDPOINT }
// });
//
// const subClient = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
//     auth_pass: 'T5Lt017Jkr57Qq68XVU9TbkuUdABofgD14KMJ16nJqw=',
//     tls: { servername: config.REDIS_ENDPOINT }
// });
//io.adapter(redisAdapter({ pubClient: pubClient, subClient: subClient }));


const redisClient = redis.createClient(config.REDIS_PORT, config.REDIS_ENDPOINT, {
    auth_pass: config.REDIS_PASSWORD,
    tls: { servername: config.REDIS_ENDPOINT }
});


redisClient.set("foo", 'bar');
redisClient.get("foo", function (err, reply) {
    console.log(reply.toString())
})


server.listen(port, () => {
    console.log('Server listening at port %d', port);
});


app.use(function (req, res, next) {
    logRequest(req, res, next);
});

function logRequest(req, res, next) {
    requests.push(Date.now());
    if (requests.length > requestsTrimThreshold) {
        requests = requests.slice(0, requests.length - requestsTrimSize);
    }
    if (next) {
        next();
    }
}

app.get("/requests/:seconds", function (req, res) {
    if (req.params.seconds) {
        var now = Date.now();
        var aMinAgo = now - (req.params.seconds * 1000);
        var cnt = 0;

        for (var i = requests.length - 1; 1 >= 0; i--) {
            if (requests[i] >= aMinAgo) {
                ++cnt;
            } else {
                break;
            }
        }
        res.json({request: cnt, timeframe: req.params.seconds});
    } else {
        res.html("privide seconds parameter /requests/60 - for the last minute!");
    }
})


// Routing
app.use(express.static(path.join(__dirname, 'public')));

var numUsers = 0;


io.on('connection', (socket) => {
    var addedUser = false;

    Presence.list(function (users) {
        // Tell the socket how many users are present.
        io.to(socket.id).emit('presence', {
            numUsers: users.length
        });
    });

    // when the client emits 'new message', this listens and executes
    socket.on('new message', (data) => {
        logRequest(null, null, null);
        // we tell the client to execute 'new message'
        socket.broadcast.emit('new message', {
            username: socket.username,
            message: data
        });
    });

    // when the client emits 'add user', this listens and executes
    socket.on('add user', (username) => {
        logRequest(null, null, null);
        if (addedUser) return;

        // we store the username in the socket session for this client
        socket.username = username;
        ++numUsers;
        addedUser = true;

        // Set the user as present.
        Presence.upsert(socket.id, {
            username: socket.username
        });
        socket.present = true;

        Presence.list(function(users) {
            socket.emit('login', {
                numUsers: users.length
            });

            // echo globally (all clients) that a person has connected
            io.emit('user joined', {
                username: socket.username,
               //avatar: socket.avatar,
                numUsers: users.length
            });
        });

        // socket.emit('login', {
        //     numUsers: numUsers
        // });
        // echo globally (all clients) that a person has connected
        // socket.broadcast.emit('user joined', {
        //     username: socket.username,
        //     numUsers: numUsers
        // });
    });

    // when the client emits 'typing', we broadcast it to others
    socket.on('typing', () => {
        logRequest(null, null, null);
        socket.broadcast.emit('typing', {
            username: socket.username
        });
    });

    // when the client emits 'stop typing', we broadcast it to others
    socket.on('stop typing', () => {
        logRequest(null, null, null);
        socket.broadcast.emit('stop typing', {
            username: socket.username
        });
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', () => {
        if (addedUser) {
            --numUsers;
            // echo globally that this client has left
            socket.broadcast.emit('user left', {
                username: socket.username,
                numUsers: numUsers
            });

        }
    });

});
