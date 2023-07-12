/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
    preset: 'ts-jest', testEnvironment: 'node', verbose: true, projects: [{
        preset: 'ts-jest',
        testEnvironment: 'node',
        displayName: 'quicknode',
        testMatch: ['<rootDir>/packages/quicknote/__tests__/**/*.spec.ts']
    }, {
        preset: 'ts-jest',
        testEnvironment: 'node',
        displayName: 'quicknode-amqp',
        testMatch: ['<rootDir>/packages/quicknote-amqp/__tests__/**/*.spec.ts']
    }, {
        preset: 'ts-jest',
        testEnvironment: 'node',
        displayName: 'quicknode-wsstomp',
        testMatch: ['<rootDir>/packages/quicknote-wsstomp/__tests__/**/*.spec.ts']
    }]
};
