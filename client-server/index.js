var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);



app.get('/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


var users = [];



io.on('connection', function(socket) {
    console.log('an awesome user connected with id: '+socket.id);
    io.emit('connected', 'User has connected');

    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        console.log('user with id: '+socket.id+' wrote: '+msg);
    });


    socket.on('disconnect', function() {
        console.log('user disconnected...');
        io.emit('disconnected', 'User has disconnected');
    });
});





http.listen(3000, function() {
    console.log('listening on *:3000');
});
