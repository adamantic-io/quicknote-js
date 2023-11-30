/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest', testEnvironment: 'node', verbose: true, projects: [{
        preset: 'ts-jest',
        testEnvironment: 'node',
        displayName: 'quicknote',
        testMatch: ['<rootDir>/packages/quicknote/__tests__/**/*.spec.ts']
    }, {
        preset: 'ts-jest',
        testEnvironment: 'node',
        displayName: 'quicknote-amqp',
        testMatch: ['<rootDir>/packages/quicknote-amqp/__tests__/**/*.spec.ts']
    }, {
        preset: 'ts-jest',
        testEnvironment: 'node',
        displayName: 'quicknote-wsstomp',
        testMatch: ['<rootDir>/packages/quicknote-wsstomp/__tests__/**/*.spec.ts']
    }]
};
