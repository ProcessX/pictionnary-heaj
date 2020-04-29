'use strict';

const express = require('express');
const socketIO = require('socket.io');

const port = process.env.PORT || 3000;
const index = '/pictionnary.html';

const server = express()
  .use((req, res) => res.sendFile(index, {root: __dirname}))
  .listen(port, () => console.log('Listening on port ' + port));

const io = socketIO(server);

io.on('connection', (socket) => {
  console.log('A new client joined the server !');

  onConnection(socket);
});

let users = [];

let currentPlayer;

let timeout;

let words = ['Sapin', 'Mante-religieuse', 'Soleil'];

function onConnection(socket) {
  socket.on('username', (username) => {
    console.log(`Welcome, ${username}`);
    socket.username = username;

    if(!users[0]){
      currentPlayer = socket;
      timeout = clearTimeout(timeout);
      users.push(socket);
      switchPlayer();
    }
    else{
      users.push(socket);
    }

    sendUsers(users);
  });

  socket.on('line', (data) => {
    socket.broadcast.emit('line', data)
  });

  socket.on('disconnect', () => {
    users = users.filter((user) => {
      return user !== socket;
    });
    console.log(users.length);
    sendUsers();
    if(users.length === 0){
      timeout = clearTimeout(timeout);
    }
  });
}


function sendUsers() {
  io.emit('users', users.map((user) => {
    return {
      username: user.username,
      active: user === currentPlayer,
    };
  }));
}


function switchPlayer(){
  if(!users[0])
    return;

  const indexCurrentPlayer = users.indexOf(currentPlayer);

  currentPlayer = users[(indexCurrentPlayer + 1) % users.length];

  console.log('Switch player');

  sendUsers();

  timeout = setTimeout(switchPlayer, 20000);

  currentPlayer.emit('word', words[Math.floor(words.length * Math.random())]);
  io.emit('clear');
}