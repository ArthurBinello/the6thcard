const socket = io('http://localhost:3000');
var url = new URL(window.location.href);
// var name = url.searchParams.get('name');
var name = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
const playerlist = document.getElementById('playerlist');

function addStartButton(){
	//TODO make button do something
	let btn = document.createElement("BUTTON");
	btn.innerHTML = 'Start Game';
	document.body.appendChild(btn);
	//TODO disable button when lobby has less than 2 players
}

if(owner == 1){
	addStartButton();
}
socket.emit('new-user', {name : name, room : room, owner : owner});

socket.on('user-added', user => {
	var you = document.createElement("li");
	let text = user.name;
	if(user.owner == 1){
		text += ' 👑';
	}
	you.appendChild(document.createTextNode(text));
	you.setAttribute('id', user.id);
	you.style.color = user.color;
	playerlist.appendChild(you);
});

socket.on('user-list', userlist => {
	for(var id in userlist.names){
		var player = document.createElement("li");
		let text = userlist.names[id];
		if(id == userlist.owner){
			text += ' 👑';
		}
		player.appendChild(document.createTextNode(text));
		player.setAttribute('id', id);
		player.style.color = userlist.colors[id];
		playerlist.appendChild(player);
	}
});

socket.on('full-lobby', () => {
	window.alert("The lobby is full");
	window.location.href = window.location.protocol + '//' + window.location.host;
});

socket.on('user-dc', user => {
	let dc = document.getElementById(user.id);
	playerlist.removeChild(dc);
	let newOwner = document.getElementById(user.owner);
	if(!newOwner.innerHTML.includes('👑')){
		newOwner.innerHTML += ' 👑';
	}
	window.alert(user.name + " has left the lobby.");
});

socket.on('ownership', () => {
	owner = 1;
	addStartButton();
});