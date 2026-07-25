/**
 * Jest configuration for the API server.
 * Uses ts-jest in CommonJS mode so jest.mock() works without
 * the experimental-vm-modules flag required by native ESM Jest.
 */
module.exports = {
  preset: "ts-jest",
  testEnvironment: "node",
  // Override module resolution to compile TypeScript to CJS for test runs
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        tsconfig: {
          module: "commonjs",
          esModuleInterop: true,
          allowSyntheticDefaultImports: true,
        },
      },
    ],
  },
  testMatch: ["**/__tests__/**/*.test.ts"],
  // Strip .js extensions from relative imports so ts-jest resolves the .ts source
  moduleNameMapper: {
    "^(\\.{1,2}/.*)\\.js$": "$1",
    // Resolve workspace packages to their TypeScript source directly
    "^@workspace/api-zod$":
      "<rootDir>/../../lib/api-zod/src/index.ts",
  },
  // Clear call history between tests but keep mockImplementation intact.
  // (resetMocks would wipe mockImplementation, breaking the isAxiosError setup.)
  clearMocks: true,
};
