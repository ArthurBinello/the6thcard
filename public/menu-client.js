const socket = io('http://localhost:3000');
const startForm = document.getElementById('gameStart');
const nameInput = document.getElementById('name');

socket.on('console-msg', data => {
	console.log(data);
});

function generateNewRoom() {
	var codes = [];
	let roomCode = "";
	let alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
	do {
		for(i = 0; i < 4; i++){
			roomCode += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
		}
	} while(roomCode in codes);
	codes.push(roomCode);

	return roomCode;
}

startForm.addEventListener('submit', e => {
	e.preventDefault();
	let formSource = e.submitter.id;
	// socket.emit('new-user', nameInput.value);
	let roomCode;
	if(formSource == 'create'){
		roomCode = generateNewRoom();
	} else {
		do{
			roomCode = window.prompt('Room code (4 letters)').toUpperCase();
		} while(!roomCode.match('^[A-Z]{4}$'))
	}
	let address = window.location.protocol + '//' + window.location.host + '/lobby?name=' + nameInput.value;
	// address += '&room=' + roomCode;
	window.location.href = address;
	console.log(window.location);
});