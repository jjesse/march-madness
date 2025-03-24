import mongoose from 'mongoose';
import { GameModel } from './game';

export interface BracketModel {
    id: string;
    name: string;
    userId: string;
    year: number;
    games: GameModel[];
    totalPoints: number;
    isPublic: boolean;
}

const bracketSchema = new mongoose.Schema({
    name: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    year: { type: Number, required: true },
    games: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Game' }],
    totalPoints: { type: Number, default: 0 },
    isPublic: { type: Boolean, default: false }
});

export const Bracket = mongoose.model<BracketModel>('Bracket', bracketSchema);
