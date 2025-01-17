/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */

import log, {LogLevelDesc} from "loglevel";

/**
 * A logger factory is responsible for creating loggers.
 * Users of the Quicknote library can provide their own implementation of this
 * interface to use a different logging library.
 * @see setLoggerFactory
 */
export interface LoggerFactory {
    getLogger(name: string): Logger;
}

/**
 * Representation of the logging levels used in the lib
 */
export enum LogLevel {
    TRACE,
    DEBUG,
    INFO,
    WARN,
    ERROR,
    SILENT,
}

/**
 * The standard logger interface used by Quicknote.
 * It is "enough" standard to be compatible with a few logging libraries.
 * Users of the Quicknote library can provide their own implementation of this
 * interface to use a different logging system
 * @see setLoggerFactory
 */
export interface Logger {
    isLevelEnabled(level: LogLevel): boolean;
    trace(message: string, ...args: any[]): void;
    debug(message: string, ...args: any[]): void;
    info(message: string, ...args: any[]): void;
    warn(message: string, ...args: any[]): void;
    error(message: string, ...args: any[]): void;
}

/**
 * Returns a logger with the given name through the current logger factory.
 * This is the entry point to logging used by Quicknote.
 * @param name the name of the logger.
 */
export default function logger (name: string) : Logger {
    return loggerFactory.getLogger(name);
}

/**
 * Replaces the currently installed logger factory with the given one.
 * @param factory the new logger factory.
 */
export function setLoggerFactory(factory: LoggerFactory) {
    loggerFactory = factory;
}

/*
 * Private implementation Part
 */


/**
 * A logger factory that uses the loglevel library.
 */
class LoglevelSimpleLogFactory implements LoggerFactory {
    constructor(props: {defaultLevel: LogLevelDesc}) {
        log.setDefaultLevel(props.defaultLevel);
    }

    getLogger(name: string): Logger {
        const _log = log.getLogger(name);
        return {
            isLevelEnabled(level: LogLevel): boolean {
                return _log.getLevel() <= level;
            },
            trace(message: string, ...args: any[]): void {
                _log.trace(message, ...args);
            },
            debug(message: string, ...args: any[]): void {
                _log.debug(message, ...args);
            },
            info(message: string, ...args: any[]): void {
                _log.info(message, ...args);
            },
            warn(message: string, ...args: any[]): void {
                _log.warn(message, ...args);
            },
            error(message: string, ...args: any[]): void {
                _log.error(message, ...args);
            }
        };
    }
}

/**
 * The default logger factory.
 */
let loggerFactory: LoggerFactory = new LoglevelSimpleLogFactory(
    { defaultLevel: log.levels.INFO }
);

