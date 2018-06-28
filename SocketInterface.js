//imports
var config = require('./config');
var socket = require('socket.io');
var Presence;
var io;

//variables

function SocketInterface(server, redisInterface, restInterface) {
    Presence = require('./Presence')(redisInterface);
    this._init(server, restInterface);
}

module.exports = function (server, redisInterface, restInterface) {
    return new SocketInterface(server, redisInterface, restInterface);
};


/**
 * init Rest Controller
 *
 * @param
 **/
SocketInterface.prototype._init = function (server, restInterface) {
    var self = this;
    console.log(`init Socket.IO Interface`);


    io = socket.listen(server);


    io.on('connection', (socket) => {


        Presence.list(function (users) {
            // Tell the socket how many users are present.
            io.to(socket.id).emit('presence', {
                numUsers: users.length
            });
        });

        // when the client emits 'new message', this listens and executes
        socket.on('new message', (data) => {
            restInterface._logRequest(null, null, null);
            // we tell the client to execute 'new message'
            socket.broadcast.emit('new message', {
                username: socket.username,
                message: data
            });
        });

        // when the client emits 'add user', this listens and executes
        socket.on('add user', (username) => {
            restInterface._logRequest(null, null, null);

            // we store the username in the socket session for this client
            socket.username = username;

            // Set the user as present.
            Presence.upsert(socket.id, {
                username: socket.username
            });
            socket.present = true;

            Presence.list(function (users) {
                socket.emit('login', {
                    numUsers: users.length
                });

                // echo globally (all clients) that a person has connected
                io.emit('user joined', {
                    username: socket.username,
                    id: socket.id,
                    online: socket.present,
                    //avatar: socket.avatar,
                    numUsers: users.length
                });
            });

        });

        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', () => {
            restInterface._logRequest(null, null, null);
            socket.broadcast.emit('typing', {
                username: socket.username
            });
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', () => {
            restInterface._logRequest(null, null, null);
            socket.broadcast.emit('stop typing', {
                username: socket.username
            });
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', () => {

            // Set the user as present.
            socket.present = false;
            Presence.remove(socket.id);


            Presence.list(function (users) {
                // echo globally that this client has left
                socket.broadcast.emit('user left', {
                    username: socket.username,
                    id: socket.id,
                    online: socket.present,
                    numUsers: users.length
                });
            });


        });

    });//End of Socket On Connection


};