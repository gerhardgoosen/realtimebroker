// Setup basic express server
//Setting up Redis Cache
//var redis = require('redis');
var redis = require('socket.io-redis');
//var redisPubSub = redis.createClient();


var express = require('express');
var path = require('path');
var http = require('http');
var socket = require('socket.io');

var app = express();
var server = http.createServer(app);
var io = socket.listen(server);
var port = process.env.PORT || 1337;

var requests = [];
var requestsTrimThreshold = 5000;
var requestsTrimSize = 4000;

// redisPubSub.on("subscribe", function (channel) {
//     console.log("Subscribed to " + channel);
// });
//
// redisPubSub.on("message", function (channel, message) {
//     console.log("Message from channel " + channel + " : " + message);
// });
//
//
// function subscribeToChannel(channel) {
//     redisPubSub.subscribe(channel);
// }
//
//
// function publishToChannel(channel,message) {
//     redisPubSub.publish(channel,message);
// }

//io.adapter(redis({ host: 'localhost', port: 6379 }));

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
    socket.emit('login', {
      numUsers: numUsers
    });
    // echo globally (all clients) that a person has connected
    socket.broadcast.emit('user joined', {
      username: socket.username,
      numUsers: numUsers
    });
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
