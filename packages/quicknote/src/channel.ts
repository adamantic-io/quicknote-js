/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */


import {Message} from "./message";
import {BehaviorSubject, Observer, Subscribable, Unsubscribable} from "rxjs";
import {QuicknoteConfig} from "./config";
import log from "loglevel";
import { ConfigException } from "./exceptions";

/**
 * Simple representation of the state of a channel
 * @author Domenico Barra - domenico@adamantic.io
 */
export enum ChannelState {
    /**
     * The channel is closed, it cannot transport data.
     */
    CLOSED,

    /**
     * The channel is open, it can be used to communicate.
     */
    OPEN,

    /**
     * The channel is in an error state, it cannot transport data until some remediation
     * action is taken (e.g. closing and reopening, or other repair actions).
     */
    ERROR
}

/**
 * Represents a channel for sending or receiving messages.
 * While nothing prevents having full-duplex channels, we generally find
 * it more useful to have separate channels for sending and receiving messages.
 * This interface is used to abstract the underlying transport protocol.
 * @author Domenico Barra - domenico@adamantic.io
 */
export interface Channel {
    /**
     * The name of the channel. This is used to identify the channel in the system,
     * configuration, and logs.
     * @return the name of the channel.
     */
    name(): string;

    /**
     * Opens the channel for sending or receiving messages.
     * @throws `IOException` if the channel cannot be opened.
     */
    open(): Promise<void>;

    /**
     * Closes the channel.
     * It is a requirement that this method be idempotent and not throw any exceptions.
     */
    close(): Promise<void>;

    /**
     * The state of the channel.
     */
    state$: BehaviorSubject<ChannelState>;
}

/**
 * Waits for a channel to reach a specific state.
 * @param channel the channel to wait for
 * @param state the state to wait for
 * @param timeoutMs the timeout in milliseconds, defaults to 30000 (30 seconds)
 */
export async function waitForState(channel: Channel, state: ChannelState, timeoutMs: number = 30000): Promise<void> {
    const p = new Promise<void> ( (resolve, reject) => {
        if (channel.state$.value === state) {
            resolve();
            return;
        }
        const sub = channel.state$.subscribe((s) => {
            if (s === state) {
                resolve();
                sub.unsubscribe();
            }
        });
        setTimeout(() => {
            reject(`Timeout waiting for state ${ChannelState[state]}`);
            sub.unsubscribe();
        }, timeoutMs);
    });
    return p;
}


/**
 * Represents a channel to send messages to a remote destination.
 */
export interface Sender extends Channel {

    /**
     * Sends a message through the channel to a remote destination.
     * @param message the message to send
     * @throws `IOException` if the message cannot be sent
     */
    send(message: Message): Promise<void>;
}

/**
 * Represents a channel to receive messages from a remote source.
 * Using the RXJS library.
 */
export interface Receiver extends Channel, Subscribable<Message> {

    /**
     * Creates a new subscription for incoming messages over a specific routing key (optional).
     * @param observer the observer that will receive the messages.
     * @param routing the routing key to filter messages, if any. If not specified, all messages will be received.
     */
    subscribe(observer: Partial<Observer<Message>>, routing?: string): Unsubscribable;

}


/**
 * Handles connection details to specific remote relays,
 * along with policies for connection pooling, channel reuse, etc.
 * Every Quicknote plug-in module should have its connector.
 */
export interface Connector extends Channel {

    /**
     * Performs the connector initialization.
     * After this method returns, the connector is supposed to
     * be ready to create connections.
     * @param cfg the configuration object.
     * @throws ConfigException if the configuration is invalid.
     * @throws SystemException if the connector cannot be initialized.
     */
    initialize(cfg: QuicknoteConfig): Promise<void>;

    /**
     * Returns a sender with the given name.
     * A connector may perform channel pooling, lazy initialization, etc.
     * Specific policies are implementation-dependent.
     *
     * @param name the name of the sender to retrieve.
     * @return the sender, ready to operate.
     * @throws ChannelNotFound if the sender cannot be instantiated and/or is unavailable.
     */
    sender(name: string): Promise<Sender>;

    /**
     * Returns a receiver with the given name.
     * A connector may perform channel pooling, lazy initialization, etc.
     * Specific policies are implementation-dependent.
     *
     * @param name the name of the receiver to retrieve.
     * @return the receiver, ready to operate.
     * @throws ChannelNotFound if the receiver cannot be instantiated and/or is unavailable.
     */
    receiver(name: string): Promise<Receiver>;

}


/**
 * Central registry of connector plugin factories.
 */
 const REGISTERED_PLUGINS: {[name: string]: (name: string, cfg: QuicknoteConfig) => Promise<Connector>} = {};

/**
 * Registers a new connector plugin through its factory function
 * @param type the type of the connector
 * @param factory the 
 */
export function registerConnectorPlugin(type: string, factory: (name: string, cfg: QuicknoteConfig) => Promise<Connector>) {
    REGISTERED_PLUGINS[type] = factory;
    log.info('Registered connector plugin for type: ' + type);
}

/**
 * Loads a connector by name. The connector configuration is fetched, and the `type` property is used
 * if a registered plugin factory is available. Otherwise, the name is used as a direct match for the
 * registered plugin factory.
 * @param name The name of the connector to load
 * @returns a promise that resolves to the connector instance
 */
export async function loadConnector(name: string): Promise<Connector> {
    log.info(`Loading connector ${name}`);
    const cfg = QuicknoteConfig.instance().configForConnector(name);
    const connType = cfg['type'];
    if (connType && REGISTERED_PLUGINS[cfg['type']]) {
        log.info(`Instantiating connector [${name}] of type [${connType}] through registered factory`);
        return REGISTERED_PLUGINS[cfg['type']](name, QuicknoteConfig.instance());
    }
    if (REGISTERED_PLUGINS[name]) {
        log.info(`Instantiating connector [${name}] through registered factory - direct name match`);
        return REGISTERED_PLUGINS[name](name, QuicknoteConfig.instance());
    }
    else throw new ConfigException(`No registered factory for connector [${name}] - use 'registerConnectorPlugin' to register a factory`);
    // TODO: find a webpack-friendly way to load plugins through dynamic module import
}
