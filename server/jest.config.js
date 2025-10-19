module.exports = {
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
};
