var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);

app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
    console.log('a user connected');



    socket.on('onLiveChat', (data) => {
    console.log(data);
    console.log("called socket server")
        io.emit("onLiveChat", data);
    }),




    socket.on('sendGifts', (data) => {
      console.log("Gift socket");
      console.log(data);
      console.log("called socket server")
          io.emit("sendGifts", data);
      })



  });

http.listen(3000, () => {
  console.log('listening on *:3000');
});