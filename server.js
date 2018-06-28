//imports
let express = require('express');
let path = require('path');
let http = require('http');
let config = require('./config');

//init
let app = express();
let server = http.createServer(app);
let port = process.env.PORT || 1337;

//setup server
require('./SocketInterface')(server,
    require('./RedisInterface'),
    require('./RestInterface')(app, config));

// Routing
app.use(express.static(path.join(__dirname, 'public')));

server.listen(port, () => {
    console.log('Server listening at port %d', port);
});