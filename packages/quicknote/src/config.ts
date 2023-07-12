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
     * The singleton instance of the configuration.
     * @throws `ConfigException` if the configuration has not been initialized.
     * @see QuicknoteConfig.init()
     */
    static instance(): QuicknoteConfig {
        if (!QuicknoteConfig._instance) {
            throw new ConfigException('Quicknote config not initialized');
        }
        return QuicknoteConfig._instance;
    }

    /**
     * Performs a one-time initialization of the Quicknote library.
     *
     * @param cfgObj the configuration object - how this is sourced depends on the
     *               environment in which the library is used (might be a config stored
     *               as JSON in a file, or a YAML, or a response from a web service)
     * @param vars a map of variables used in the configuration.
     * @param reload if true, the configuration is reloaded even if it was already loaded.
     */
    static init(cfgObj: object, vars: {[key: string]: string} = {}, reload = false): QuicknoteConfig {
        if (!QuicknoteConfig._instance || reload) {
            QuicknoteConfig._instance = new QuicknoteConfig(cfgObj, vars);
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
        return QuicknoteConfig.requirePath(this.cfgObj, ['quicknote', 'connectors', name]);
    }

    /**
     * Returns the main configuration entry point for a specific sender.
     * @param name the name of the sender.
     * @return a configuration object for the sender.
     * @throws ConfigException if the configuration for the sender is not found.
     */
    configForSender(name: string): object {
        return QuicknoteConfig.requirePath(this.cfgObj, ['quicknote', 'senders', name]);
    }

    /**
     * Returns the main configuration entry point for a specific receiver.
     * @param name the name of the receiver.
     * @return a configuration object for the receiver.
     * @throws ConfigException if the configuration for the receiver is not found.
     */
    configForReceiver(name: string): object {
        return QuicknoteConfig.requirePath(this.cfgObj, ['quicknote', 'receivers', name]);
    }


    protected constructor(
        cfgObj: any,
        private vars: {[key: string]: string} = {})
    {
        if (log.isLevelEnabled(LogLevel.DEBUG)) {
            log.debug('Configuring the Quicknote library', cfgObj);
        }
        this.cfgObj = this._interpolator.interpolate(cfgObj, vars);
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

    private readonly cfgObj: any;
    private _interpolator: VariableInterpolator = new VariableInterpolator();
}

/**
 * A simple variable interpolator.
 * It replaces all occurrences of `${varName}` with the value of `varName` in the `vars` map.
 * If the variable is not found, the original string is left untouched.
 */
export class VariableInterpolator {
    /**
     * Interpolates the variables in the given object.
     * @param obj the object to interpolate - may be a string, an array or an object.
     * @param vars the map of variables to use for interpolation.
     */
    interpolate(obj: any, vars: {[key: string]: string}): any {
        return this.interpolateObject(obj, vars);
    }

    protected interpolateObject(obj: any, vars: {[key: string]: string}): any {
        if (typeof obj === 'string') {
            return this.interpolateString(obj, vars);
        }
        if (Array.isArray(obj)) {
            return obj.map((item) => this.interpolateObject(item, vars));
        }
        if (typeof obj === 'object') {
            const result: any = {};
            for (const key in obj) {
                if (obj.hasOwnProperty(key)) {
                    result[key] = this.interpolateObject(obj[key], vars);
                }
            }
            return result;
        }
        return obj;
    }

    protected interpolateString(str: string, vars: {[key: string]: string}): string {
        return str.replace(/\${(.*?)}/g, (match, name) => {
            return vars[name] || match;
        });
    }
}
