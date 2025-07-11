const { getRooms, getRoom, updateRoom, createNewRoom } = require('../services/roomService');
const { sendToOnePlayerRooms, sendToOnePlayerData, sendWinner } = require('../socket/emits');

module.exports = socket => {
    const req = socket.request;

    const handleGetData = async () => {
        const room = await getRoom(req.session.roomId);
        if ( room && room.nextMoveTime <= Date.now()) {
            room.changeMovingPlayer();
            await updateRoom(room);
        }
        sendToOnePlayerData(socket.id, room);
        if (room &&room.winner) sendWinner(socket.id, room.winner);
    };

    const handleGetAllRooms = async () => {
        const rooms = await getRooms();
        sendToOnePlayerRooms(socket.id, rooms);
    };

    const handleCreateRoom = async data => {
        await createNewRoom(data);
        sendToOnePlayerRooms(socket.id, await getRooms());
    };
    
    socket.on('room:data', handleGetData);
    socket.on('room:rooms', handleGetAllRooms);
    socket.on('room:create', handleCreateRoom);
};
