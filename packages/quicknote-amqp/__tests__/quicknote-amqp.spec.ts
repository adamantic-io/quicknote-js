import { quicknoteAmqp } from '..';
import { quicknote } from "@adamantic/quicknote";
import assert from 'assert/strict'

import logger from "@adamantic/quicknote/src/logging";
const log = logger('quicknote-amqp.spec.ts');

assert.strictEqual(quicknoteAmqp(), 'Hello from quicknote-amqp');
log.info('quicknote-amqp tests passed');

assert.strictEqual(quicknote(), quicknote());
log.info('quicknote tests passed');
