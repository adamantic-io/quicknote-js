import logger from "@adamantic/quicknote/lib/logging";
import quicknote, {ChannelState, Message, Quicknote, Receiver} from "@adamantic/quicknote";
// @ts-ignore
import qnWsStomp from "../src/quicknote-wsstomp";
import {waitForState} from "@adamantic/quicknote/lib/channel";
import {Subscription} from "rxjs";

const log = logger('quicknote-wsstomp.spec');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const receiveMessage = (receiver: Receiver, timeoutMs: number) => new Promise<Message> ( (resolve, reject) => {
    const sub = receiver.subscribe({ next: (msg: Message) => {
            log.info('Received message', msg);
            resolve(msg);
            sub.unsubscribe();
        }});
    setTimeout(() => {
        reject(new Error('Timed out while waiting for message'));
        sub.unsubscribe();
    }, timeoutMs);
});



describe('quicknote-wsstomp',  () => {
    Quicknote.instance().registerConnectorPlugin('wsstomp', qnWsStomp);

    test('should be able to instantiate a quicknote-wsstomp connector', async () => {
        // @ts-ignore
        const cfgFile = await import('./wsstomp-sample-config.json');
        const qn = Quicknote.instance();
        const cfg = await qn.config(cfgFile);
        const cnn = await qn.connector('wsstomptest');
        try {
            expect(cnn).toBeDefined();
        } finally {
            await qn.close();
            await waitForState(cnn, ChannelState.CLOSED);
        }
    });

    test('should be able to instantiate a quicknote-wsstomp sender', async () => {
        // @ts-ignore
        const cfgFile = await import('./wsstomp-sample-config.json');
        const qn = Quicknote.instance();
        const cfg = await qn.config(cfgFile);
        const sender = await qn.sender('wsstomptestsender');
        try {
            expect(sender).toBeDefined();
        } finally {
            await qn.close();
            await waitForState(sender, ChannelState.CLOSED);
        }
    });

    test('should be able to instantiate a quicknote-wsstomp receiver', async () => {
        // @ts-ignore
        const cfgFile = await import('./wsstomp-sample-config.json');
        const qn = Quicknote.instance();
        const cfg = await qn.config(cfgFile);
        const receiver = await qn.receiver('wsstomptestreceiver');
        try {
            expect(receiver).toBeDefined();
        } finally {
            await qn.close();
            await waitForState(receiver, ChannelState.CLOSED);
        }
    });

    test('should be able to send and receive a message', async () => {
       // @ts-ignore
        const cfgFile = await import('./wsstomp-sample-config.json');
         const qn = Quicknote.instance();
            const cfg = qn.config(cfgFile);
            const sender = await qn.sender('wsstomptestsender');
            const receiver = await qn.receiver('wsstomptestreceiver');
            const sendTimer = setInterval(async () => {
                await (await qn.sender('wsstomptestsender')).send(
                    new Message(
                        {
                            payloadAsString: 'hello world',
                            contentType: 'text/plain',
                            routing: '',
                            ttl: 1000,
                            id: 1,
                            headers: {
                                'my-header': 'my-value'
                            }
                        }));
            }, 2000);

            try {
                await waitForState(receiver, ChannelState.OPEN, 3000);
                await receiveMessage(receiver, 3000);
            } finally {
                clearInterval(sendTimer);
                await quicknote().close();
            }
    });

    test("Should reinstantiate a connector if the config changes", async () => {
        const configFile1 = await import('./wsstomp-sample-config.json');
        const configFile2 = await import('./wsstomp-sample-config-c.json');
        const qn = Quicknote.instance();
        qn.config(configFile1);
        const cnn1 = await qn.connector('wsstomptest');
        const sender = await qn.sender('wsstomptestsender');
        const receiver = await qn.receiver('wsstomptestreceiver');

        receiver.state$.subscribe((state) => {
            log.info('Receiver state changed: ', ChannelState[state]);
        });
        await waitForState(receiver, ChannelState.OPEN, 5000);

        qn.config(configFile2, undefined, true);
        await waitForState(receiver, ChannelState.CLOSED, 5000);

        const cnn2 = await qn.connector('wsstomptest');
        const sender2 = await qn.sender('wsstomptestsender');
        const receiver2 = await qn.receiver('wsstomptestreceiver');


        expect(cnn1).not.toBe(cnn2);
        expect(sender).not.toBe(sender2);
        expect(receiver).not.toBe(receiver2);

        expect(receiver.state$.value).toBe(ChannelState.CLOSED);
        expect(sender.state$.value).toBe(ChannelState.CLOSED);
        expect(receiver2.state$.value).toBe(ChannelState.OPEN);
        expect(sender2.state$.value).toBe(ChannelState.OPEN);
        await quicknote().close();
        await waitForState(sender, ChannelState.CLOSED);
        await waitForState(receiver, ChannelState.CLOSED);
        await waitForState(sender2, ChannelState.CLOSED);
        await waitForState(receiver2, ChannelState.CLOSED);
    });

    test("Should behave consistently across reconfigures", async () => {
        const configFile1 = await import('./wsstomp-sample-config.json');
        const configFile2 = await import('./wsstomp-sample-config-c.json');
        const qn = Quicknote.instance();
        qn.config(configFile1);
        const sendTimer = setInterval(async () => {
            await (await qn.sender('wsstomptestsender')).send(
                new Message(
                    {
                        payloadAsString: 'hello world',
                        contentType: 'text/plain',
                        routing: '',
                        ttl: 1000,
                        id: 1,
                        headers: {
                            'my-header': 'my-value'
                        }
                    }));
        }, 2000);
        try {
            const holder = {
                receiverSub: null as Subscription | null,
                closeDetector: async (state: ChannelState) => {
                    log.info('Receiver state changed: ', ChannelState[state]);
                    if (state === ChannelState.CLOSED) {
                        log.info("Detected closed receiver, resubscribing");
                        holder.receiverSub?.unsubscribe();
                        holder.receiverSub = (await qn.receiver('wsstomptestreceiver'))
                            .state$.subscribe(holder.closeDetector);
                    }
                }
            }
            let receiver = await qn.receiver('wsstomptestreceiver');
            holder.receiverSub = receiver.state$.subscribe(holder.closeDetector);

            await waitForState(receiver, ChannelState.OPEN);
            await receiveMessage(receiver,10000);

            qn.config(configFile2, undefined, true);
            receiver = await qn.receiver('wsstomptestreceiver');
            await waitForState(receiver, ChannelState.OPEN, 5000);

            await receiveMessage(receiver, 10000);

        } finally {
            clearInterval(sendTimer);
            await quicknote().close();
        }
    });

});
