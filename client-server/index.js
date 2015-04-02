var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);



app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});



    var connectedUsers = 0;
    var userStart = 2;



io.on('connection', function(socket) {

    io.emit('connected', 'User has connected');
    connectedUsers++;
    console.log(connectedUsers);
    if (connectedUsers === userStart) {
         io.emit('startshit', 'FIRE');
    };
    socket.on('updatePlayerPos', function(msg) {
        io.emit('serverUpdatePlayerPos', msg);
        console.log(msg);
    });

   


    socket.on('disconnect', function() {
        console.log('user disconnected...');
        io.emit('disconnected', 'User has disconnected');
        connectedUsers--;
    });
});





http.listen(3000, function() {
    console.log('listening on *:3000');
});


