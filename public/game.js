const socket = io('http://localhost:3000');
var name = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
var color = sessionStorage.getItem('color');
var myID;

const content = document.getElementById('content');
const playerlist = document.getElementById('playerlist');

socket.emit('connect-game', {name : name, room : room, owner : owner, color : color});

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
		// if(id == game.owner){
		// 	let crown = document.createElement("div");
		// 	crown.innerHTML = '👑';
		// 	crown.className = "owner";
		// 	player.appendChild(crown);
		// 	sessionStorage.setItem('color', game.colors[id]);
		// }
		player.appendChild(document.createTextNode(text));
		player.setAttribute('id', id);
		player.setAttribute('class', 'lobbylist ' + game.colors[id]);
		playerlist.appendChild(player);
	}
});