const db = require("../models/index");
const socketAuth = require("./auth");
const registerPlanHandlers = require("./plans.handlers");
const { planRoom, userRoom, socketsCount } = require("./rooms");

const { PlanMember } = db;

async function joinRooms(socket) {
  const { id } = socket.data.user;
  socket.join(userRoom(id));

  const memberships = await PlanMember.findAll({
    where: { userId: id },
    attributes: ["planId"],
  });
  const rooms = memberships.map((m) => planRoom(m.planId));
  socket.join(rooms);
  return rooms;
}

function initSocket(io) {
  io.use(socketAuth);

  io.on("connection", (socket) => {
    const { id, email } = socket.data.user;
    console.log("User connected", socket.id, email);

    registerPlanHandlers(io, socket);

    joinRooms(socket)
      .then((rooms) => {
        if (socketsCount(io, userRoom(id)) === 1 && rooms.length > 0) {
          socket.to(rooms).emit("user online", { userId: id, email });
        }
      })
      .catch((err) => console.error(err));

    socket.on("disconnecting", () => {
      const rooms = [...socket.rooms].filter((room) => room.startsWith("plan:"));
      if (socketsCount(io, userRoom(id)) === 1 && rooms.length > 0) {
        socket.to(rooms).emit("user offline", { userId: id, email });
      }
    });

    socket.on("disconnect", (reason) => {
      console.log("User disconnected", socket.id, email, reason);
    });
  });
}

module.exports = initSocket;
