const port = 6969;
var express = require('express');
// var path = require('path');
var io = require('socket.io')(3000);
var app = express();
const server = require('http').createServer(app);

// var socket = io.listen(server);

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));

var rooms = {};
var owners = {};
var colorList = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'aqua', 'lime'];

app.get('/', (req, res) => {
	res.render('mainmenu');
});
app.get('/howtoplay', (req, res) => {
	res.render('howtoplay');
});
app.get('/lobby', (req, res) => {
	res.render('lobby');
});

io.on('connection', socket => {
	socket.on('new-user', player => {
		if(rooms[player.room] == null){
			if(player.owner != 1){
				socket.emit('unknown-room');
				return;
			}
			rooms[player.room] = { users : {}, colors : {} };
			let roomList = Object.keys(rooms);
			socket.broadcast.emit('update-room-list', roomList);
		}
		if(Object.keys(rooms[player.room]).length >= 10){
			socket.emit('full-lobby');
			return;
		}
		socket.join(player.room);
		rooms[player.room].users[socket.id] = player.name;

		let color;
		let colors = [];
		for(var key in rooms[player.room].colors){
			colors.push(rooms[player.room].colors[key]);
		}
		do{
			color = colorList[Math.floor(Math.random() * colorList.length)];
		}while(!color in colors);
		rooms[player.room].colors[socket.id] = color;

		if(player.owner == 1){
			owners[player.room] = socket.id;
		}

		socket.to(player.room).broadcast.emit('user-added', {room : player.room, id : socket.id, name : player.name, color : color, owner : player.owner});
		socket.emit('user-list', {room : player.room, names : rooms[player.room].users, colors : rooms[player.room].colors, owner : owners[player.room], you : socket.id});
	});
	socket.on('disconnect', () => {
		getUserRooms(socket).forEach(room => {
			if(Object.keys(rooms[room].users).length <= 1){
				delete owners[room];
				delete rooms[room];
				let roomList = Object.keys(rooms);
				socket.broadcast.emit('update-room-list', roomList);
			}else{
				while(owners[room] == socket.id){
					let keys = Object.keys(rooms[room].users);
					owners[room] = keys[keys.length * Math.random() << 0];
				}
				io.sockets.to(owners[room]).emit('ownership');
				socket.to(room).broadcast.emit('user-dc', {id : socket.id, name : rooms[room].users[socket.id], owner : owners[room]});
				delete rooms[room].users[socket.id];
			}
		});
		// colorList.push(colors[socket.id]);
		// delete colors[socket.id];
	});
});

function getUserRooms(socket) {
	return Object.entries(rooms).reduce((names, [name, room]) => {
		if (room.users[socket.id] != null){
			names.push(name);
		}
		return names;
	}, [])
}

server.listen(port);
console.debug('Server listening on : http://127.0.0.1:'+ port);