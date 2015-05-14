var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);



app.get('/a12aleny/client-server/', function(req, res) {
    res.sendFile(__dirname + '/index.html');
});


io.on('connection', function(socket) {
    
    console.log(socket.id + ' anslöt!')
    socket.emit('connected', "Ge klienter ett ID");     
    
    socket.on('updatePlayerPos', function(msg) {
        io.emit('serverUpdatePlayerPos', msg);
      
    });

    socket.on('doABarrelRoll', function(msg){
        io.emit('startshit', 'FIRE');
    });
    socket.on('pong', function(msg){
        socket.broadcast.to(msg.id).emit('pong', msg);
    });
    socket.on('stop', function (msg) {
        socket.emit('stopdraw', msg);
    });


    socket.on('disconnect', function() {
        console.log('user disconnected...');
        io.emit('disconnected', 'User has disconnected');
    });
});





http.listen(8080, function() {
    console.log('listening on *:8080');
});


