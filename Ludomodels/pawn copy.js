const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const PawnSchema = new Schema({
    color: String,
    basePos: Number,
    position: Number,
});

PawnSchema.methods.canMove = function (rolledNumber) {
    // if (this.position === this.basePos && (rolledNumber === 6 )) {
    if (this.position === this.basePos ) {
        return rolledNumber > 0;
    }
    console.log("fdjhfdkhfk",basePos)

    if (this.position !== this.getPositionAfterMove(rolledNumber) && this.position !== this.basePos) {
        return true;
        
    }
    return false;
};

const getPositionAfterMove = (pawn, rolledNumber) => {
    const { position, color } = pawn;
    const newPosition = position + rolledNumber;

    switch (color) {
        case 'red':
            if (newPosition <= 73) {
                if (position === 0) {
                    return 16; // Move to start position from base
                } else if (position < 67 && newPosition >= 67) {
                    return newPosition + 1; // Move past the last position
                }
                return newPosition; // Normal move
            }
            return position; // Cannot move beyond limit

        case 'blue':
            if (newPosition <= 79) {
                if (position === 4) {
                    return 55; // Move to start position from base
                } else if (position < 67 && newPosition > 67) {
                    return newPosition - 52; // Wrap around
                }
                return newPosition;
            }
            return position;

        case 'green':
            if (newPosition <= 85) {
                if (position === 8) {
                    return 42; // Move to start position from base
                } else if (position < 67 && newPosition > 67) {
                    return newPosition - 52; // Wrap around
                }
                return newPosition;
            }
            return position;

        case 'yellow':
            if (newPosition <= 85) {
                if (position === 12) {
                    return 29; // Move to start position from base
                } else if (position < 67 && newPosition > 67) {
                    return newPosition - 52; // Wrap around
                }
                return newPosition;
            }
            return position;

        default:
            return position; // Default case
    }
};

export default getPositionAfterMove;

module.exports = PawnSchema;
