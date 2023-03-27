var express = require('express');
var bodyParser = require("body-parser");
var fs = require('fs');
var url = require('url');
var app = express();

app.use('/public', express.static(__dirname + '/public'));  
app.use(express.static(__dirname + '/public')); 

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({
    extended: false,
    limit: '50mb'
}))



// Add headers before the routes are defined
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:9000');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

app.post('/save', function(request, respond) {
    // console.log(request.body.image);

    const data = request.body.image.replace(/^data:image\/\w+;base64,/, "");
  
    const buf = Buffer.from(data, "base64");

    filePath = 'output/'+request.body.count+'.png';
    fs.writeFile(filePath, buf, function () {
        console.log(`file ${filePath} written`);
        respond.end();
    });
    respond.end();
});

app.listen(8080);