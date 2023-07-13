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


export async function loadConnector(name: string): Promise<Connector> {
    log.info(`Loading connector ${name}`);
    const cfg = QuicknoteConfig.instance().configForConnector(name);
    const moduleName = moduleNameForConnector(name, cfg);
    // check if module is available
    const module = await import(moduleName);
    return module.connector(name, QuicknoteConfig.instance());
}

const moduleNameForConnector = (name: string, cfg: any): string => {
    let moduleName = cfg['module'];
    if (!moduleName) {
        log.debug(`No 'module' specified for connector [${name}], trying 'type'`);
        let connType = cfg['type'];
        if (!connType) {
            log.debug(`No 'type' specified for connector [${name}], using default`);
            connType = name;
        }
        moduleName = '@adamantic/quicknote-' + connType;
        log.info(`Deduced module name for connector [${name}]: ${moduleName}`);
    }
    return moduleName;
}
