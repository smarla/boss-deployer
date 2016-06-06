/**
 * Created by sm on 05/06/16.
 */

var app = require('express')();
var server = require('http').Server(app);
var io = require('socket.io')(server);

server.listen(8000);

app.get('/', function (req, res) {
    res.sendfile(__dirname + '/index.html');
});

var raspyConnected = false;
var cdConnected = false;

allSockets = [];

io.on('connection', function (socket) {
    if(allSockets.indexOf(socket) === -1) {
        allSockets.push(socket);
    }
    // Emit welcome

    socket.on('login', function(data) {
        switch(data.name) {
            case 'raspberry':
                raspyConnected = true;
                break;
            case 'cd':
                cdConnected = true;
                break;
            default:
                // TODO Throw error - device unknown
        }

        emitToAll('ui', { operation: 'login', data: { device: data.name } });
        console.log('device', data.name, 'connected');
    });

});

function emitToAll(channel, message) {
    for(var i = 0; i < allSockets.length; i++) {
        var socket = allSockets[i];
        socket.emit(channel, message);
    }
}