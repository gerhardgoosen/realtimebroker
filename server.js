// Setup basic express server
var express = require('express');
var app = express();
var path = require('path');
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var port = process.env.PORT || 3000;

var io = require('socket.io').listen(server);


server.listen(port, () => {
    console.log('Server listening at port %d', port);
});


var requests = [];
var requestsTrimThreshold = 5000;
var requestsTrimSize = 4000;

app.use(function (req,res,next){
    logRequest(req,res,next);
});

function logRequest(req,res,next){
    requests.push(Date.now());
    if(requests.length > requestsTrimThreshold ){
        requests = requests.slice(0,requests.length-requestsTrimSize);
    }
    if(next){
        next();
    }

}

app.get("/requests/:seconds", function (req, res) {

    if(req.params.seconds){
        var now = Date.now();
        var aMinAgo = now - (req.params.seconds*1000);
        var cnt = 0;

        for(var i = requests.length-1; 1>=0 ; i--){
            if(requests[i]>=aMinAgo){
                ++cnt;
            }else {
                break;
            }
        }
        res.json({request:cnt,timeframe:req.params.seconds});
    }else{
        res.html("privide seconds parameter /requests/60 - for the last minute!");
    }

})


// Routing
app.use(express.static(path.join(__dirname, 'public')));


// usernames which are currently connected to the chat
var usernames = {};

// rooms which are currently available in chat
var rooms = ['lobby'];

io.sockets.on('connection', function (socket) {

    logRequest(null,null,null);

    // when the client emits 'adduser', this listens and executes
    socket.on('adduser', function(username){
        logRequest(null,null,null);
        // store the username in the socket session for this client
        socket.username = username;
        // store the room name in the socket session for this client
        socket.room = 'lobby';
        // add the client's username to the global list
        usernames[username] = username;
        // send client to room 1
        socket.join('lobby');
        // echo to client they've connected
        socket.emit('updatechat', 'SERVER', 'you have connected to ' + socket.room);
        // echo to room that a person has connected to their room
        socket.broadcast
            .to(socket.room)
            .emit('updatechat', 'SERVER', username + ' has connected to this room');
        socket.emit('updaterooms', rooms, socket.room);
        io.sockets.emit('updateusers', usernames);
    });

    // when the client emits 'sendchat', this listens and executes
    socket.on('sendchat', function (data) {
        logRequest(null,null,null);
        // we tell the client to execute 'updatechat' with 2 parameters
        io.sockets.in(socket.room).emit('updatechat', socket.username, data);
    });

    socket.on('switchRoom', function(newroom){
        logRequest(null,null,null);
        // leave the current room (stored in session)
        socket.leave(socket.room);
        // join new room, received as function parameter
        socket.join(newroom);
        socket.emit('updatechat', 'SERVER', 'you have connected to '+ newroom);
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
        // update socket session room title
        socket.room = newroom;
        socket.broadcast.to(newroom).emit('updatechat', 'SERVER', socket.username+' has joined this room');
        socket.emit('updaterooms', rooms, newroom);
    });

    // when the user disconnects.. perform this
    socket.on('disconnect', function(){
        logRequest(null,null,null);
        // remove the username from global usernames list
        delete usernames[socket.username];
        // update list of users in chat, client-side
        io.sockets.emit('updateusers', usernames);
        // echo globally that this client has left
        socket.broadcast.emit('updatechat', 'SERVER', socket.username + ' has disconnected');
        socket.leave(socket.room);
    });

    // when the user disconnects.. perform this
    socket.on('addroom', function(room){
        logRequest(null,null,null);sadsa
        // add room to rooms array
         rooms.push(room);

         socket.emit('updaterooms', rooms, socket.room);
         socket.broadcast.emit('updaterooms', rooms, socket.room);

        socket.leave(socket.room);
        // join new room, received as function parameter
        socket.join(room);
        socket.emit('updatechat', 'SERVER', 'you have connected to '+ room);
        // sent message to OLD room
        socket.broadcast.to(socket.room).emit('updatechat', 'SERVER', socket.username+' has left this room');
        // update socket session room title
        socket.room = room;
        socket.broadcast.to(room).emit('updatechat', 'SERVER', socket.username+' has joined this room');

        socket.emit('updaterooms', rooms, room);

    });


});