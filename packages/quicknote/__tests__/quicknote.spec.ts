import { quicknote } from '..';
import assert from 'assert/strict'
import logger from "../src/logging";
import {QuicknoteConfig} from "../src/config";

const log = logger('quicknote-amqp.spec.ts');
QuicknoteConfig.init({ amqp: { url: 'amqp://localhost' } });
assert.strictEqual(quicknote(), quicknote());
log.info('quicknote tests passed');
