var express = require('express');
var http = require('http');
var app = express();
var fs = require("fs");
var socket = require("socket.io-client")('http://smarla.com:8000');

var locked = false;
var released = false;
var blocked = false;

var gadget = null;
var lastLock = null;

app.get('/ping', function (req, res) {
    console.log("Someone is pinging us");

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'ping', status: 'ok' }));
});

app.get('/lock', function (req, res) {
    http.request({
        host: '192.168.1.254',
        path: '/lock',
        method: 'GET',
        port: '80'
    }).end();

    locked = true;

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'lock', status: 'ok' }));
});

app.get('/unlock', function (req, res) {
    locked = false;

    var lock = lastLock;
    lastLock = null;
    socket.emit('unlock', { uuid: lock.uuid });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'unlock', status: 'ok' }));
});

app.get('/release', function (req, res) {
    released = true;

    socket.emit('status', { status: 'released' });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'release', status: 'ok' }));
});

app.get('/block', function (req, res) {
    blocked = true;

    socket.emit('status', { status: 'blocked' });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'block', status: 'ok' }));
});

app.get('/default', function (req, res) {
    released = false;
    blocked = false;

    socket.emit('status', { status: 'default' });

    res.setHeader('Content-Type', 'application/json');
    res.send(JSON.stringify({ operation: 'default', status: 'ok' }));
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

socket.on('connect', function () {
    console.log('Connecting to socket');
    socket.emit('login', { name: 'raspberry' });
});

socket.on('lock', function(data) {
    lastLock = data;
    console.log('Locking system', data);
});


process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    socket.emit('logout', { name: 'raspberry' });
    socket.disconnect();
    console.log('exiting');

    if (options.cleanup) console.log('clean');
    if (err) console.log(err.stack);
    if (options.exit) process.exit();
}

//do something when app is closing
process.on('exit', exitHandler.bind(null,{cleanup:true}));

//catches ctrl+c event
process.on('SIGINT', exitHandler.bind(null, {exit:true}));

//catches uncaught exceptions
process.on('uncaughtException', exitHandler.bind(null, {exit:true}));