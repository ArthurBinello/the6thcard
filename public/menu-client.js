const socket = io('http://localhost:3000');
const startForm = document.getElementById('gameStart');
const nameInput = document.getElementById('name');

socket.on('console-msg', data => {
	console.log(data);
});

function generateNewRoom() {
	var codes = []; //TODO make it shared
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
	let roomCode;
	let owner = 0;
	if(formSource == 'create'){
		roomCode = generateNewRoom();
		owner = 1;
	} else {
		do{
			roomCode = window.prompt('Room code (4 letters)').toUpperCase();
		} while(!roomCode.match('^[A-Z]{4}$'))
	}
	sessionStorage.setItem('name', nameInput.value);
	sessionStorage.setItem('room', roomCode);
	sessionStorage.setItem('owner', owner);
	let address = window.location.protocol + '//' + window.location.host + '/lobby';
	// address += '?name=' + nameInput.value + '&room=' + roomCode;
	window.location.href = address;
});