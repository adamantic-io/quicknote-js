/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */


import {Message} from "./message";

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
     * @throws IOException if the channel cannot be opened.
     */
    open(): void;
    close(): void;
    send(m: Message): void;
}
