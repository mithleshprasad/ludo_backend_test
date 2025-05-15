const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PlayerSchema = new Schema({
    sessionID: String,
    name: { type: String, default: null },
    createrId: { type: String, default: null },
    color: String,
    ready: { type: Boolean, default: false },
    nowMoving: { type: Boolean, default: false },
    score: { type: Number, default: 0 }, 
    autoMoveCount: { type: Number, default: 0 },
    consecutiveSixes: { type: Number, default: 0 }

});

PlayerSchema.methods.changeReadyStatus = function () {
    this.ready = !this.ready;
};

PlayerSchema.methods.canMove = function (room, rolledNumber) {
    const playerPawns = room.getPlayerPawns(this.color);
    for (const pawn of playerPawns) {
        if (pawn.canMove(rolledNumber)) return true;
    }
    return false;
};

module.exports = PlayerSchema;
