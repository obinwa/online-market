const { getIO } = require('../utils/socket');
const { Chat } = require('../db/models');
const io = getIO();

io.on('connection', async (socket) => {
  socket.on('loggedIn', async ({ roomName }) => {
    socket.join(roomName);
    io.emit('ping', roomName);
  });

  socket.on('pong', async ({ roomName }) => {
    socket.join(roomName);
    const sockets = await io.in(roomName).fetchSockets();
    console.log(sockets.length);
  });
  // send
  socket.on('send', async ({ roomName, message, clientId, adminId }) => {
    await Chat.create({
      clientId,
      message,
      adminId,
    });
    io.to(roomName).emit('reply', message);
  });
});
