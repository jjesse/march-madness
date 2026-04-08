require('dotenv').config();
const path = require('path');

module.exports = {
  mongodb: {
    url: process.env.MONGODB_URI || 'mongodb://localhost:27017/march-madness',
    options: {},
  },
  migrationsDir: path.join(__dirname, 'migrations'),
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.ts',
  useFileHash: false,
};
