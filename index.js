var express = require('express');
var app = express();
var bodyParser = require('body-parser');
var path = require('path');
require('./gameserver');

app.use(bodyParser.json());

//CSS
app.get('/common.css', (req, res) => {
    res.sendFile(path.join(__dirname+'/frontend/common.css'));
});
//Favicon
app.get('/favicon.ico', (req, res) => {
    res.sendFile(path.join(__dirname+'/frontend/favicon.ico'));
});
////

app.get('/multisweeper.js', (req, res) => {
    res.sendFile(path.join(__dirname+'/frontend/multisweeper.js'));
});

app.get('/joscompress.js', (req, res) => {
    res.sendFile(path.join(__dirname+'/frontend/joscompress.js'));
});

app.get('/help', (req, res) => {
    res.sendFile(path.join(__dirname+'/frontend/help.html'));
});

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname+'/frontend/index.html'));
});

app.listen(process.env.PORT || 80);