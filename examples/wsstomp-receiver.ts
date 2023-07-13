/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */

import {ChannelState, Message, Quicknote} from "@adamantic/quicknote";


async function main() {
    const qn = Quicknote.instance();
    // @ts-ignore
    const config: any = await import('./quicknote-config.json');
    // @ts-ignore
    const vars: any = await import('./quicknote-vars.json');
    qn.config(config, vars);

    const receiver = await qn.receiver('wsstomptestreceiver');

    receiver.subscribe({
        next: (msg: Message) => {
            console.log('Received Quicknote message: ', msg);
            console.log('Payload as string: ', msg.payloadAsString);
            try {
                console.log('Payload as JSON:', msg.payloadAsJSON);
            } catch (e) {
                console.log('Payload is NOT a JSON');
            }
        }
    });

    console.log('Waiting for messages...');
    receiver.state$.subscribe((state) => {
        if (state === ChannelState.CLOSED) {
            console.log('Receiver closed, closing quicknote');
            qn.close();
        }});

    setTimeout(() => {
        console.log('Closing receiver...');
        receiver.close();
    }, 5000);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
