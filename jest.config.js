/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    // Mock CSS/asset imports if they were to be added in the future
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
};
