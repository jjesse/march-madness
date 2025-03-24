import mongoose from 'mongoose';

export type GameStatus = 'not started' | 'in progress' | 'completed';

export interface GameModel extends mongoose.Document {
    id: string;
    teamA: string;
    teamB: string;
    scoreA: number;
    scoreB: number;
    status: GameStatus;
    round: number;
    region: string;
    winnerId?: string;
    startTime: Date;
    bracketId: mongoose.Types.ObjectId;
    userPick?: string;
    pickStatus?: 'correct' | 'incorrect' | 'pending';
}

const gameSchema = new mongoose.Schema({
    id: String,
    teamA: String,
    teamB: String,
    scoreA: { 
        type: Number, 
        min: 0,
        validate: {
            validator: Number.isInteger,
            message: 'Score must be an integer'
        }
    },
    scoreB: Number,
    status: String,
    round: Number,
    region: String,
    winnerId: String,
    startTime: Date,
    bracketId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Bracket',
        required: true
    },
    userPick: { type: String },
    pickStatus: { 
        type: String, 
        enum: ['correct', 'incorrect', 'pending'],
        default: 'pending'
    }
});

export const Game = mongoose.model<GameModel>('Game', gameSchema);