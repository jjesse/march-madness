export class AppError extends Error {
    constructor(
        public statusCode: number,
        public message: string,
        public code?: string
    ) {
        super(message);
    }
}

export class ValidationError extends AppError {
    constructor(message: string) {
        super(400, message, 'VALIDATION_ERROR');
    }
}

export class AuthenticationError extends AppError {
    constructor(message: string) {
        super(401, message, 'AUTHENTICATION_ERROR');
    }
}
