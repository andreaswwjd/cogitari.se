

var express = require('express');
var app = express();
var server = require('http').createServer(app);
var session = require('express-session');
var fs = require('fs');
var bodyParser = require('body-parser');
var path = require('path');



app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'bower_components')));
app.use(express.static(path.join(__dirname, 'static')));
app.use(session({
	secret: 'C0G1745I',
	saveUninitialized: true,
	resave: true,
	cookie: { maxAge: 86400000 }
}));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

var port = process.env.PORT || 3000;


var games = [];
//node.js server http requests
app.get('/', function(req, res) {
	res.render('index');
});

//Listen!
server.listen(port, function(){
	console.log('Listening on port: ' + port);
});
