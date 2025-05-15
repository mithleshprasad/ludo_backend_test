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

    const validateSession = async () => {
        if (!req.session) {
            throw new Error('Session not found');
        }
        await new Promise((resolve, reject) => {
            req.session.reload(err => {
                if (err) reject(err);
                else resolve();
            });
        });
        return req.session;
    };

    const handleLogin = async data => {
        try {
            console.log(data);
            const room = await getRoom(data.roomId);
            if (room.isFull()) return socket.emit('error:changeRoom');
            if (room.started) return socket.emit('error:changeRoom');
            if (room.private && room.password !== data.password) return socket.emit('error:wrongPassword');
            await addPlayerToExistingRoom(room, data);
        } catch (error) {
            console.error('Login error:', error);
            socket.emit('error:generic', 'Login failed');
        }
    };

    const handleExit = async () => {
        try {
            await validateSession();
            req.session.destroy();
            socket.emit('redirect');
        } catch (error) {
            console.error('Exit error:', error);
            socket.disconnect();
        }
    };

    const handleReady = async () => {
        try {
            const session = await validateSession();
            if (!session.roomId) {
                return socket.emit('error:noSession', 'No active game session');
            }
            
            const room = await getRoom(session.roomId);
            const player = room.getPlayer(session.playerId);
            
            if (!player) {
                return socket.emit('error:invalidPlayer', 'Player not found in room');
            }
            
            player.changeReadyStatus();
            
            if (room.canStartGame()) {
                room.startGame();
            }
            
            await updateRoom(room);
        } catch (error) {
            console.error('Ready error:', error);
            socket.emit('error:generic', 'Ready action failed');
        }
    };

    const handleRecoverSession = async ({ roomId, playerId }) => {
        try {
            const room = await getRoom(roomId);
            const player = room.players.find(p => p._id.toString() === playerId);
            
            if (!player) {
                return socket.emit('session:invalid');
            }

            req.session.roomId = room._id.toString();
            req.session.playerId = player._id.toString();
            req.session.color = player.color;
            
            await new Promise((resolve, reject) => {
                req.session.save(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            socket.join(room._id.toString());
            socket.emit('player:data', JSON.stringify(req.session));
        } catch (error) {
            console.error('Recovery error:', error);
            socket.emit('session:invalid');
        }
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
        await reloadSession(room);
    };

    const reloadSession = async (room) => {
        try {
            if (!req || !req.session) {
                throw new Error('Session not available');
            }
            
            await new Promise((resolve, reject) => {
                req.session.reload(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            const lastPlayer = room.players[room.players.length - 1];
            if (!lastPlayer) {
                throw new Error('No players found in room');
            }
            
            req.session.roomId = room._id.toString();
            req.session.playerId = lastPlayer._id.toString();
            req.session.color = lastPlayer.color;
            
            await new Promise((resolve, reject) => {
                req.session.save(err => {
                    if (err) reject(err);
                    else resolve();
                });
            });
            
            socket.join(room._id.toString());
            socket.emit('player:data', JSON.stringify(req.session));
        } catch (error) {
            console.error('Session reload error:', error);
            socket.disconnect();
        }
    };
    
    if (!req.session?.roomId) {
        socket.emit('session:recovery-needed');
    }
    
    socket.on('player:login', handleLogin);
    socket.on('player:ready', handleReady);
    socket.on('player:exit', handleExit);
    socket.on('session:recover', handleRecoverSession);
};