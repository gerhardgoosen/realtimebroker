//imports
var config = require('./Config');
var socket = require('socket.io');
var Presence;
var io;
var _self;


function SocketInterface(server, redisInterface, restInterface) {
    Presence = require('./Presence')(this, redisInterface);
    _self=this;
    this.init(server, restInterface);
}

module.exports = function (server, redisInterface, restInterface) {
    return new SocketInterface(server, redisInterface, restInterface);
};


/**
 * init SocketIO Controller
 *
 * @param
 **/
SocketInterface.prototype.init = function (server, restInterface) {
    var self = this;
    console.log(`init Socket.IO Interface`);

    io = socket.listen(server);

    io.on('connection', (socket) => {
        console.log('client connected on socket :' + socket.id);

        // when the user disconnects.. perform this
        socket.on('authenticate', (data) => {
            restInterface._logRequest(null, null, null);//metrics
            this.onAuthenticate(socket,data);
        });

        // when the user disconnects.. perform this
        socket.on('disconnect', () => {
            restInterface._logRequest(null, null, null);//metrics
            this.onDisconnect(socket);
        });

        // when the client emits 'new message', this listens and executes
        socket.on('message', (data) => {
            console.log(socket.authenticated);
            restInterface._logRequest(null, null, null);//metrics
            this.onMessage(socket,data);
        });

        // when the client emits 'typing', we broadcast it to others
        socket.on('typing', () => {
            restInterface._logRequest(null, null, null);//metrics
            this.onTyping(socket);
        });

        // when the client emits 'stop typing', we broadcast it to others
        socket.on('stop typing', () => {
            restInterface._logRequest(null, null, null);//metrics
            this.onStopTyping(socket);
        });


    });//End of Socket On Connection


};


//============ LISTEN =================//
SocketInterface.prototype.onAuthenticate = function (socket, data) {
    console.log('SocketInterface.onAuthenticate');
    console.log('client onAuthenticate[' + data.appname + ',' + data.username + '] on socket :' + socket.id);

    //TODO auth against db

    // we store the username in the socket session for this client
    socket.username = data.username;
    socket.appname = data.appname;
    socket.authenticated = true;

    socket.join(socket.appname);

    Presence.upsert(socket.username, {
        appname: socket.appname,
        username: socket.username,
        socketId: socket.id,
        authenticated : socket.authenticated
    });
    socket.present = true;

    //Fetch all users from redis. to tell the world how many users are online
    Presence.list(function(users){
        _self.emitAuthenticated(socket,users);
    });

};

SocketInterface.prototype.onMessage = function (socket, data) {
    console.log('SocketInterface.onMessage');
    console.log('client message from socket :' + socket.id);

    // // we tell the client to execute 'new message'
    _self.emitMessage(socket,data);
};

SocketInterface.prototype.onTyping = function (socket) {
    console.log('SocketInterface.onTyping');
    _self.emitTyping(socket);
};

SocketInterface.prototype.onStopTyping = function (socket) {
    console.log('SocketInterface.onStopTyping');
   _self.emitStopTyping(socket);
};

SocketInterface.prototype.onDisconnect = function (socket) {
    console.log('SocketInterface.onDisconnect');
    console.log('client disconnect from socket :' + socket.id);

    // // Set the user as offline.
     socket.present = false;
     Presence.remove(socket.id);

    Presence.list(function (users){
        _self.emitUserDisconnected(socket,users);
    });
};

SocketInterface.prototype.updatePresence = function () {
    Presence.list(function (users) {
       _self.emitPresence(users)
    });
};

//============ EMIT =================//
SocketInterface.prototype.emitAuthenticated = function(socket,users){
    //tell the socket its authenticated
    socket.emit('authenticated', {
        users: users,
        socketId: socket.id,
        username: socket.username,
        authenticated: socket.authenticated
    });

    //tell the everyone but this socket a user joined
    socket.to(socket.appname).emit('user joined', {
        username: socket.username,
        socketId: socket.id,
        online: socket.present,
        users: users
    });

    socket.to("master").emit('user joined', {
        username: socket.username,
        socketId: socket.id,
        online: socket.present,
        users: users
    });
    //_self.updatePresence();
}

SocketInterface.prototype.emitUserDisconnected = function(socket,users){
    // echo to app that this client has left
    socket.to(socket.appname).emit('user left', {
        username: socket.username,
        socketId: socket.id,
        users: users
    });

    // echo to mster app that this client has left
    socket.to("master").emit('user left', {
        username: socket.username,
        socketId: socket.id,
        users: users
    });
}

SocketInterface.prototype.emitMessage = function(socket,data){
    // broadcast to room
    socket.to(data.appname).emit('message', {username: socket.username, message: data.message});

    // to mastet aswell
   // socket.to("master").emit('message', {username: socket.username, message: data.message});

}

SocketInterface.prototype.emitPresence = function(socket,users){
    // broadcast to room
    io.to(socket.appname).emit('presence', { users: users });

    // to mastet aswell
    //io.to("master").emit('presence', { users: users });
}

SocketInterface.prototype.emitTyping = function(socket){

    socket.to(socket.appname).emit('typing', {
        username: socket.username
    });

    //socket.to("master").emit('typing', { username: socket.username });
}

SocketInterface.prototype.emitStopTyping = function(socket){
    socket.to(socket.appname).emit('stop typing', {
        username: socket.username
    });

   //socket.to("master").emit('stop typing', { username: socket.username });
}