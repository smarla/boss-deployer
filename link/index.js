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

var raspySocket = false;
var cdSocket = false;
var uiSocket = false;

var allSockets = [];

var pipelineStatus = 'FREE';
var locks = {};
var unlocks = {};
var status = [];


io.on('connection', function (socket) {
    if(allSockets.indexOf(socket) === -1) {
        allSockets.push(socket);
    }
    // Emit welcome

    socket.on('login', function(data) {
        switch(data.name) {
            case 'raspberry':
                raspySocket = socket;
                break;
            case 'cd':
                cdSocket = socket;
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
        pipelineStatus = data.status.toUpperCase();

        uiSocket && uiSocket.emit('ui', {
            operation: 'status',
            data: {
                status: pipelineStatus,
                changed_at: new Date().getTime()
            }
        });
    });

});

function emitToAll(channel, message) {
    for(var i = 0; i < allSockets.length; i++) {
        var socket = allSockets[i];
        socket.emit(channel, message);
    }
}