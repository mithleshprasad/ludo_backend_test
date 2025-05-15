const { getRoom, updateRoom } = require('../services/roomService');
const { COLORS } = require('../ludoutils/constants');

const colors = ['blue', 'yellow', 'red', 'green']; 

function assignPlayerColors(numPlayers) {
    if (numPlayers === 2) {
        return ['blue', 'yellow']; 
    }
    return colors.slice(0, numPlayers); 
}

module.exports = socket => {
    const req = socket.request;

    const handleLogin = async data => {

        console.log(data);
        const room = await getRoom(data.roomId);
        if (room.isFull()) return socket.emit('error:changeRoom');
        if (room.started) return socket.emit('error:changeRoom');
        if (room.private && room.password !== data.password) return socket.emit('error:wrongPassword');
        addPlayerToExistingRoom(room, data);
    };

    const handleExit = async () => {
        req.session.reload(err => {
            if (err) return socket.disconnect();
            req.session.destroy();
            socket.emit('redirect');
        });
    };

    const handleReady = async () => {
        const room = await getRoom(req.session.roomId);
        room.getPlayer(req.session.playerId).changeReadyStatus();
        if (room.canStartGame()) {
            room.startGame();
        }
        await updateRoom(room);
    };

    const addPlayerToExistingRoom = async (room, data) => {
        room.addPlayer(data.name);
        const playerColors = assignPlayerColors(room.players.length);
        room.players.forEach((player, index) => {
            player.color = playerColors[index];
        });

        if (room.isFull()) {
            room.startGame();
        }
        await updateRoom(room);
        reloadSession(room);
    };

    const reloadSession = (room) => {
        if (!req || !req.session) {
            console.error("Session reload failed: req or req.session is undefined");
            return socket.disconnect(); // or handle it differently based on your use case
        }
    
        req.session.reload(err => {
            if (err) {
                console.error("Session reload error:", err);
                return socket.disconnect();
            }
    
            const lastPlayer = room.players[room.players.length - 1];
            if (!lastPlayer) {
                console.error("No players found in room");
                return socket.disconnect();
            }
    
            req.session.roomId = room._id.toString();
            req.session.playerId = lastPlayer._id.toString();
            req.session.color = lastPlayer.color;
    
            req.session.save(err => {
                if (err) {
                    console.error("Session save error:", err);
                    return socket.disconnect();
                }
    
                socket.join(room._id.toString());
                socket.emit('player:data', JSON.stringify(req.session));
            });
        });
    };
    
    socket.on('player:login', handleLogin);
    socket.on('player:ready', handleReady);
    socket.on('player:exit', handleExit);
};
