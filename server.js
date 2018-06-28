//imports
let config = require('./config');

let express = require('express');
let path = require('path');
let http = require('http');


//init
let app = express();
let server = http.createServer(app);
let port = process.env.PORT || 1337;

//variables
let redisInterface = require('./RedisInterface');
let restInterface = require('./RestInterface')(app,config);
let socketInterface = require('./SocketInterface')(server,redisInterface,restInterface);

// Routing
app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});