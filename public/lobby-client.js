const socket = io('http://localhost:3000');
var name = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
const playerlist = document.getElementById('playerlist');
const roomCode = document.getElementById("roomcode");
const info = document.getElementById('info');

if(owner == 1){
	addStartButton();
}
roomCode.innerHTML = room;
socket.emit('new-user', {name : name, room : room, owner : owner});

socket.on('user-added', user => {
	var you = document.createElement("li");
	if(user.owner == 1){
		let crown = document.createElement("div");
		crown.innerHTML = '👑';
		crown.className = "owner";
		you.appendChild(crown);
	}
	you.appendChild(document.createTextNode(user.name));
	you.setAttribute('id', user.id);
	you.setAttribute('class', 'lobbylist ' + user.color);
	playerlist.appendChild(you);
	if(playerlist.getElementsByClassName('lobbylist').length >= 2 && document.getElementById('startGame')){
		document.getElementById('startGame').disabled = false;
	}
	showInfo(user.name + " has joined the lobby.", user.color);
});

socket.on('user-list', userlist => {
	for(var id in userlist.names){
		var player = document.createElement("li");
		let text = userlist.names[id];
		if(id == userlist.you){
			text += ' (you)';
			sessionStorage.setItem('color', userlist.colors[id]);
		}
		if(id == userlist.owner){
			let crown = document.createElement("div");
			crown.innerHTML = '👑';
			crown.className = "owner";
			player.appendChild(crown);
		}
		player.appendChild(document.createTextNode(text));
		player.setAttribute('id', id);
		player.setAttribute('class', 'lobbylist ' + userlist.colors[id]);
		playerlist.appendChild(player);
	}
});

socket.on('full-lobby', () => {
	window.alert("The lobby is full.");
	window.location.href = window.location.protocol + '//' + window.location.host;
});

socket.on('unknown-room', () => {
	window.alert("This room doesn't exist.");
	window.location.href = window.location.protocol + '//' + window.location.host;
});

socket.on('user-dc', user => {
	let dc = document.getElementById(user.id);
	playerlist.removeChild(dc);
	if(playerlist.getElementsByClassName('lobbylist').length < 2 && document.getElementById('startGame')){
		document.getElementById('startGame').disabled = true;
	}
	showInfo(user.name + " has left the lobby.", user.color);

	let newOwner = document.getElementById(user.owner);
	let ownersList = document.getElementsByClassName('owner');
	if(ownersList.length <= 0){
		let crown = document.createElement("div");
		crown.innerHTML = '👑';
		crown.className = "owner";
		newOwner.insertBefore(crown, newOwner.firstChild);
		setTimeout(function(){
			showInfo(user.ownerName + " is the new owner.", user.ownerColor);
		}, 3000);
	}
});

socket.on('ownership', () => {
	if(owner != 1){
		owner = 1;
		addStartButton();
	}
});

socket.on('game-started', () => {
	window.location.href = window.location.protocol + '//' + window.location.host + '/game';
});
function addStartButton(){
	let menu = document.getElementById("menu");
	let btn = document.createElement("BUTTON");
	btn.innerHTML = 'Start Game';
	btn.setAttribute('id', 'startGame');
	if(playerlist.getElementsByClassName('lobbylist').length < 2){
		btn.disabled = true;
	}
	btn.addEventListener('click', startGame);
	menu.appendChild(btn);
}

function startGame(){
	let nbPlayers = playerlist.getElementsByClassName('lobbylist').length;
	socket.emit('start-game', {room  : room, nbPlayers : nbPlayers});
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
	setTimeout(function(){
		info.removeChild(li);
	}, 5000);
}