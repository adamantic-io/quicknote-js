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
    static readonly DEFAULT_ROUTING = '/';

    /**
     * Default content type for messages
     */
    static readonly DEFAULT_CONTENT_TYPE = 'text/plain';

    /**
     * Default headers for messages
     */
    static readonly DEFAULT_HEADERS = { };

    /**
     * Default payload for messages
     */
    static readonly DEFAULT_PAYLOAD = Uint8Array.from([]);

    /**
     * Default time to live for messages
     */
    static readonly DEFAULT_TTL = 16;

    /**
     * Default ID generator for messages - replace it with your own implementation
     */
    static idGenerator = new DefaultIDGenerator()

    /**
     * The unique identifier of the message
     */
    id = 0;

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

    /**
     * Delegates the generation of a new message ID to the installed ID generator
     * @returns the next unique identifier
     */
    static nextId() {
        return this.idGenerator.nextId();
    }

    /**
     * Creates a new message, initializing it with the given properties
     * @param props the properties to initialize the message with. Please note that you can
     *              use the `payloadAsString`, `payloadAsJSON`, or `payload` properties to
     *              initialize the message payload.
     * @returns a new message
     */
    constructor(props: Partial<Omit<Message, 'payload'> & (
        { payloadAsString: string } |
        { payloadAsJSON: string } |
        { payload: Uint8Array } )> = {}
    ) {
        if (!props.id) {
            props.id = Message.nextId();
        }
        Object.assign(this, props);
    }
    
    get payloadAsString(): string {
        return Message.textDecoder.decode(this.payload);
    }
    
    set payloadAsString(value: string) {
        this.payload = Message.textEncoder.encode(value);
    }
    
    get payloadAsJSON(): any {
        return JSON.parse(this.payloadAsString);
    }

    set payloadAsJSON(value: any) {
        this.payloadAsString = JSON.stringify(value);
    }

    private static textEncoder = new TextEncoder();
    private static textDecoder = new TextDecoder();

}
