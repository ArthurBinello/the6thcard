const socket = io('http://localhost:3000');
var url = new URL(window.location.href);
// var name = url.searchParams.get('name');
var name = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
const playerlist = document.getElementById('playerlist');
const roomCode = document.getElementById("roomcode");

function addStartButton(){
	//TODO make button do something
	let menu = document.getElementById("menu");
	let btn = document.createElement("BUTTON");
	btn.innerHTML = 'Start Game';
	menu.appendChild(btn);
	//TODO disable button when lobby has less than 2 players
}

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
	you.setAttribute('class', 'lobbylist');
	// you.setAttribute('class', user.color);
	playerlist.appendChild(you);
});

socket.on('user-list', userlist => {
	for(var id in userlist.names){
		var player = document.createElement("li");
		let text = userlist.names[id];
		if(id == userlist.you){
			text += ' (you)'
		}
		if(id == userlist.owner){
			let crown = document.createElement("div");
			crown.innerHTML = '👑';
			crown.className = "owner";
			player.appendChild(crown);
		}
		player.appendChild(document.createTextNode(text));
		player.setAttribute('id', id);
		player.setAttribute('class', 'lobbylist');
		// player.setAttribute('class', userlist.colors[id]);
		// player.style.color = userlist.colors[id];
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
	let newOwner = document.getElementById(user.owner);
	let ownersList = document.getElementsByClassName('owner');
	if(ownersList.length <= 0){
		let crown = document.createElement("div");
		crown.innerHTML = '👑';
		crown.className = "owner";
		newOwner.insertBefore(crown, newOwner.firstChild);
	}
	window.alert(user.name + " has left the lobby.");
});

socket.on('ownership', () => {
	if(owner != 1){
		owner = 1;
		addStartButton();
	}
});