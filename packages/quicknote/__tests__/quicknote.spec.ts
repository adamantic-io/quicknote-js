import { quicknote } from '..';
import assert from 'assert/strict'
import logger from "../src/logging";

const log = logger('quicknote-amqp.spec.ts');
assert.strictEqual(quicknote(), quicknote());
log.info('quicknote tests passed');
