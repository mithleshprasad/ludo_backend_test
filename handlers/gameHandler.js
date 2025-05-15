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
        
            const player = room.getCurrentlyMovingPlayer();
            if (player) {
                player.score = (player.score || 0) + room.rolledNumber;
       
                if (room.didAttack) {
                    player.score -= pawn.basePos; 
                }

                room.markModified('players'); 
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
        const room = await getRoom(req.session.roomId);
        const player = room.getPlayer(req.session.playerId);
     
        const positionsArray = room.pawns
    .filter(pawn => pawn.color === player.color)
    .map(pawn => {
   
        if ( pawn.position >= 16 && pawn.position <= 21) {
            return pawn.position + 52;
        }
        return pawn.position;
    })
    .sort((a, b) => a - b);
            console.log(`Positions for ${player.color} pawns:`, positionsArray);
        const positionDifferences = new Set();
        for (let i = 0; i < positionsArray.length; i++) {
            for (let j = i + 1; j < positionsArray.length; j++) {
                const diff = Math.abs(positionsArray[j] - positionsArray[i]);
                if (diff >= 1 && diff <= 6) {
                    positionDifferences.add(diff);
                }
            }
        }
        console.log(`Position differences for ${player.color} pawns:`, Array.from(positionDifferences));
    
        let rolledNumber;
        do {
            rolledNumber = Math.floor(Math.random() * 6) + 1;
        } while (positionDifferences.has(rolledNumber)); 
    
        console.log(`${req.session.color} rolled ${rolledNumber}`);
    
     
        sendToPlayersRolledNumber(req.session.roomId, rolledNumber);
        // sendToPlayersRolledNumber(req.session.roomId, 6);
   
        // room.rolledNumber = 6;
        room.rolledNumber = rolledNumber;
        const updatedRoom = await updateRoom(room);
    
        const updatedPlayer = updatedRoom.getPlayer(req.session.playerId);
    
        // Check if the player can move; if not, change the moving player
        if (!updatedPlayer.canMove(updatedRoom, rolledNumber)) {
            updatedRoom.changeMovingPlayer();
            await updateRoom(updatedRoom);
        }
    };

    socket.on('game:roll', handleRollDice);
    socket.on('game:move', handleMovePawn);
};
