/*
 * Copyright (c) 2023 by Adamantic S.r.l.
 * This file is part of a software library licensed under the
 * GNU Lesser General Public License (LGPL) version 3.
 * Please refer to the `LICENSE` file contained in the project
 * root directory for more information.
 */

import {ChannelState, Message, Quicknote} from "@adamantic/quicknote";

import readline from "readline";



async function main(receiverName: string) {
    const qn = Quicknote.instance();
    // @ts-ignore
    const config: any = await import('./quicknote-config.json');
    // @ts-ignore
    const vars: any = await import('./quicknote-vars.json');
    qn.config(config, vars);

    const receiver = await qn.receiver(receiverName);

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

    receiver.state$.subscribe((state) => {
        if (state === ChannelState.CLOSED) {
            console.log('Receiver closed, closing quicknote');
            qn.close();
        }});


    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    const prompt = (query) => new Promise((resolve) => rl.question(query, resolve));

    while (true) {
        const cmd = await prompt('Waiting for messages... (type \'quit\' to quit): ');
        if (cmd === 'quit') {
            break;
        }
    }

    console.log('Closing receiver...');
    await receiver.close();

}

// read the first program argument (position 2 in argv array)
const receiverName = process.argv[2];
if (!receiverName) {
    console.error('Please specify a receiver name as first argument');
    process.exit(1);
}

main(receiverName).catch((err) => {
    console.error(err);
    process.exit(1);
});
