//Future improvments:
//- Better room code input
//- Better alert box
//- Add play again button
//- Day/night mode
//- i18n
//- reconnection when re-entering game
//- Make sure the board doesn't move around
//- More responsive interface

const address = "0.0.0.0";
var express = require('express');
var io = require('socket.io')(3000);
var app = express();
const server = require('http').createServer(app);

app.set('views', './views');
app.set('view engine', 'ejs');
app.use(express.static(__dirname + '/public'));
app.use(express.urlencoded({ extended: true }));
app.use('/favicon.ico', express.static('images/favicon.ico'));

var rooms = {};
var owners = {};
var colorList = ['red', 'blue', 'yellow', 'green', 'orange', 'purple', 'pink', 'brown', 'aqua', 'lime'];
var games = {};
var pointCards = calculatePoints();

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
app.get('*', (req, res) => {
	res.render('404');
});

io.on('connection', socket => {
	socket.on('new-user', player => {
		if(rooms[player.room] == null) {
			if(player.owner != 1){
				socket.emit('unknown-room');
				return;
			}
			rooms[player.room] = { users : {}, colors : {} };
			let roomList = Object.keys(rooms);
			socket.broadcast.emit('update-room-list', roomList);
		}
		if(Object.keys(rooms[player.room].users).length >= 10) {
			socket.emit('full-lobby');
			return;
		}
		socket.join(player.room);
		rooms[player.room].users[socket.id] = player.name;

		let color;
		let colors = [];
		for(var key in rooms[player.room].colors) {
			colors.push(rooms[player.room].colors[key]);
		}
		do {
			color = colorList[Math.floor(Math.random() * colorList.length)];
		} while(colors.includes(color));
		rooms[player.room].colors[socket.id] = color;

		if(player.owner == 1) {
			owners[player.room] = socket.id;
		}

		socket.to(player.room).broadcast.emit('user-added', {room : player.room, id : socket.id, name : player.name, color : color, owner : player.owner});
		socket.emit('user-list', {room : player.room, names : rooms[player.room].users, colors : rooms[player.room].colors, owner : owners[player.room], you : socket.id});
	});

	socket.on('disconnect', () => {
		getUserRooms(socket).forEach(room => {
			if(Object.keys(rooms[room].users).length <= 1) {
				delete owners[room];
				delete rooms[room];
				let roomList = Object.keys(rooms);
				socket.broadcast.emit('update-room-list', roomList);
			} else {
				while(owners[room] == socket.id){
					let keys = Object.keys(rooms[room].users);
					owners[room] = keys[keys.length * Math.random() << 0];
				}
				io.sockets.to(owners[room]).emit('ownership');
				socket.to(room).broadcast.emit('user-dc', { id : socket.id, name : rooms[room].users[socket.id], color : rooms[room].colors[socket.id], owner : owners[room], ownerName : rooms[room].users[owners[room]], ownerColor : rooms[room].colors[owners[room]] });
				delete rooms[room].users[socket.id];
				delete rooms[room].colors[socket.id];
			}
		});
		getUserGames(socket).forEach(game => {
			if(Object.keys(games[game].users).length <= 1) {
				delete games[game];
			} else {
				io.in(game).emit('user-dc', { id : socket.id, name : games[game].users[socket.id], color : games[game].colors[socket.id] });
				delete games[game].users[socket.id];
				delete games[game].colors[socket.id];
				delete games[game].cards[socket.id];
				delete games[game].points[socket.id];
				delete games[game].round[socket.id];
				games[game].playersConnected--;
				if(games[game].playersConnected <= 1){
					var scores = Object.keys(games[game].points).map(function(key) {
						return [key, games[game].points[key]];
					});
					scores.sort(function(first, second) {
						return first[1]-second[1];
					});
					io.in(game).emit('game-over', scores);
				}
			}
		});
	});

	socket.on('start-game', settings => {
		games[settings.room] = { users : {}, cards : {}, colors : {}, points : {}, totalPlayers : settings.nbPlayers, playersConnected : 0, board : {}, round : {}, gameStarted: false };
		io.in(settings.room).emit('game-started');
	});

	socket.on('connect-game', player => {
		if(games[player.room] == null) {
			socket.emit('reject-user', "This room doesn't exist.");
			return;
		}
		if(games[player.room].gameStarted){
			socket.emit('reject-user', "The game has already started.");
			return;
		}
		socket.join(player.room);
		games[player.room].users[socket.id] = player.name;
		games[player.room].cards[socket.id] = [];
		games[player.room].colors[socket.id] = player.color;
		games[player.room].points[socket.id] = 0;
		games[player.room].round[socket.id] = null;
		games[player.room].playersConnected++;
		socket.emit('return-id', {IDPlayer : socket.id, pointValues : pointCards});
		if(games[player.room].playersConnected >= games[player.room].totalPlayers && !games[player.room].gameStarted) {
			games[player.room].gameStarted = true;
			dealCards(games[player.room]);
			io.in(player.room).emit('player-setup', games[player.room]);
			io.in(player.room).emit('game-state', games[player.room].board);
		}
	});

	socket.on('select-card', player => {
		if(!games[player.room].cards[socket.id].includes(player.card)){
			socket.emit('personnal-info', "You don't have this card. Please don't cheat.");
			return;
		}
		games[player.room].round[socket.id] = player.card;
		io.in(player.room).emit('card-played', socket.id);

		var everyonePlayed = true;
		Object.keys(games[player.room].round).forEach(function(key) {
			if(games[player.room].round[key] == null){
				everyonePlayed = false;
				return;
			}
		});
		if(everyonePlayed){
			Object.keys(games[player.room].round).forEach(function(key) {
				var index = games[player.room].cards[key].indexOf(games[player.room].round[key]);
				games[player.room].cards[key].splice(index, 1);
				io.to(key).emit('update-hand', games[player.room].cards[key]);
			});
			io.in(player.room).emit('reveal-cards', games[player.room].round);

			setTimeout(function(){ playRound(player.room); }, 1000);
		}
	});

	socket.on('choose-row', choice => {
		for(i=0; i<6; i++){
			if(games[choice.room].board[choice.row][i] != null){
				games[choice.room].points[choice.id] += getPoints(games[choice.room].board[choice.row][i]);
			}
		}
		games[choice.room].board[choice.row] = [games[choice.room].round[choice.id]];

		games[choice.room].round[choice.id] = null;
		io.in(choice.room).emit('just-played-update', {playerID : choice.id, points : games[choice.room].points[choice.id], color : games[choice.room].colors[choice.id]});
		io.in(choice.room).emit('game-state', games[choice.room].board);

		setTimeout(function(){ playRound(choice.room); }, 1000);
	});
});

function getUserRooms(socket) {
	return Object.entries(rooms).reduce((names, [name, room]) => {
		if (room.users[socket.id] != null){
			names.push(name);
		}
		return names;
	}, []);
}

function getUserGames(socket) {
	return Object.entries(games).reduce((names, [name, game]) => {
		if (game.users[socket.id] != null){
			names.push(name);
		}
		return names;
	}, []);
}

function dealCards(room) {
	var cards = [];
	var hand_size = 10;
	for(var i = 1; i <= 104; i++){
		cards.push(i);
	}
	for(var id in room.cards){
		for(var j = 0; j < hand_size; j++){
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

function playRound(room) {
	if(isRoundOver(room)){
		endRound(room);
	} else {
		let lowestValue = 105;
		let lowestPlayerID = null;
		Object.keys(games[room].round).forEach(function(key) {
			if(games[room].round[key] != null && games[room].round[key] < lowestValue){
				lowestValue = games[room].round[key];
				lowestPlayerID = key;
			}
		});

		let isCardPlacable = false;
		for(let i=0; i<4; i++){
			if(lowestValue > games[room].board[i][games[room].board[i].length - 1]){
				isCardPlacable = true;
			}
		}
		if(!isCardPlacable){
			io.in(room).emit('who-choosing-row', {name : games[room].users[lowestPlayerID], id: lowestPlayerID, color : games[room].colors[lowestPlayerID]});
			io.to(lowestPlayerID).emit('ask-row-selection');
		} else {
			let row = 0;
			let closestLowValue = 0;
			for(let j=0; j<4; j++){
				rowValue = games[room].board[j][games[room].board[j].length - 1];
				if(rowValue < lowestValue && rowValue > closestLowValue){
					closestLowValue = rowValue;
					row = j;
				}
			}
			games[room].board[row][games[room].board[row].length] = lowestValue;

			if(games[room].board[row].length >= 6){
				for(k=1; k<6; k++){
					if(games[room].board[row][k] != null){
						games[room].points[lowestPlayerID] += getPoints(games[room].board[row][k]);
					}
				}

				games[room].board[row] = [lowestValue];
			}

			games[room].round[lowestPlayerID] = null;
			io.in(room).emit('just-played-update', {playerID : lowestPlayerID, points : games[room].points[lowestPlayerID], color : games[room].colors[lowestPlayerID]});
			io.in(room).emit('game-state', games[room].board);

			setTimeout(function(){ playRound(room); }, 1000);
		}
	}
}

function isRoundOver(room) {
	let roundOver = true;
	Object.keys(games[room].round).forEach(function(key) {
		if(games[room].round[key] != null){
			roundOver = false;
			return;
		}
	});
	return roundOver;
}

function endRound(room) {
	var noMoreCards = true;
	Object.keys(games[room].cards).forEach(function(key) {
		if(games[room].cards[key].length > 0){
			noMoreCards = false;
			return;
		}
	});
	if(noMoreCards){
		var scores = Object.keys(games[room].points).map(function(key) {
			return [key, games[room].points[key]];
		});
		scores.sort(function(first, second) {
			return first[1]-second[1];
		});
		io.in(room).emit('game-over', scores);
		delete games[room];
		delete owners[room];
		delete rooms[room];
	} else {
		io.in(room).emit('new-round');
	}
}

function calculatePoints(){
	var pointCards = {};

	for(let i = 1; i < 105; i++){
		if(i % 55 == 0){
			pointCards[i] = 7;
		}
		else if(i % 11 == 0){
			pointCards[i] = 5;
		}
		else if(i % 10 == 0){
			pointCards[i] = 3;
		}
		else if(i % 5 == 0){
			pointCards[i] = 2;
		} else {
			pointCards[i] = 1;
		}
	}
	
	return pointCards;
}

function getPoints(card){
	card = parseInt(card, 10);
	if(card < 1 || card > 104){
		return 0;
	}
	return pointCards[card];
}

server.listen(process.env.PORT, address);
console.debug('Server listening on : https://' + address + ':' + process.env.PORT);