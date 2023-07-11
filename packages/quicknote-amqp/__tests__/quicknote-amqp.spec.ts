import { quicknoteAmqp } from '..';
import { quicknote } from "@adamantic/quicknote";
import assert from 'assert/strict'

assert.strictEqual(quicknoteAmqp(), 'Hello from quicknote-amqp');
console.info('quicknote-amqp tests passed');

assert.strictEqual(quicknote(), 'Hello from quicknote');
console.info('quicknote tests passed');
