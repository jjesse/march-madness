// filepath: /march-madness-tracker/march-madness-tracker/src/models/team.ts
import mongoose from 'mongoose';

export interface TeamModel extends mongoose.Document {
    name: string;
    seed: number;
    region?: string;
    mascot?: string;
    abbreviation?: string;
}

const teamSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true,
        trim: true
    },
    seed: { 
        type: Number, 
        required: true,
        min: 1,
        max: 16
    },
    region: {
        type: String,
        enum: ['East', 'West', 'South', 'Midwest'],
        required: false
    },
    mascot: {
        type: String,
        required: false
    },
    abbreviation: {
        type: String,
        maxlength: 5,
        uppercase: true,
        required: false
    }
}, {
    timestamps: true
});

export const Team = mongoose.model<TeamModel>('Team', teamSchema);