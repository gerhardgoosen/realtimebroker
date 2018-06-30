//imports
let express = require('express');
let path = require('path');
let http = require('http');
let config = require('./lib/Config');

//init
let app = express();
let server = http.createServer(app);
let port = process.env.PORT || 1337;

//setup server
let redisInterface = require('./lib/RedisInterface');
let restInterface = require('./lib/RestInterface')(app, config);
let socketInterface = require('./lib/SocketInterface')(server,redisInterface,restInterface);

// Routing
app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});