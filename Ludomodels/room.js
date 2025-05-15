const mongoose = require('mongoose');
const { COLORS, MOVE_TIME } = require('../ludoutils/constants.js');
const { makeRandomMove } = require('../handlers/handlersFunctions');
const timeoutManager = require('./timeoutManager.js');
const PawnSchema = require('./pawn');
const PlayerSchema = require('./player');

const RoomSchema = new mongoose.Schema({
    name: String,
    createrId: { type: String, default: null },
    Accepetd_By: { type: String, default: null },
    gameuniqueId: {
        type: String,
        default: null
    },
    betamount: { type: Number, default: null },
    Game_type: { type: String, default: null },
    private: { type: Boolean, default: false },
    beatPawnBonusTurn: { type: Boolean, default: false },
    Game_status: { type: String, default: 'active' },
    password: String,
    createDate: { type: Date, default: Date.now },
    GameId : { type: String, default: null },
    started: { type: Boolean, default: false },
    full: { type: Boolean, default: false },
    nextMoveTime: Number,
    rolledNumber: Number,
    players: [PlayerSchema],
    winner: { type: String, default: null },
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    pawns: {
        type: [PawnSchema],
        default: () => {
            const startPositions = [];
            const redStartPosition = 16;
            const greenStartPosition = 42;

            const blueStartPosition = 55;
            const yelloStartPosition = 29;

            for (let i = 0; i < 16; i++) {
                let pawn = {};
                if (i < 4) {
                    pawn.color = COLORS[0];  
                    pawn.basePos = i;
                    pawn.position = i;
                } else if (i < 8) {
                    pawn.color = COLORS[1]; 
                    pawn.basePos = blueStartPosition;
                    pawn.position = blueStartPosition;
                } else if (i < 12) {
                    pawn.color = COLORS[2]; 
                    pawn.basePos = i;
                    pawn.position = i;
                } else if (i < 16) {
                    pawn.color = COLORS[3];  
                    pawn.basePos = yelloStartPosition;
                    pawn.position = yelloStartPosition;
                }
                startPositions.push(pawn);
            }
            return startPositions;
        },
        },
});
RoomSchema.methods.beatPawns = function (position, attackingPawnColor) {
    const restrictedPositions = [16, 24, 29, 37, 42, 50, 55, 63];
    
    if (restrictedPositions.includes(position)) {
        return;
    }
    const pawnsOnPosition = this.pawns.filter(pawn => pawn.position === position);
    let didBeatPawn = false; 
    
    pawnsOnPosition.forEach(pawn => {
        if (pawn.color !== attackingPawnColor) {
            didBeatPawn = true; 
            const index = this.getPawnIndex(pawn._id);
            const stepsMoved = Math.abs(this.pawns[index].position - this.pawns[index].basePos);
            const stepsMovedForBluestep1 = Math.abs(65 - this.pawns[index].basePos);
            const stepsMovedForBluestep2 = Math.abs(this.pawns[index].position - 16);
            const stepsMovedBlue = stepsMovedForBluestep1 + stepsMovedForBluestep2 + 3;

            const position = Math.abs(this.pawns[index].position);
            this.pawns[index].position = this.pawns[index].basePos;
            const player = this.players.find(player => player.color === pawn.color);
            const isInRange = position >= 16 && position <= 54;
            const isInRangeYellow = position >= 16 && position <= 28;
            if (player) {
                if (
                    attackingPawnColor === 'yellow' &&
                    isInRange
                ) {
                    player.score = (player.score || 0) - stepsMovedBlue;
                    console.log(' attackingPawnColor === yellow', stepsMovedBlue);
                    
                } else if (attackingPawnColor === 'blue' && isInRangeYellow) {
                    player.score = (player.score || 0) - stepsMovedBlue;
                    console.log(' attackingPawnColor === blue', stepsMovedBlue);
                } else {
                    player.score = (player.score || 0) - stepsMoved;
                }
            }
        }
    });
    

    if (didBeatPawn) {
        this.beatPawnBonusTurn = true;
    }
};
RoomSchema.methods.changeMovingPlayer = function () {
    if (this.winner) return;


    if (this.beatPawnBonusTurn) {
        this.beatPawnBonusTurn = false;
        this.nextMoveTime = Date.now() + MOVE_TIME;
        this.rolledNumber = null;
        timeoutManager.clear(this._id.toString());
        timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
        return;
    }

    const playerIndex = this.players.findIndex(player => player.nowMoving === true);
    const player = this.players[playerIndex];

 if (player) {
    if (this.rolledNumber === 6) {
        player.consecutiveSixes = (player.consecutiveSixes || 0) + 1;
    } else {
        player.consecutiveSixes = 0;
    }
} else {
    console.error('Player is undefined in changeMovingPlayer');
    // Optionally throw an error or handle it gracefully
}


    if (player.consecutiveSixes === 2) {
        if (this.rolledNumber === 6) {

            player.nowMoving = false;
            player.consecutiveSixes = 0;
            const nextIndex = (playerIndex + 1) % this.players.length;
            this.players[nextIndex].nowMoving = true;
        } 

    }

    else if (this.rolledNumber !== 6 || player.consecutiveSixes === 2) {
        player.nowMoving = false;
        player.consecutiveSixes = 0;
        const nextIndex = (playerIndex + 1) % this.players.length;
        this.players[nextIndex].nowMoving = true;
    }


    this.nextMoveTime = Date.now() + MOVE_TIME;
    this.rolledNumber = null;
    timeoutManager.clear(this._id.toString());
    timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
};

RoomSchema.methods.movePawn = async function (pawn) {
    const newPositionOfMovedPawn = pawn.getPositionAfterMove(this.rolledNumber);
    this.changePositionOfPawn(pawn, newPositionOfMovedPawn);
    this.beatPawns(newPositionOfMovedPawn, pawn.color);
};

RoomSchema.methods.getPawnsThatCanMove = function () {
    const movingPlayer = this.getCurrentlyMovingPlayer();
    if (movingPlayer) {
        this.getPawnsThatCanMoveScore();
        movingPlayer.autoMoveCount += 1;

        if (movingPlayer.autoMoveCount >= 5) {
            const opponent = this.players.find(player => player.color !== movingPlayer.color);
            if (opponent) {
                this.endGame(opponent.color);
                return [];
            }
        }
    }

    const playerPawns = this.getPlayerPawns(movingPlayer?.color);
    return playerPawns.filter(pawn => pawn.canMove(this.rolledNumber));
};

RoomSchema.methods.getPawnsThatCanMoveScore = async function () {
    const movingPlayer = this.getCurrentlyMovingPlayer();
    if (!movingPlayer) return;

    const currentTime = Date.now();
    const gameDuration = currentTime - this.startTime;
    const twentyMinutes = 10 * 60 * 1000;
    let saveRequired = false;
// Convert milliseconds to minutes and seconds
const minutes = Math.floor(gameDuration / 60000);
const seconds = Math.floor((gameDuration % 60000) / 1000);

// Format as MM:SS with leading zeros
const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

console.log("gameDuration", formattedTime);

    if (gameDuration >= twentyMinutes) {
        let maxScore = -1;
        let winningPlayer = null;

        this.players.forEach(player => {
            if (player.score > maxScore) {
                maxScore = player.score;
                winningPlayer = player;
            }
        });

        if (winningPlayer) {
            this.endGame(winningPlayer.color); 
            return; 
        }
    }

    if (this.rolledNumber !== null && this.rolledNumber > 0) {
        movingPlayer.score = (movingPlayer.score || 0) + this.rolledNumber;
        this.markModified('players');
        saveRequired = true;
    }

    if (saveRequired) {
        try {
            await this.save(); // ✅ Save only once
        } catch (error) {
            console.error("Save failed:", error.message);
        }
    }
};



RoomSchema.methods.changePositionOfPawn = function (pawn, newPosition) {
    const pawnIndex = this.getPawnIndex(pawn._id);
    this.pawns[pawnIndex].position = newPosition;
};

RoomSchema.methods.canStartGame = function () {
    return this.players.filter(player => player.ready).length >= 2;
};

RoomSchema.methods.startGame = function () {
    this.started = true;
    this.startTime = Date.now();
    this.endTime = this.startTime + 10 * 60 * 1000; 
    this.nextMoveTime = Date.now() + MOVE_TIME;
    this.players.forEach(player => (player.ready = true));
    this.players[0].nowMoving = true;
    timeoutManager.set(makeRandomMove, MOVE_TIME, this._id.toString());
};

RoomSchema.methods.endGame = async function (winnerColor) {
    if (this.winner) return; // 🛑 Avoid duplicate game-ending logic

    this.winner = winnerColor;
    this.rolledNumber = null;
    this.nextMoveTime = null;
    this.players.forEach(player => (player.nowMoving = false));

    timeoutManager.clear(this._id.toString()); // ⏳ Stop any timers

    try {
        await this.save(); // ✅ Save game state
        console.log(`Game ended! Winner: ${winnerColor}`);
    } catch (error) {
        console.error("Failed to end game:", error.message);
    }
};

RoomSchema.methods.getWinner = function () {
    if (this.pawns.filter(pawn => pawn.color === 'red' && pawn.position === 73).length === 4) {
        return 'red';
    }
    if (this.pawns.filter(pawn => pawn.color === 'blue' && pawn.position === 79).length === 4) {
        return 'blue';
    }
    if (this.pawns.filter(pawn => pawn.color === 'green' && pawn.position === 85).length === 4) {
        return 'green';
    }
    if (this.pawns.filter(pawn => pawn.color === 'yellow' && pawn.position === 91).length === 4) {
        return 'yellow';
    }
    return null;
};

RoomSchema.methods.isFull = function () {
    if (this.players.length === 4) {
        this.full = true;
    }
    return this.full;
};

RoomSchema.methods.getPlayer = function (playerId) {
    return this.players.find(player => player._id.toString() === playerId.toString());
};

// In your Room model
RoomSchema.methods.addPlayer = function (name, id) {
    if (this.full) return;

    const playerCount = this.players.length;
    let color;

    

    if (playerCount === 0) {
        color = 'red'; 
    } else if (playerCount === 1) {
        color = 'green';
    } else {
        color = COLORS[playerCount]; 
    }

    this.players.push({
        sessionID: id,
        name: name,
        ready: false,
        color: color,
    });

    this.isFull(); 
};


RoomSchema.methods.getPawnIndex = function (pawnId) {
    return this.pawns.findIndex(pawn => pawn._id.toString() === pawnId.toString());
};

RoomSchema.methods.getPawn = function (pawnId) {
    return this.pawns.find(pawn => pawn._id.toString() === pawnId.toString());
};

RoomSchema.methods.getPlayerPawns = function (color) {
    return this.pawns.filter(pawn => pawn.color === color);
};

RoomSchema.methods.getCurrentlyMovingPlayer = function () {
    return this.players.find(player => player.nowMoving === true);
};

const Room = mongoose.model('Room', RoomSchema);

module.exports = Room;
