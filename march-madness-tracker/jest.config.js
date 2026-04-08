module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': 'ts-jest',
  },
  globals: {
    'ts-jest': {
      tsconfig: '<rootDir>/tests/tsconfig.json',
    },
  },
  clearMocks: true,
  resetMocks: true,
  restoreMocks: true,
  testTimeout: 10000,
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/app.ts',
    '!src/config/**',
    '!src/types/**',
  ],
};
