/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    moduleFileExtensions  : ['ts', 'tsx', 'js', 'jsx', 'json'],
    testPathIgnorePatterns: ['/test/']
};