/**
 * Created by sm on 05/06/16.
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var shortid = require('shortid');

server.listen(8000);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

var raspiSocket = false;
var cdSocket = false;
var uiSocket = false;

var allSockets = [];

var pipelineStatus = 'FREE';

var locks = {};
var unlocks = {};
var status = [];

var raspiAliveInterval = null;
var raspiAliveTimeout = null;
function isRaspiAlive() {
    raspiAliveTimeout = setTimeout(turnRaspiOff, 1000);
    raspiSocket && raspiSocket.emit('is-alive', {});
}

function turnRaspiOff() {
    raspiSocket = null;
    logout({ name: 'raspberry' });
}

function logout(data) {
    switch(data.name) {
        case 'raspberry':
            raspiSocket = null;
            clearInterval(raspiAliveInterval);
            raspiAliveInterval = null;
            break;
        case 'cd':
            cdSocket = null;
            break;
        default:
        // TODO Throw error - device unknown
    }

    uiSocket && uiSocket.emit('ui', { operation: 'logout', data: { device: data.name } });
    console.log('device', data.name, 'disconnected');
}

io.on('connection', function (socket) {
    if(allSockets.indexOf(socket) === -1) {
        allSockets.push(socket);
    }

    socket.on('ack-alive', function(data) {
        if(data.name === 'raspberry') {
            if(raspiAliveTimeout !== null) {
                clearTimeout(raspiAliveTimeout);
                raspiAliveTimeout = null;
            }
        }
    });

    socket.on('login', function(data) {
        switch(data.name) {
            case 'raspberry':
                raspiSocket = socket;

                raspiAliveInterval = setInterval(isRaspiAlive, 1000);

                break;
            case 'cd':
                cdSocket = socket;

                cdSocket.emit('welcome', {
                    currentStatus: pipelineStatus,
                    locks: locks,
                    unlocks: unlocks,
                    statusStack: status
                });

                break;
            case 'ui':
                uiSocket = socket;
                break;
            default:
                // TODO Throw error - device unknown
        }

        uiSocket && uiSocket.emit('ui', { operation: 'login', data: { device: data.name } });
        console.log('device', data.name, 'connected');
    });

    socket.on('logout', function(data) {
        logout(data);
    });

    socket.on('lock', function(data) {
        // TODO Exception management

        console.log('Pipeline', data.pipeline, 'requested locking on step', data.step);

        var uuid = shortid.generate();

        var response = locks[uuid] = {
            uuid: uuid,
            data: data,
            locked_at: new Date().getTime()
        };

        pipelineStatus = 'LOCKED';
        uiSocket && uiSocket.emit('ui', { operation: 'lock', data: response });

        raspiSocket && raspiSocket.emit('lock', response);
    });

    socket.on('unlock', function(data) {
        // TODO Exception management

        console.log('Lock', data.uuid, 'requested for releasing');

        // TODO Verify that lock exists

        var response = unlocks[data.uuid] = {
            uuid: data.uuid,
            unlocked_at: new Date().getTime()
        };

        pipelineStatus = 'FREE';
        uiSocket && uiSocket.emit('ui', { operation: 'unlock', data: response });
    });

    socket.on('status', function(data) {
        pipelineStatus = data.status !== 'default' ? data.status.toUpperCase() : 'FREE';

        var message = {
            status: pipelineStatus,
            changed_at: new Date().getTime()
        };

        uiSocket && uiSocket.emit('ui', {
            operation: 'status',
            data: message
        });

        status.push(message);
    });

});

function emitToAll(channel, message) {
    for(var i = 0; i < allSockets.length; i++) {
        var socket = allSockets[i];
        socket.emit(channel, message);
    }
}