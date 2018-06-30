//imports
var config = require('./Config');
//variables
var requests = [];
var requestsTrimThreshold = 5000;
var requestsTrimSize = 4000;

function RestInterface(app,config) {
    this.config = config;
    this._init(app);
}

module.exports = function (app,config) {
    return new RestInterface(app,config);
};


/**
 * init Rest Controller
 *
 * @param
 **/
RestInterface.prototype._init = function (app) {
    var self = this;
    console.log(`init REST Interface`);

    app.use(function (req, res, next) {
        self._logRequest(req, res, next);
    });

    /**
     * Return number of request in the timeframe provided in seconds.
     **/
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
    });

};

/**
 * Cleans a list of connections by removing expired ones
 *
 * @param
 **/
RestInterface.prototype._logRequest = function (req, res, next) {
    requests.push(Date.now());
    console.log('Logged Request [' + requests.length+']');
    if (requests.length > requestsTrimThreshold) {
        requests = requests.slice(0, requests.length - requestsTrimSize);
    }
    if (next) {
        next();
    }
};
