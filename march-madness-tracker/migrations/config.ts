import { config } from 'dotenv';
import { join } from 'path';

config();

const migrationsConfig = {
    mongodb: {
        url: process.env.MONGODB_URI || 'mongodb://localhost:27017/march-madness',
        options: {},
    },
    migrationsDir: join(__dirname),
    changelogCollectionName: 'changelog',
    migrationFileExtension: '.ts',
    useFileHash: false,
};

export default migrationsConfig;
