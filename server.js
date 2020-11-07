const port = 6969;
var express = require('express');
var path = require('path');
var http = require('http');
var io = require('socket.io')(3000);
var app = express();

var users = {};
var colors = {};
var icons = {};
var colorList = ['red', 'blue', 'yellow', 'green', 'olive', 'purple', 'fuchsia', 'maroon', 'aqua', 'lime'];
var iconList = ['💣', '🦴', '🐚', '🌵', '🍭', '🛒', '🧭', '⚓', '🚀', '🌙', '💊', '🔑', '🌊', '🎈', '🎲', '🍄', '💡', '⚜️', '💎', '📞'];

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
	socket.on('new-user', name => {
		if(Object.keys(users).length >= 10){
			socket.emit('full-lobby');
			return;
		}
		users[socket.id] = name;
		//TODO length too long
		let colorIndex = Math.floor(Math.random() * colorList.length);
		colorList.splice(colorIndex, 1);
		colors[socket.id] = colorList[colorIndex];
		let iconIndex = Math.floor(Math.random() * iconList.length);
		iconList.splice(iconIndex, 1);
		icons[socket.id] = iconList[iconIndex];

		socket.broadcast.emit('user-added', {id : socket.id, name : users[socket.id], color : colors[socket.id], icon : icons[socket.id]});
		socket.emit('user-list', {names : users, colors, colors, icons : icons});
	});
	socket.on('disconnect', () => {
		if(users[socket.id] != undefined){
			socket.broadcast.emit('user-dc', {id : socket.id, name : users[socket.id]});
			delete users[socket.id];
			colorList.push(colors[socket.id]);
			delete colors[socket.id];
			iconList.push(icons[socket.id]);
			delete icons[socket.id];
		}
	});
});

app.listen(port);
console.debug('Server listening on : http://127.0.0.1:'+ port);