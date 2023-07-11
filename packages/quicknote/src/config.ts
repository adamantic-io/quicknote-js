/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */
import logger, {LogLevel} from "./logging";

const log = logger('QuicknoteConfig');

export class QuicknoteConfig {

    static init(cfgObj: any): QuicknoteConfig {
        if (!QuicknoteConfig._instance) {
            QuicknoteConfig._instance = new QuicknoteConfig(cfgObj);
        }
        return QuicknoteConfig._instance;
    }

    constructor(private cfgObj: any) {
        if (log.isLevelEnabled(LogLevel.DEBUG)) {
            log.debug('Configuring the Quicknote library', cfgObj);
        }
    }

    private static _instance: QuicknoteConfig;
}
