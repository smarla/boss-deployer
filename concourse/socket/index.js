var socket = require("socket.io-client")('http://smarla.com:8000');

socket.on('connect', function () {
    console.log('Connecting to socket');
    socket.emit('login', { name: 'cd' });
});

socket.on('welcome', function(data) {
    console.log(JSON.stringify(data));
});
