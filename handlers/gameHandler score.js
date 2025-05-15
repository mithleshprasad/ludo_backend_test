const { getRoom, updateRoom } = require('../services/roomService');
const { sendToPlayersRolledNumber, sendWinner } = require('../socket/emits');
const { rollDice, isMoveValid } = require('./handlersFunctions');

module.exports = socket => {
    const req = socket.request;

    const handleMovePawn = async pawnId => {
        const room = await getRoom(req.session.roomId);
        if (room && room.winner) return;

        const pawn = room && room.getPawn(pawnId);
        if (isMoveValid(req.session, pawn, room)) {
            const newPositionOfMovedPawn = pawn.getPositionAfterMove(room.rolledNumber);
            room.changePositionOfPawn(pawn, newPositionOfMovedPawn);
            room.beatPawns(newPositionOfMovedPawn, req.session.color);

            // **Update Player Score Based on Rolled Number**
            const player = room.getCurrentlyMovingPlayer();
            if (player) {
                player.score = (player.score || 0) + room.rolledNumber; // Add rolled number to score

                // Deduct base position if an attack happens
                if (room.didAttack) {
                    player.score -= pawn.basePos; // Deduct base position points
                }

                room.markModified('players'); // Ensure changes are saved
            }

            room.changeMovingPlayer();
            const winner = room.getWinner();
            if (winner) {
                room.endGame(winner);
                sendWinner(room._id.toString(), winner);
            }

            await updateRoom(room);
        }
    };

    const handleRollDice = async () => {
        const rolledNumber = rollDice();
        sendToPlayersRolledNumber(req.session.roomId, rolledNumber);
        const room = await updateRoom({ _id: req.session.roomId, rolledNumber: rolledNumber });
        const player = room.getPlayer(req.session.playerId);
        if (!player.canMove(room, rolledNumber)) {
            room.changeMovingPlayer();
            await updateRoom(room);
        }
    };

    socket.on('game:roll', handleRollDice);
    socket.on('game:move', handleMovePawn);
};
