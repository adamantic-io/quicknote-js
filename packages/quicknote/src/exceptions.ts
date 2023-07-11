/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */


import {Message} from "./message";

/**
 * An enumeration of exception codes that facilitates
 * communication of error conditions across different
 * layers and components of a distributed system.
 * This is not meant to be used directly with base exceptions:
 * its values are injected by specialized exceptions in the base
 * class and are generally available through the `getCode()` method.
 */
export enum ExceptionCode {
    /**
     * Configuration exception
     */
    CFG_EXCEPTION = 'CFG_EXCEPTION',

    /**
     * Feature not implemented
     */
    FTR_NOTIMPL = 'FTR_NOTIMPL',

    /**
     * Channel not found
     */
    CHN_NOTFOUND = 'CHN_NOTFOUND',

    /**
     * Message time-to-live expired
     */
    MSG_TTLEXP = 'MSG_TTLEXP',
}

/**
 * Base class for all exceptions in Quicknote.
 * It features a `code` property that can be used for better M2M communication
 */
export class QuicknoteException extends Error {

    /**
     * Creates a new exception with the given code, message and cause.
     * @param code The code of the exception - useful for M2M communication
     * @param message The exception message (standard in the JS world)
     * @param cause The cause of the exception, if any.
     */
    constructor(
        public readonly code: ExceptionCode,
        message?: string,
        public readonly cause?: Error
    ) {
        super(message ?? ExceptionCode[code]);
    }

}

/**
 * Base class for business exceptions - i.e. all exceptions that the application
 * should be prepared to handle as a business failure.
 * Most times, business exceptions indicate that the failure condition is permanent
 * if repair actions are not taken, and thus the application should not retry without
 * having a remediation strategy.
 */
export class BusinessException extends QuicknoteException {
    /* Inherit everything from parent */
}

/**
 * Base class for all system-level exceptions.
 * These are exceptions that are not caused by the user (business) logic, but by the system itself
 * (e.g. configuration errors, network errors, etc.).
 * In some circumstances, a system exception may disappear if the operation is retried
 * (e.g. a network error may be transient) - but the application should know how to handle each
 * specific system exception.
 */
export class SystemException extends QuicknoteException {
    /* Inherit everything from parent */
}


/**
 * Exception thrown when a channel is not found.
 */
export class ChannelNotFound extends BusinessException {

    /**
     * Constructor specifying the name of the channel that was not found.
     * @param name the name of the channel that was not found.
     * @param message The exception message (standard in the JS world)
     * @param cause The cause of the exception, if any.
     */
    constructor(
        public readonly name: string,
        message?: string,
        cause?: Error)
    {
        super(ExceptionCode.CHN_NOTFOUND, message, cause);
    }
}

/**
 * Exception thrown when a configuration error is detected.
 */
export class ConfigException extends SystemException {

    /**
     * Constructor specifying the message and cause of the exception.
     * @param message The exception message (standard in the JS world)
     * @param cause The cause of the exception, if any.
     */
    constructor (
        message?: string,
        cause?: Error)
    {
        super(ExceptionCode.CFG_EXCEPTION, message, cause);
    }
}

/**
 * Exception thrown when a feature is not implemented.
 */
export class NotImplemented extends BusinessException {

    /**
     * Constructor specifying the name of the channel that is not implemented.
     * @param name the name of the feature that is not implemented.
     * @param message The exception message (standard in the JS world)
     * @param cause The cause of the exception, if any.
     */
    constructor(
        public readonly name: string,
        message?: string,
        cause?: Error)
    {
        super(ExceptionCode.FTR_NOTIMPL, message, cause);
    }
}


/**
 * Exception thrown when a message has expired its time-to-live.
 */
export class TimeToLiveExpired extends SystemException {

    /**
     * Constructor specifying the message that has expired.
     * @param m the message that has expired.
     */
    constructor(m: Message) {
        super(ExceptionCode.MSG_TTLEXP, `Message ${m.id} has expired its time-to-live`);
    }

}
