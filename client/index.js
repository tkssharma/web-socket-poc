const socketUrl = 'http://localhost:9000';

let connectButton;
let disconnectButton;
let socket;
let statusInput;
let languageInput;
let regionInput;
let payload = {};

const connect = () => {
  let error = null;

  socket = io(socketUrl, {
    autoConnect: false,
  });

  socket.on('connect', () => {
    console.log('Connected');
    statusInput.value = 'Connected';
    connectButton.disabled = true;
    payload = {
      language: languageInput.value,
      region: regionInput.value,
      uuid:uuidv1()
    };
    socket.emit('authentication', payload);
  });

  socket.on('unauthorized', (reason) => {
    console.log('Unauthorized:', reason);
    error = reason.message;
    socket.disconnect();
  });
  
  socket.on('message', (message) => {
    alert(message);
    console.log('message:', message);
  });

  socket.on('disconnect', (reason) => {
    console.log(`Disconnected: ${error || reason}`);
    statusInput.value = `Disconnected: ${error || reason}`;
    connectButton.disabled = false;
    error = null;
  });

  socket.open();
};

const disconnect = () => {
  socket.emit("disconnect", payload);
};

const testing = () => {
  socket.emit("message", {data : 'test'});
};

document.addEventListener('DOMContentLoaded', () => {
  connectButton = document.getElementById('connect');
  disconnectButton = document.getElementById('disconnect');
  statusInput = document.getElementById('status');
  languageInput = document.getElementById('language');
  regionInput = document.getElementById('region');

});
