function planRoom(planId) {
  return `plan:${planId}`;
}

function userRoom(userId) {
  return `user:${userId}`;
}

function socketsCount(io, room) {
  return io.sockets.adapter.rooms.get(room)?.size ?? 0;
}

module.exports = { planRoom, userRoom, socketsCount };
