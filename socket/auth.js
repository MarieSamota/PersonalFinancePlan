const jwt = require("jsonwebtoken");

function socketAuth(socket, next) {
  const token = socket.handshake.auth?.token;

  try {
    const { id, email } = jwt.verify(token, process.env.JWT_SECRET);
    socket.data.user = { id, email };
    next();
  } catch (err) {
    next(new Error("Unauthorized"));
  }
}

module.exports = socketAuth;
