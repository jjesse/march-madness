import mongoose from 'mongoose';

export interface ScoreboardModel extends mongoose.Document {
    userId: mongoose.Types.ObjectId;
    username: string;
    totalCorrect: number;
    totalPoints: number;
    bracketId: mongoose.Types.ObjectId;
    year: number;
    rank?: number;
    roundScores: {
        round: number;
        correct: number;
        points: number;
    }[];
}

const scoreboardSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    username: { type: String, required: true },
    totalCorrect: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    bracketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Bracket', required: true },
    year: { type: Number, required: true },
    rank: Number,
    roundScores: [{
        round: Number,
        correct: Number,
        points: Number
    }]
});

export const Scoreboard = mongoose.model<ScoreboardModel>('Scoreboard', scoreboardSchema);
