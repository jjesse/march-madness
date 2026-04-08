declare global {
    namespace Express {
        interface User {
            id: string;
            email?: string;
            username?: string;
            role?: 'user' | 'admin';
        }
        interface Request {
            user?: User;
            id?: string;
        }
    }
}

export {};
