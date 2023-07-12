/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */

import {Channel, ChannelState, Connector, Message, QuicknoteConfig, Receiver, Sender} from "@adamantic/quicknote";
import {ChannelException, ConfigException, NotImplemented} from "@adamantic/quicknote/lib/exceptions";
import logger from "@adamantic/quicknote/lib/logging";

import amqp from "amqplib";
import {BehaviorSubject} from "rxjs";

const log = logger('quicknote-amqp');

export async function connector(name: string, cfg: QuicknoteConfig): Promise<Connector> {
    log.info("Instantiating AMQP connector.");
    const cnn = new AmqpConnector(name);
    await cnn.initialize(cfg);
    return cnn;
}
export default connector;

class AmqpConnector implements Connector {

    constructor(
        public name_: string
    ) {

    }
    name(): string {
        return "amqp";
    }

    state$: BehaviorSubject<ChannelState> = new BehaviorSubject<ChannelState>(ChannelState.CLOSED);

    async initialize(cfg: QuicknoteConfig) {
        this._cfg = cfg.configForConnector(this.name());
        if (!this.config()['url']) {
            throw new Error(`Missing configuration parameter [url] for AMQP connector [${this.name()}].`);
        }
        this.connectionParams.url = this.config()['url'];
    }

    async close() {

        if (this.state$.value === ChannelState.CLOSED) {
            log.warn(`AMQP connector [${this.name()}] already closed.`);
            return;
        }

        log.info(`Closing AMQP connector [${this.name()}]`);
        for (let key in this.senders) {
            this.senders[key].close().catch((err) => {
                log.error(`Error closing sender [${this.senders[key].name()}]`, err);
            });
        }
        this.senders = {};

        for (let key in this.receivers) {
            this.receivers[key].close().catch((err) => {
                log.error(`Error closing receiver [${this.receivers[key].name()}]`, err);
            });
        }
        this.receivers = {};
        this.state$.next(ChannelState.CLOSED);
    }

    async open() {
        if (this.state$.value === ChannelState.OPEN) {
            log.warn(`AMQP connector [${this.name()}] already open.`);
            return;
        }
        this._conn = await amqp.connect(this.connectionParams.url);
        this._conn.on('close', () => {
            log.info(`AMQP connector [${this.name()}] - connection closed.`);
            if (this.state$.value !== ChannelState.CLOSED) {
                this.state$.next(ChannelState.CLOSED);
            }
        }) ;
        this._conn.on('error', (err) => {
            log.error(`AMQP connector [${this.name()}] - connection error: ${err.message}`, err);
            this.state$.next(ChannelState.ERROR);
        });

        this.state$.next(ChannelState.OPEN);
        log.info(`AMQP connector [${this.name()}] opened.`);
    }

    async receiver(name: string): Promise<Receiver> {
        if (this.receivers[name]) {
            if (this.receivers[name].state$.value === ChannelState.OPEN) {
                return this.receivers[name];
            }
            log.warn(`AMQP receiver [${name}] already exists but is not open - reopening.`);
            await this.receivers[name].close();
        }
        //const recv = await this.createReceiver(name);
        throw new NotImplemented("AMQP sender not implemented yet.");
        // TODO implement
        //this.receivers[name] = recv;
        //return recv;
    }

    async sender(name: string): Promise<Sender> {
        if (this.senders[name]) {
            if (this.senders[name].state$.value === ChannelState.OPEN) {
                return this.senders[name];
            }
            log.warn(`AMQP sender [${name}] already exists but is not open - reopening.`);
            await this.senders[name].close();
        }
        //const send = await this.createSender(name);
        throw new NotImplemented("AMQP sender not implemented yet.");
        // TODO implement
        //this.senders[name] = send;
        //return send;
    }

    /**
     * Spawns a new channel from the currently open connection.
     * Not intended for use outside the connector module
     * (it is actually used by the Sender and Receiver classes).
     */
    async spawnChannel(): Promise<amqp.Channel> {
        return await this.connection().createChannel();
    }


    /**
     * Returns the configuration for this connector.
     * @protected Internal use only.
     * @throws ConfigException if the connector has not been initialized.
     */
    protected config(): object {
        if (!this._cfg) {
            throw new ChannelException(`Connector [${this.name()}] not initialized - call initialize() first.`);
        }
        return this._cfg;
    }

    /**
     * Returns the connection for this connector.
     * @protected Internal use only.
     */
    protected connection(): amqp.Connection {
        if (!this._conn) {
            throw new ChannelException(`AMQP connector [${this.name()}] not connected - call open() first.`);
        }
        return this._conn;
    }

    private senders:   {[key:string]: Sender}   = {};
    private receivers: {[key:string]: Receiver} = {};
    private connectionParams = {
        url: '',
    }
    private _conn?: amqp.Connection;
    private _cfg?: object;

}

abstract class AmqpBaseChannel implements Channel {

    static readonly DEFAULT_DEST_TYPE = "queue";
    static readonly DEFAULT_DEST_DURABLE = true;


    protected _channel?: amqp.Channel;
    protected _destType: string;
    protected _destDurable: boolean;
    protected _destName: string;


    state$: BehaviorSubject<ChannelState> = new BehaviorSubject<ChannelState>(ChannelState.CLOSED);

    constructor(protected _name: string, protected _conn: AmqpConnector, protected _cfg: QuicknoteConfig) {
        const cfg = this.locateOwnConfig();
        this._destType = cfg['type'] || AmqpBaseChannel.DEFAULT_DEST_TYPE;
        this._destDurable = cfg['durable'] || AmqpBaseChannel.DEFAULT_DEST_DURABLE;
        this._destName = cfg['name'];
        if (!this._name) {
            throw new ConfigException(`Missing configuration parameter [name] for AMQP channel [${this.name()}].`);
        }
        this.ownInitialize();
    }

    /**
     * Performs the specific initialization for this channel (i.e. reading the config properties)
     */
    protected abstract ownInitialize();

    /**
     * Locate the configuration for this channel in the global configuration
     * @return the configuration for this channel
     * @throws ConfigException if the configuration is not found
     * @protected
     */
    protected abstract locateOwnConfig(): object;

    async close() {
        if (this.state$.value === ChannelState.CLOSED) {
            log.warn(`AMQP channel [${this.name()}] already closed.`);
            return;
        }
        if (this._channel) {
            try {
                await this._channel.close();
            } catch (err) {
                log.warn(`Error closing AMQP channel [${this.name()}]`, err);
            }
            this._channel = undefined;
        }
        this.state$.next(ChannelState.CLOSED);
    }

    name(): string {
        return this._name;
    }

    async open()  {
        if (this.state$.value === ChannelState.OPEN) {
            log.warn(`AMQP channel [${this.name()}] already open.`);
            return;
        }
        this._channel = await this._conn.spawnChannel();
        switch (this._destType) {
            case 'queue':
                await this._channel.assertQueue(this._destName, {durable: this._destDurable, autoDelete: false, exclusive: false});
                break;
            case 'topic':
                await this._channel.assertExchange(this._destName, 'topic', {durable: this._destDurable});
                break;
        }
        this.state$.next(ChannelState.OPEN);
    }

    protected channel(): amqp.Channel {
        if (!this._channel) {
            throw new ChannelException(`AMQP channel [${this.name()}] not open - call open() first.`);
        }
        return this._channel;
    }
}

class AmqpSender extends AmqpBaseChannel implements Sender {
    protected locateOwnConfig(): object {
        return this._cfg.configForReceiver(this.name());
    }

    protected ownInitialize() {
    }

    async send(message: Message) {
        throw new NotImplemented("AMQP sender not implemented yet.");
        // TODO check implementation
        switch (this._destType) {
            case 'queue':
                this.channel().sendToQueue(this._destName, Buffer.from(message.payload));
                break;
            case 'topic':
                this.channel().publish(this._destName, message.routing, Buffer.from(message.payload));
                break;
        }
    }

}
