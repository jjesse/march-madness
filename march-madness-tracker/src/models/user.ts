import mongoose from 'mongoose';

export interface UserModel {
    id: string;
    email: string;
    password: string;
    username: string;
    brackets: string[];
}

const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    username: { type: String, required: true },
    brackets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bracket' }]
});

export const User = mongoose.model<UserModel>('User', userSchema);
