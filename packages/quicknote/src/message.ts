/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */


/**
 * A generator of unique identifiers. You can (and should) provide your own
 * implementation of this interface to generate identifiers that are unique.
 * Quicknote is set to use integers as identifiers.
 */
export type IDGenerator = {

    /**
     * Returns the next unique identifier.
     * @returns the next unique identifier
     */
    nextId(): number;
}

/**
 * The default implementation of the IDGenerator interface. It generates
 * identifiers as integers starting from 1. This implementation is not
 * recommended for production use as it doesn't rely on any kind of
 * persistence and it's not cluster-safe.
 */
export class DefaultIDGenerator implements IDGenerator {
    private static _nextId: number = 1;

    nextId() {
        return DefaultIDGenerator._nextId++;
    }
}

/**
 * A message is a piece of information that is sent from a publisher through
 * a channel. In Quicknote terminology, the message is sent by a
 * `Sender` and received by a `Receiver`.
 */
export class Message {

    /**
     * Default routing key for messages
     */
    static DEFAULT_ROUTING = '/';

    /**
     * Default content type for messages
     */
    static DEFAULT_CONTENT_TYPE = 'text/plain';

    /**
     * Default headers for messages
     */
    static DEFAULT_HEADERS = { };

    /**
     * Default payload for messages
     */
    static DEFAULT_PAYLOAD = Uint8Array.from([]);

    /**
     * Default time to live for messages
     */
    static DEFAULT_TTL = 16;

    static DEFAULT_ID_GENERATOR: IDGenerator = new DefaultIDGenerator();


    /**
     * The unique identifier of the message
     */
    id = Message.DEFAULT_ID_GENERATOR.nextId();

    /**
     * The content type of the message
     */
    contentType = Message.DEFAULT_CONTENT_TYPE;

    /**
     * The headers of the message
     */
    headers = Message.DEFAULT_HEADERS;

    /**
     * The payload of the message
     */
    payload = Message.DEFAULT_PAYLOAD;

    /**
     * The routing key of the message
     */
    routing = Message.DEFAULT_ROUTING;

    /**
     * The time to live of the message
     */
    ttl = Message.DEFAULT_TTL;


}
