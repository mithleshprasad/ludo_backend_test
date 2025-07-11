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
    console.warn("starting point", this.basePos)

    if (this.position !== this.getPositionAfterMove(rolledNumber) && this.position !== this.basePos) {
        return true;
        
    }
    return false;
};
PawnSchema.methods.getPositionAfterMove = function (rolledNumber) {
    const { position, color } = this;
    const finalposition= rolledNumber+position;
    if (color === 'red' && (finalposition >= 67 && position <= 72)) {
        return 73; 
    }
    switch (color) {
        case 'red':
            if (position + rolledNumber <= 73) {
                if (position >= 0 && position <= 3) {
                    return 16;
                } else if (position <= 66 && position + rolledNumber >= 67) {
                    return position + rolledNumber + 1;
                } else {
                    return position + rolledNumber;
                }
            } else {
                return position;
            }
        case 'blue':
            if (position + rolledNumber <= 79) {
                if (position >= 4 && position <= 7) {
                    return 55;
                } else if (position <= 67 && position + rolledNumber > 67) {
                    return position + rolledNumber - 52;
                }
                
                // else if (position <= 53 && position + rolledNumber >= 54) {
                //     return position + rolledNumber + 20;
                // } 
                
                else if (position <= 53 && position + rolledNumber >= 54) {
                    return 79;
                } 
                
                else {
                    return position + rolledNumber;
                }
            } else {
                return position;
            }
        case 'green':
            if (position + rolledNumber <= 85) {
                if (position >= 8 && position <= 11) {
                    return 42;
                } else if (position <= 67 && position + rolledNumber > 67) {
                    return position + rolledNumber - 52;
                } else if (position <= 40 && position + rolledNumber >= 41) {
                    return 85;
                } 
                else {
                    return position + rolledNumber;
                }
            } else {
                return position;
            }
        case 'yellow':
            if (position + rolledNumber <= 85) {
                if (position >= 12 && position <= 15) {
                    return 29;
                } else if (position <= 67 && position + rolledNumber > 67) {
                    return position + rolledNumber - 52;
                } 
                
                // else if (position <= 27 && position + rolledNumber >= 28) {
                //     return position + rolledNumber + 58;
                // } 
                else if (position <= 27 && position + rolledNumber >= 28) {
                    return 91;
                } 
                else {
                    return position + rolledNumber;
                }
            } else {
                return position;
            }
        default:
            return position;
    }
};


// PawnSchema.methods.getPositionAfterMove = function (rolledNumber) {
//     const { position, color } = this;
//     const finalposition= rolledNumber+position;
//     if (color === 'red' && (finalposition >= 67 && position <= 72)) {
//         return 73; // Automatically move red pawn to 73
//     }
//     // if (color === 'green' && (position >= 80 && position <= 84)) {
//     //     return 85; // Automatically move green pawn to 85
//     // }
  
//     console.warn("starting", position);

//     switch (color) {
//         case 'red':
//             if (position + rolledNumber <= 73) {
//                 if (position >= 0 && position <= 3) {
//                     return 16;
//                 } else if (position <= 66 && position + rolledNumber >= 67) {
//                     return position + rolledNumber + 1;
//                 } else {
//                     return position + rolledNumber;
//                 }
//             } else {
//                 return position;
//             }
//         case 'blue':
//             if (position + rolledNumber <= 79) {
//                 if (position >= 4 && position <= 7) {
//                     return 55;
//                 } else if (position <= 67 && position + rolledNumber > 67) {
//                     return position + rolledNumber - 52;
//                 } else if (position <= 53 && position + rolledNumber >= 54) {
//                     return position + rolledNumber + 20;
//                 } else {
//                     return position + rolledNumber;
//                 }
//             } else {
//                 return position;
//             }

//         case 'green':
//             if (position + rolledNumber <= 85) {
//                 if (position >= 8 && position <= 11) {
//                     return 42;
//                 } else if (position <= 67 && position + rolledNumber > 67) {
//                     return position + rolledNumber - 52;
//                 } else if (position <= 40 && position + rolledNumber >= 41) {
//                     return 85;
//                 } 
//                 else {
//                     return position + rolledNumber;
//                 }
//             } else {
//                 return position;
//             }
//         case 'yellow':
//             if (position + rolledNumber <= 85) {
//                 if (position >= 12 && position <= 15) {
//                     return 29;
//                 } else if (position <= 67 && position + rolledNumber > 67) {
//                     return position + rolledNumber - 52;
//                 } else if (position <= 27 && position + rolledNumber >= 28) {
//                     return position + rolledNumber + 58;
//                 } else {
//                     return position + rolledNumber;
//                 }
//             } else {
//                 return position;
//             }
//         default:
//             return position;
//     }
// };










module.exports = PawnSchema;
