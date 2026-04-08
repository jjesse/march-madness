import mongoose from 'mongoose';

export type UserRole = 'user' | 'admin';

export interface UserModel extends mongoose.Document {
    id: string;
    email: string;
    password: string;
    username: string;
    role: UserRole;
    brackets: string[];
}

const userSchema = new mongoose.Schema(
    {
        email: { type: String, required: true, unique: true, trim: true, lowercase: true },
        password: { type: String, required: true, select: false },
        username: { type: String, required: true, unique: true, trim: true },
        role: {
            type: String,
            enum: ['user', 'admin'],
            default: 'user'
        },
        brackets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bracket' }]
    },
    {
        timestamps: true
    }
);

export const User = mongoose.model<UserModel>('User', userSchema);
