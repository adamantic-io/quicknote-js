/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */

import {ConfigException, NotImplemented} from "./exceptions";

export { QuicknoteConfig } from "./config";
export { ChannelState, Channel, Sender, Receiver, Connector } from "./channel";
export { Message, IDGenerator, DefaultIDGenerator } from "./message";

import { v4 as uuidV4 } from "uuid";
import {Connector, loadConnector, Receiver, Sender} from "./channel";
import logger from "./logging";
import {QuicknoteConfig} from "./config";


/**
 * Entry point for the Quicknote library.
 */
export class Quicknote {

    static instance(): Quicknote {
        if (!Quicknote._instance) {
            Quicknote._instance = new Quicknote();
        }
        return Quicknote._instance;
    }

    config(config: object, vars: {[key:string]:string} = {}, reload = false): QuicknoteConfig {
        this._cfg = QuicknoteConfig.init(config, vars, reload);
        return this._cfg;
    }

    async sender(name: string): Promise<Sender> {
        const c = this.cfg().configForSender(name);
        const cnn = await this.connector(c['connector']);
        return cnn.sender(name);
    }

    async receiver(name: string): Promise<Receiver> {
        const c = this.cfg().configForReceiver(name);
        const cnn = await this.connector(c['connector']);
        return cnn.receiver(name);
    }

    async connector(name: string): Promise<Connector> {
        var cnn = this._connectors[name];
        if (!cnn) {
            cnn = await loadConnector(name);
            await cnn.open();
            this._connectors[name] = cnn;
        }
        return cnn;
    }

    get clientId(): string {
        return this._clientId;
    }

    set clientId(value: string) {
        this._clientId = value;
    }

    async close() {
        this._log.warn('Quicknote is shutting down...');
        for (const cnn of Object.values(this._connectors)) {
            try { await cnn.close(); }
            catch (e) { this._log.error(`Error while closing connector ${cnn.name()}.`, e); }
        }
        this._connectors = {};
        Quicknote._instance = undefined;
        this._log.info('Quicknote shutdown complete.');
    }
    private cfg(): QuicknoteConfig {
        if (!this._cfg) {
            throw new ConfigException('Quicknote not initialized. Call Quicknote.config() first.');
        }
        return this._cfg;
    }

    protected constructor() {
        this._log.info('Initializing Quicknote');
    }

    private _log = logger('Quicknote');
    private _clientId = uuidV4();
    private _connectors: {[name: string]: Connector} = {};
    private _cfg?: QuicknoteConfig;



    private static _instance?: Quicknote;

}

const quicknote = () => Quicknote.instance()
export default quicknote;
