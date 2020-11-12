const port = 6969;
var express = require('express');
var path = require('path');
var http = require('http');
var io = require('socket.io')(3000);
var app = express();

var users = {};
var colors = {};
var owner = null;
var colorList = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'aqua', 'lime'];

var server = http.createServer(app);
var socket = io.listen(server);

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
	res.render('mainmenu');
});
app.get('/howtoplay', function(req, res){
	res.render('howtoplay');
});
app.get('/lobby', function(req, res){
	res.render('lobby')
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
			while(owner == socket.id){
				if(Object.keys(users).length <= 1){
					owner = null;
					//TODO delete room
					break;
				}
				let keys = Object.keys(users);
				owner = keys[keys.length * Math.random() << 0];
			}
			io.sockets.to(owner).emit('ownership');
			socket.broadcast.emit('user-dc', {id : socket.id, name : users[socket.id], owner : owner});
			delete users[socket.id];
			colorList.push(colors[socket.id]);
			delete colors[socket.id];
		}
	});
});

app.listen(port);
console.debug('Server listening on : http://127.0.0.1:'+ port);