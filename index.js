var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
require('./gameserver');

app.use(bodyParser.json());

//CSS
app.get('/common.css', (req, res) => {
    res.sendFile(path.join(__dirname+'/common.css'));
});
//Favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname+'/favicon.ico'));
});
////

app.get('/multisweeper.js', (req, res) => {
    res.sendFile(path.join(__dirname+'/multisweeper.js'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/index.html'));
});

app.listen(process.env.PORT || 80);

