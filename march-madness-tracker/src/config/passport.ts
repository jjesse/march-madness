import passport from 'passport';
import { Strategy as JwtStrategy, ExtractJwt, StrategyOptions } from 'passport-jwt';
import { User } from '../models/user';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) {
    throw new Error('JWT_SECRET environment variable is required');
}

const options: StrategyOptions = {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: jwtSecret,
    algorithms: ['HS256'],
    ...(process.env.JWT_ISSUER ? { issuer: process.env.JWT_ISSUER } : {}),
    ...(process.env.JWT_AUDIENCE ? { audience: process.env.JWT_AUDIENCE } : {})
};

passport.use(
    new JwtStrategy(options, async (jwtPayload, done) => {
        try {
            const user = await User.findById(jwtPayload.id).select('-password');
            if (user) {
                return done(null, user);
            }
            return done(null, false);
        } catch (error) {
            return done(error, false);
        }
    })
);

export default passport;
