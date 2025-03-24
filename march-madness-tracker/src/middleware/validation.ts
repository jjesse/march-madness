import { Request, Response, NextFunction } from 'express';
import { ValidationError } from '../types/errors';
import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';

export function validateRequest(type: any) {
    return async (req: Request, res: Response, next: NextFunction) => {
        const dto = plainToClass(type, req.body);
        const errors = await validate(dto);
        
        if (errors.length > 0) {
            const message = errors.map(error => Object.values(error.constraints)).join(', ');
            next(new ValidationError(message));
        }
        
        req.body = dto;
        next();
    };
}
