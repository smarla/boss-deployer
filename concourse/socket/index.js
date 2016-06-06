var socket = require("socket.io-client")('http://smarla.com:8000');

socket.on('connect', function () {
    console.log('Connecting to socket');
    socket.emit('login', { name: 'cd' });
});

socket.on('welcome', function(data) {
    process.stdout.write(JSON.stringify(data));
});

process.stdin.resume();//so the program will not close instantly

function exitHandler(options, err) {
    socket.emit('logout', { name: 'cd' });
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