const port = 6969;
var express = require('express');
var path = require('path');
var http = require('http');
var io = require('socket.io')(3000);
var app = express();

var users = {};
var colors = {};
var owner = null;
var colorList = ['red', 'blue', 'yellow', 'green', 'olive', 'purple', 'fuchsia', 'maroon', 'aqua', 'lime'];

var server = http.createServer(app);
var socket = io.listen(server);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.sendFile(path.join(__dirname + '/mainmenu.html'));
});
app.get('/howtoplay', function(req, res){
	res.sendFile(path.join(__dirname + '/howtoplay.html'));
});
app.get('/lobby', function(req, res){
	res.sendFile(path.join(__dirname + '/lobby.html'));
});

io.on('connection', socket => {
	socket.on('new-user', player => {
		if(Object.keys(users).length >= 10){
			socket.emit('full-lobby');
			return;
		}
		users[socket.id] = player.name;
		if(player.owner == 1){
			owner = socket.id;
		}
		//TODO length too long
		let colorIndex = Math.floor(Math.random() * colorList.length);
		colorList.splice(colorIndex, 1);
		colors[socket.id] = colorList[colorIndex];

		socket.broadcast.emit('user-added', {id : socket.id, name : users[socket.id], color : colors[socket.id], owner : player.owner});
		socket.emit('user-list', {names : users, colors, colors, owner : owner});
	});
	socket.on('disconnect', () => {
		if(users[socket.id] != undefined){
			//TODO change lobby owner
			socket.broadcast.emit('user-dc', {id : socket.id, name : users[socket.id]});
			delete users[socket.id];
			colorList.push(colors[socket.id]);
			delete colors[socket.id];
		}
	});
});

app.listen(port);
console.debug('Server listening on : http://127.0.0.1:'+ port);