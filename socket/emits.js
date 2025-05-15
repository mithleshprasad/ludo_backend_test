const socketManager = require('./socketManager');

const sendToPlayersRolledNumber = (id, rolledNumber) => {
    socketManager.getIO().to(id).emit('game:roll', rolledNumber);
};

const sendToPlayersData = room => {
    if (!room || !room._id) {
        console.error("Error: Room data is invalid or null", room);
        return;
    }

    socketManager.getIO().to(room._id.toString()).emit('room:data', JSON.stringify(room));
};

const sendToOnePlayerData = (id, room) => {
    socketManager.getIO().to(id).emit('room:data', JSON.stringify(room));
};

const sendToOnePlayerRooms = (id, rooms) => {
    socketManager.getIO().to(id).emit('room:rooms', JSON.stringify(rooms));
};

const sendWinner = (id, winner) => {
    socketManager.getIO().to(id).emit('game:winner', winner);
};

module.exports = {
    sendToPlayersData,
    sendToPlayersRolledNumber,
    sendToOnePlayerData,
    sendToOnePlayerRooms,
    sendWinner,
};
