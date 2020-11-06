const socket = io('http://localhost:3000');
var url = new URL(window.location.href);
var name = url.searchParams.get('name');
const playerlist = document.getElementById('playerlist');

socket.emit('new-user', name);

socket.on('user-added', user => {
	var you = document.createElement("li");
	you.appendChild(document.createTextNode(user.icon + " " + user.name));
	you.style.color = user.color;
	playerlist.appendChild(you);
});

socket.on('user-list', userlist => {
	for(var id in userlist.names){
		var player = document.createElement("li");
		player.appendChild(document.createTextNode(userlist.icons[id] + " " + userlist.names[id]));
		player.style.color = userlist.colors[id];
		playerlist.appendChild(player);
	}
});

socket.on('full-lobby', () => {
	window.alert("The lobby is full");
	window.location.href = window.location.protocol + '//' + window.location.host;
});

socket.on('user-dc', user => {
	console.log(user);
})