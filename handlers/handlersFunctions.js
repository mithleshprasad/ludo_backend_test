const { sendToPlayersRolledNumber, sendWinner } = require('../socket/emits');

const rollDice = () => {
    const rolledNumber = Math.ceil(Math.random() * 6);
    return rolledNumber;
};

const makeRandomMove = async (roomId, session) => {
    const { updateRoom, getRoom } = require('../services/roomService');
    const room = await getRoom(roomId);
    const currentPlayer = room?.players?.find(player => player.nowMoving === true);

    if (room?.winner) return;
    if (room?.rolledNumber === null) {

        const playerPositions = room.pawns
            .filter(pawn => pawn.color === currentPlayer.color)
            .map(pawn => {

                if (pawn.position >= 16 && pawn.position <= 20) {
                    return pawn.position + 52;
                }
                return pawn.position;
            })
            .sort((a, b) => a - b);
        const positionDifferences = new Set();
        for (let i = 0; i < playerPositions.length; i++) {
            for (let j = i + 1; j < playerPositions.length; j++) {
                const diff = Math.abs(playerPositions[j] - playerPositions[i]);
                if (diff >= 1 && diff <= 6) {
                    positionDifferences.add(diff);
                }
            }
        }
        
        let rolledNumber;
        do {
            rolledNumber = Math.floor(Math.random() * 6) + 1;
            if (currentPlayer.consecutiveSixes === 1 && rolledNumber === 6) {
            continue;
              }
        } while (positionDifferences.has(rolledNumber));
        room.rolledNumber = rolledNumber;
    

        sendToPlayersRolledNumber(room._id.toString(), room.rolledNumber);
    }

    const pawnsThatCanMove = room.getPawnsThatCanMove();
    if (pawnsThatCanMove.length > 0) {
        const randomPawn = pawnsThatCanMove[Math.floor(Math.random() * pawnsThatCanMove.length)];
        room.movePawn(randomPawn);
    }
    room.changeMovingPlayer();
    const winner = room.getWinner();
    if (winner) {
        room.endGame(winner);
        sendWinner(room._id.toString(), winner);
    }
    await updateRoom(room);
};

const isMoveValid = (session, pawn, room) => {

    if (session.color !== pawn.color) {
        return false;
    }
    if (session.playerId !== room.getCurrentlyMovingPlayer()._id.toString()) {
        return false;
    }
    return true;
};

module.exports = { rollDice, makeRandomMove, isMoveValid };
