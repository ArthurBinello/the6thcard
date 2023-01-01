const socket = io('http://localhost:3000');
var username = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
var color = sessionStorage.getItem('color');
var myID;
var pointCards;

const content = document.getElementById('content');
const playerlist = document.getElementById('playerlist');
const board = document.getElementById('board');
const hand = document.getElementById('hand');
const rowButtons = board.getElementsByTagName('button');
const info = document.getElementById('info');
for(let btn of rowButtons){
	btn.style.visibility = 'hidden';
	btn.addEventListener('click', function(){
		selectRow(btn.value);
	});
};

socket.emit('connect-game', {name : username, room : room, owner : owner, color : color});

socket.on('return-id', info => {
	myID = info.IDPlayer;
	pointCards = info.pointValues;
	sessionStorage.setItem('id', myID);
});

socket.on('reject-user', message => {
	window.alert(message);
	window.location.href = window.location.protocol + '//' + window.location.host;
});

socket.on('player-setup', game => {
	for(var id in game.users){
		var player = document.createElement("li");
		let text = game.users[id];
		if(myID == id){
			text += ' (you)';
		}

		var name = document.createElement("div");
		name.classList.add("name");
		var textName = document.createTextNode(text);
		name.appendChild(textName);
		var points = document.createElement("div");
		points.classList.add("points");
		var pointsText = document.createTextNode("0 points");
		points.appendChild(pointsText);
		player.appendChild(name);
		player.appendChild(points);
		var cardSelect = document.createElement("div");
		cardSelect.classList.add('cardSelect');
		cardSelect.classList.add('cardBackground');
		var cardSelectText = document.createTextNode("❓");
		cardSelect.appendChild(cardSelectText);
		player.appendChild(cardSelect);

		player.setAttribute('id', id);
		player.setAttribute('class', game.colors[id]);
		playerlist.appendChild(player);
	}
	showCards(game.cards[myID]);
});

socket.on('just-played-update', player => {
	var playerSelected = document.getElementById(player.playerID);
	var oldPoints = playerSelected.childNodes[1].innerHTML.replace(/\D/g, "");
	if(oldPoints < player.points){
		let pointsDiff = player.points-oldPoints;
		let text = playerSelected.childNodes[0].innerHTML + " has gained " + pointsDiff + " point";
		if(pointsDiff != 1) { text += "s"; }
		showInfo(text, player.color);
	}
	playerSelected.childNodes[1].innerHTML = player.points + " point";
	if(player.points != 1) { playerSelected.childNodes[1].innerHTML += "s"; }
	playerSelected.childNodes[2].innerHTML = "❗";
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
	cardSelected.innerHTML = "✔";
});

socket.on('update-hand', newHand => {
	showCards(newHand);
	let cards = hand.children;
	for(var i = 0; i < cards.length; i++){
		cards[i].removeEventListener('click', selectCard);
	}
});

socket.on('reveal-cards', playedCards => {
	Object.keys(playedCards).forEach(function(key) {
		var cardSelected = document.getElementById(key).childNodes[2];
		cardSelected.innerHTML = playedCards[key];
		cardSelected.classList.remove("cardBackground");
		cardSelected.classList.add(pointCards[playedCards[key]] + "pts");
	});

	let cards = hand.getElementsByTagName("li");
	Array.prototype.forEach.call(cards, function(card) {
		card.style.cursor = 'not-allowed';
	});
});

socket.on('who-choosing-row', player => {
	text = player.name
	if(myID == player.id){
		text += ' (you)';
	}
	text += " is choosing a row."
	showInfo(text, player.color);
});

socket.on('ask-row-selection', () => {
	for(let btn of rowButtons){
		btn.style.visibility = 'visible'
	};
});

socket.on('game-over', scores => {
	let place = 1;
	let backdrop = document.getElementById('backdrop');
	let results = document.getElementById('results');
	let perso_result = document.getElementById('perso-result');
	let rankings = document.getElementById('rankings');
	scores.forEach(player => {
		if(player[0] == myID){
			if(place == 1){
				perso_result.innerHTML = "🏆 You won! 🏆";
			} else {
				perso_result.innerHTML = "You lost!";
			}
		}
		let player_rank = document.createElement("li");
		player_rank.classList.add('ranking');
		let currentPlayer = document.getElementById(player[0]).getElementsByTagName('div')[0].innerHTML;
		let resultMessage = "";
		switch(place){
			case 1:
				resultMessage += '🥇 ';
				break;
			case 2:
				resultMessage += '🥈 ';
				break;
			case 3:
				resultMessage += '🥉 ';
				break;
			default:
				resultMessage += place + ' ';
				break;
		}
		resultMessage += " - " + currentPlayer + " : " + player[1] + " point";
		if(player[1] != 1) { resultMessage += 's'; }
		place++;
		player_rank.appendChild(document.createTextNode(resultMessage));
		rankings.appendChild(player_rank);
	});
	backdrop.style.display = "block";
	results.style.display = "block";
});

socket.on('new-round', () => {
	showInfo("A new round is starting.", "");
	let cards = hand.children;
	for(var i = 0; i < cards.length; i++){
		cards[i].addEventListener('click', selectCard);
		cards[i].style.cursor = 'pointer';
	}
	for(var player in playerlist.children){
		var cardSelected = playerlist.children[player].children[2];
		cardSelected.innerHTML = "❓";
		cardSelected.classList.add("cardBackground");
		cardSelected.classList.remove("1pts","2pts","3pts","5pts","7pts");
	}
});

socket.on('user-dc', user => {
	let dc = document.getElementById(user.id);
	playerlist.removeChild(dc);
	showInfo(user.name + " has left the game.", user.color);
});

socket.on('personnal-info', message => {
	showInfo(message, color);
});

function showCards(cards){
	while(hand.firstChild){
		hand.removeChild(hand.firstChild);
	}
	for(var card in cards){
		var cardEl = document.createElement("li");
		var paragraphEl = document.createElement("p");
		paragraphEl.appendChild(document.createTextNode(cards[card]));
		cardEl.appendChild(paragraphEl);
		cardEl.className = pointCards[cards[card]] + "pts";
		cardEl.addEventListener('click', selectCard);
		hand.appendChild(cardEl);
	}
}

function editCell(x, y, value){
	let row = board.getElementsByTagName("tr")[x];
	let cell = row.getElementsByTagName("td")[y];
	cell.innerHTML = value;
	if(value == ""){
		cell.className = "";
	} else {
		cell.className = "placedCard " + pointCards[value] + "pts";
	}
}

function selectCard(event){
	var source = event.target || event.srcElement;
	if (event.currentTarget !== event.target) {
		source = event.target.parentElement;
	}
	let cards = hand.children;
	for(var i = 0; i < cards.length; i++){
		cards[i].className = cards[i].className.replace(/ selected/g, "");
	}
	source.className += ' selected';
	socket.emit('select-card', {room : room, card : parseInt(source.childNodes[0].innerHTML)});
}

function selectRow(row){
	for(let btn of rowButtons){
		btn.style.visibility = 'hidden';
	};
	socket.emit('choose-row', {id : myID, room : room, row : row});
}

function showInfo(msg, color){
	let li = document.createElement('li');
	li.textContent = msg;
	li.className = color;
	if(color == "" || color == null){
		color = "neutral";
	}
	info.className = color;
	info.appendChild(li);
	li.style.opacity = 1;
	setTimeout(function(){
		(function fade(){(li.style.opacity-=.1)<0?li.style.display="none":setTimeout(fade,40)})();
		setTimeout(function(){
			info.removeChild(li);
		}, 1000);
	}, 4000);
}