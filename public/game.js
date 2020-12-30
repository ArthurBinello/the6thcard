const socket = io('http://localhost:3000');
var username = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
var color = sessionStorage.getItem('color');
var myID;

const content = document.getElementById('content');
const playerlist = document.getElementById('playerlist');
const board = document.getElementById('board');
const hand = document.getElementById('hand');
const rowButtons = board.getElementsByTagName('button');
for(let btn of rowButtons){
	btn.style.visibility = 'hidden';
	btn.addEventListener('click', function(){
		selectRow(btn.value);
	});
};

socket.emit('connect-game', {name : username, room : room, owner : owner, color : color});

socket.on('return-id', IDPlayer => {
	myID = IDPlayer;
	sessionStorage.setItem('id', myID);
});

socket.on('player-setup', game => {
	for(var id in game.users){
		var player = document.createElement("li");
		let text = game.users[id];
		if(myID == id){
			text += ' (you)';
		}

		var name = document.createElement("div");
		var textName = document.createTextNode(text);
		name.appendChild(textName);
		player.appendChild(name);
		var points = document.createElement("div");
		var pointsText = document.createTextNode("0");
		points.appendChild(pointsText);
		player.appendChild(points);
		var cardSelect = document.createElement("div");
		var cardSelectText = document.createTextNode("?");
		cardSelect.appendChild(cardSelectText);
		player.appendChild(cardSelect);

		player.setAttribute('id', id);
		player.setAttribute('class', 'lobbylist ' + game.colors[id]);
		playerlist.appendChild(player);
	}
	showCards(game.cards[myID]);
});

socket.on('just-played-update', player => {
	var playerSelected = document.getElementById(player.playerID);
	playerSelected.childNodes[1].innerHTML = player.points;
	playerSelected.childNodes[2].innerHTML = "O";
});

socket.on('game-state', board => {
	for(var i = 0; i < 4; i++){
		for(var j = 0; j < 6; j++){
			let card = board[i][j];
			if(card == null) {
				card = "";
			}
			editCell(i, j, card);
		}
	}
});

socket.on('card-played', player => {
	var cardSelected = document.getElementById(player).childNodes[2];
	cardSelected.innerHTML = "!";
});

socket.on('update-hand', hand => {
	showCards(hand);
	//TODO disable cards
});

socket.on('reveal-cards', playedCards => {
	Object.keys(playedCards).forEach(function(key) {
		var cardSelected = document.getElementById(key).childNodes[2];
		cardSelected.innerHTML = playedCards[key];
	});
});

socket.on('who-choosing-row', player => {
	//TODO display this console log
	console.log(player + " is choosing a row");
});

socket.on('ask-row-selection', () => {
	for(let btn of rowButtons){
		btn.style.visibility = 'visible'
	};
});

socket.on('game-over', scores => {
	let place = 1;
	let resultMessage = "";
	scores.forEach(player => {
		if(player[0] == myID){
			if(place == 1){
				resultMessage = "You won!\n" + resultMessage;
			} else {
				resultMessage = "You lost!\n" + resultMessage;
			}
		}
		let currentPlayer = document.getElementById(player[0]).getElementsByTagName('div')[0].innerHTML;
		resultMessage += place + " - " + currentPlayer + " : " + player[1] + " pts";
		place++;
		resultMessage += "\n";
	});
	//TODO actually display this
	console.log(resultMessage);
});

function showCards(cards){
	while(hand.firstChild){
		hand.removeChild(hand.firstChild);
	}
	for(var card in cards){
		var cardEl = document.createElement("li");
		cardEl.appendChild(document.createTextNode(cards[card]));
		cardEl.addEventListener('click', selectCard)
		hand.appendChild(cardEl);
	}
}

function editCell(x, y, value){
	let row = board.getElementsByTagName("tr")[x];
	let cell = row.getElementsByTagName("td")[y];
	cell.innerHTML = value;
}

function selectCard(event){
	//TODO show card selected in html
	//TODO block if round in progress
	var source = event.target || event.srcElement;
	socket.emit('select-card', {room : room, card : parseInt(source.innerHTML)});
}

function selectRow(row){
	//TODO send row selection
}