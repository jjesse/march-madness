// filepath: /march-madness-tracker/march-madness-tracker/src/models/tournament.ts
import mongoose from 'mongoose';
import { GameModel } from './game';

export interface TournamentModel extends mongoose.Document {
    year: number;
    name: string;
    games: GameModel[];
    status: 'upcoming' | 'in-progress' | 'completed';
    startDate: Date;
    endDate: Date;
}

const tournamentSchema = new mongoose.Schema({
    year: {
        type: Number,
        required: true,
        unique: true,
        min: 1939 // First NCAA tournament
    },
    name: {
        type: String,
        required: true,
        default: function(this: any) {
            return `NCAA Men's Basketball Tournament ${this.year}`;
        }
    },
    games: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Game'
    }],
    status: {
        type: String,
        enum: ['upcoming', 'in-progress', 'completed'],
        default: 'upcoming'
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, {
    timestamps: true
});

// Index for efficient queries
tournamentSchema.index({ year: 1 });
tournamentSchema.index({ status: 1 });

export const Tournament = mongoose.model<TournamentModel>('Tournament', tournamentSchema);