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
var games = {};

app.get('/', (req, res) => {
	res.render('mainmenu');
});
app.get('/howtoplay', (req, res) => {
	res.render('howtoplay');
});
app.get('/lobby', (req, res) => {
	res.render('lobby');
});
app.get('/game', (req, res) => {
	res.render('game');
});

io.on('connection', socket => {
	//lobby
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
		//TODO when leaving game
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
				delete rooms[room].colors[socket.id];
			}
		});
	});
	socket.on('start-game', settings => {
		games[settings.room] = { users : {}, cards : {}, colors : {}, points : {}, totalPlayers : settings.nbPlayers, playersConnected : 0, board : {}, round : {} };
		io.in(settings.room).emit('game-started');
	});

	//game
	socket.on('connect-game', player => {
		socket.join(player.room);
		games[player.room].users[socket.id] = player.name;
		games[player.room].cards[socket.id] = [];
		games[player.room].colors[socket.id] = player.color;
		games[player.room].points[socket.id] = 0;
		games[player.room].playersConnected++;
		socket.emit('return-id', socket.id);
		if(games[player.room].playersConnected >= games[player.room].totalPlayers){
			dealCards(games[player.room]);
			io.in(player.room).emit('player-setup', games[player.room]);
			io.in(player.room).emit('game-state', games[player.room].board);
		}
	});
	socket.on('select-card', player => {
		games[player.room].round[socket.io] = player.card;
		io.in(player.room).emit('card-played', socket.id);
		//TODO check if everyone has played
			//TODO play round
		//TODO check if game is over
			//TODO announce winner
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

function dealCards(room) {
	var cards = [];
	for(var i = 1; i <= 104; i++){
		cards.push(i);
	}
	for(var id in room.cards){
		for(var j = 0; j < 10; j++){
			var randCard = cards.splice(Math.floor(Math.random()*cards.length), 1);
			room.cards[id].push(randCard[0]);
		}
		room.cards[id].sort(function(a, b) {return a - b;});
	}
	for(var k = 0; k < 4; k++){
		room.board[k] = [];
		room.board[k].push(cards.splice(Math.floor(Math.random()*cards.length), 1)[0]);
	}
}

server.listen(port);
console.debug('Server listening on : http://127.0.0.1:'+ port);