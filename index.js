var app = require('express')();
var http = require('http').createServer(app);
var io = require('socket.io')(http);


app.get('/', (req, res) => {
  res.send('<h1>Hello world</h1>');
});

io.on('connection', (socket) => {
  console.log('a user connected to the socket');
  
  
                        //    Viewer Listener and emitter

  
  socket.on('sending_message', (data) => {
    console.log(data);
    const {roomId, userName, message} = data;       //destructuring the data
    io.emit("sending_message", {userName,message});
  }),

  socket.on('say_hii',(data) => {
    console.log("Say HIiii");
    console.log(data);
    const {roomId, userName, message} = data;       //destructuring the data
    io.emit("say_hii",{userName,message})
  })

  socket.on('send_hearts', (roomId) => {
    console.log("called heart event n server")
    socket.broadcast.emit("send_hearts");
  })
  
  
  socket.on('send_gift', (data) => {
    console.log("send_gift",data);
    const {roomId, userName, imgName, count} = data;    
    io.emit("send_gift", {userName, imgName, count});
  })
  
  
  socket.on('leave_room', (data) => {
    console.log("leave_room",data)
    const {roomId, userName} = data;
    const broadCastMessage = userName+" "+"left the Room";
    socket.broadcast.emit('leave_room',broadCastMessage) // Send message to everyone BUT sender
  })
  
  
  socket.on('join_room', (data) => {
    console.log(data);
    console.log("Join room called on server")
    const {roomId, userName} = data;
    const broadCastMessage = userName+" "+"joined the Room";
    socket.broadcast.emit('join_room',broadCastMessage);
  })




                  // Streamer listener and emitter
  
  
  
  socket.on('preparing_streamer', (data) => {
    let roomId = generateRoomId();
    console.log(roomId);
    console.log('Prepare live stream', data);
    const { userName, roomName } = data;
    if (!userName || !roomName) return;
    return Room.findOneAndUpdate(
      { userName, roomName },
      { liveStatus: LiveStatus.PREPARE, createdAt: Utils.getCurrentDateTime() },
      { new: true, useFindAndModify: false }
    ).exec((error, foundRoom) => {
      if (error) return;
      if (foundRoom) return emitListLiveStreamInfo();
      const condition = {
        userName,
        roomName,
        liveStatus: LiveStatus.PREPARE,
      };
      return Room.create(condition).then((createdData) => {
        emitListLiveStreamInfo();
      });
    });
  })
  
  
  
  
  socket.on('go_live', (data) => {
    
    console.log('Begin live stream', data);
    const { userName, roomName } = data;
    if (!userName || !roomName) return;
    return Room.findOneAndUpdate(
      { userName, roomName },
      { liveStatus: LiveStatus.ON_LIVE, beginAt: Utils.getCurrentDateTime() },
      { new: true, useFindAndModify: false }
    ).exec((error, foundRoom) => {
      if (error) return;
      if (foundRoom) {
        io.in(roomName).emit('begin-live-stream', foundRoom);
        return emitListLiveStreamInfo();
      }
      const condition = {
        userName,
        roomName,
        liveStatus: LiveStatus.ON_LIVE,
      };
      return Room.create(condition).then((createdData) => {
        io.in(roomName).emit('begin-live-stream', createdData);
        emitListLiveStreamInfo();
      });
    });
  })
  
  
  
  
  socket.on('close_stream', (data) => {
    console.log('Finish live stream');
      const { userName, roomName } = data;
      const filePath = Utils.getMp4FilePath();
      if (!userName || !roomName) return;
      return Room.findOneAndUpdate(
        { userName, roomName },
        { liveStatus: LiveStatus.FINISH, filePath },
        { new: true, useFindAndModify: false }
      ).exec((error, updatedData) => {
        if (error) return;
        io.in(roomName).emit('finish-live-stream', updatedData);
        socket.leave(roomName);
        return emitListLiveStreamInfo();
      });
  })
  
  
  
});

http.listen(3000, () => {
  console.log('listening on *:3000');
});
