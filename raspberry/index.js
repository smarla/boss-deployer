var express = require('express');
var http = require('http');
var app = express();
var fs = require("fs");

var locked = false;
var bypass = false;
var disabled = false;

app.get('/lock', function (req, res) {
    http.request({
        host: '192.168.0.254',
        path: '/lock',
        method: 'GET',
        port: '80'
    }).end();

    locked = true;

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'lock', status: 'ok' }));
});

app.get('/free', function (req, res) {
    locked = false;
});

app.get('/bypass', function (req, res) {
    bypass = true;
    disabled = false;
});

app.get('/disable', function (req, res) {
    bypass = false;
    disabled = true;
});

/*
 * Continuous delivery things
 */
app.get('/cd-check', function (req, res) {
    // Check versions
});

app.get('/cd-in', function (req, res) {
    // Check versions
});

app.get('/cd-out', function (req, res) {
    // Check versions
});

var server = app.listen(5000, function () {
    var host = server.address().address;
    var port = server.address().port;

    console.log("Boss deployer server running at http://%s:%s", host, port);
});