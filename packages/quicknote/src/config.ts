/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */
import logger, {LogLevel} from "./logging";
import {ConfigException} from "./exceptions";

const log = logger('QuicknoteConfig');

/**
 * Quicknote main configuration class.
 */
export class QuicknoteConfig {

    /**
     * Performs a one-time initialization of the Quicknote library.
     *
     * @param cfgObj the configuration object - how this is sourced depends on the
     *               environment in which the library is used (might be a config stored
     *               as JSON in a file, or a YAML, or a response from a web service)
     * @param reload if true, the configuration is reloaded even if it was already loaded.
     */
    static init(cfgObj: object, reload = false): QuicknoteConfig {
        if (!QuicknoteConfig._instance || reload) {
            QuicknoteConfig._instance = new QuicknoteConfig(cfgObj);
        }
        return QuicknoteConfig._instance;
    }

    /**
     * Returns the main configuration entry point for a specific connector.
     * @param name the name of the connector.
     * @return a configuration object for the connector.
     * @throws ConfigException if the configuration for the connector is not found.
     */
    configForConnector(name: string): object {
        return QuicknoteConfig.requirePath(this.cfgObj, ['connectors', name]);
    }

    /**
     * Returns the main configuration entry point for a specific sender.
     * @param name the name of the sender.
     * @return a configuration object for the sender.
     * @throws ConfigException if the configuration for the sender is not found.
     */
    configForSender(name: string): object {
        return QuicknoteConfig.requirePath(this.cfgObj, ['senders', name]);
    }

    /**
     * Returns the main configuration entry point for a specific receiver.
     * @param name the name of the receiver.
     * @return a configuration object for the receiver.
     * @throws ConfigException if the configuration for the receiver is not found.
     */
    configForReceiver(name: string): object {
        return QuicknoteConfig.requirePath(this.cfgObj, ['receivers', name]);
    }


    protected constructor(private cfgObj: any) {
        if (log.isLevelEnabled(LogLevel.DEBUG)) {
            log.debug('Configuring the Quicknote library', cfgObj);
        }
    }

    private static requirePath(cfg: any, path: string[]): any {
        const next = path.shift();
        if (!next) {
            throw new ConfigException('Path is empty.');
        }
        if (cfg[next]) {
            if (path.length > 0) {
                return QuicknoteConfig.requirePath(cfg[next], path);
            }
            return cfg[next];
        }
        throw new ConfigException(`Configuration path ${path.join('.')} not found`);
    }

    private static _instance: QuicknoteConfig;
}
