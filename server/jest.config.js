module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  roots: ["<rootDir>/src"],
  collectCoverageFrom: [
    "**/model/**/*.ts",
    "**/repository/**/*.ts",
    "**/service/**/*.ts",
    "!**/*.test.ts",
  ],
  coverageDirectory: "coverage",
};
