const socket = io('http://localhost:3000');
var name = sessionStorage.getItem('name');
var room = sessionStorage.getItem('room');
var owner = sessionStorage.getItem('owner');
var color = sessionStorage.getItem('color')

var content = document.getElementById('content');
content.innerHTML = name + " " + room

socket.emit('connect-game', {name : name, room : room, owner : owner, color : color});