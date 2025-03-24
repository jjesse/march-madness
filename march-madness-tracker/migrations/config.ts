import { config } from 'dotenv';
import { join } from 'path';

config();

const migrationsConfig = {
    mongodb: {
        url: process.env.MONGODB_URI,
        options: {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        },
        migrations: {
            path: join(__dirname, './migrations'),
            pattern: /\.ts$/,
        },
    },
};

export default migrationsConfig;
