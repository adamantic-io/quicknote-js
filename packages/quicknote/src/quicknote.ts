/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */

import {NotImplemented} from "./exceptions";

export { ChannelState, Channel } from "./channel";
export { Message, IDGenerator, DefaultIDGenerator } from "./message";

import { v4 as uuidv4 } from "uuid";
import {Receiver, Sender} from "./channel";
import logger from "./logging";


export const quicknote = () => Quicknote.instance()

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

    async sender(name: string): Promise<Sender> {
        throw new NotImplemented('Quicknote.sender()');
    }

    async receiver(name: string): Promise<Receiver> {
        throw new NotImplemented('Quicknote.receiver()');
    }
/*
    async connector(name: string): Promise<Connector> {
        throw new NotImplemented('Quicknote.connector()');
    }

 */
    get clientId(): string {
        return this._clientId;
    }

    set clientId(value: string) {
        this._clientId = value;
    }



    protected constructor() {
        this.log.info('Initializing Quicknote');
    }

    private log = logger('Quicknote');
    private _clientId = uuidv4();

    private static _instance: Quicknote;

}
