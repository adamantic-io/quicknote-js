import { quicknoteAmqp } from '..';
import assert from 'assert/strict'

assert.strictEqual(quicknoteAmqp(), 'Hello from quicknote-amqp');
console.info('quicknote-amqp tests passed');
