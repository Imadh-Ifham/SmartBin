module.exports = {
<<<<<<< Updated upstream
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverageFrom: [
    "src/modules/**/models/**/*.ts",
    "src/modules/**/repositories/**/*.ts",
    "src/modules/**/services/**/*.ts",
    "!**/*.test.ts",
  ],
  coverageDirectory: "coverage",
=======
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  collectCoverageFrom: ['src/modules/policies/**/*.{ts,tsx}'],
  coverageDirectory: 'coverage',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
>>>>>>> Stashed changes
};
