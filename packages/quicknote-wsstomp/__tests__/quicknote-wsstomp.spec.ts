import logger from "@adamantic/quicknote/lib/logging";
import quicknote, {ChannelState, Message, Quicknote} from "@adamantic/quicknote";
// @ts-ignore
import qnWsStomp from "../src/quicknote-wsstomp";

const log = logger('quicknote-wsstomp.spec');

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
            await cnn.close();
            await qn.close();
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
            await sender.close();
            await qn.close();
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
            await receiver.close();
            await qn.close();
        }
    });

    test('should be able to send and receive a message', async () => {
       // @ts-ignore
        const cfgFile = await import('./wsstomp-sample-config.json');
         const qn = Quicknote.instance();
            const cfg = qn.config(cfgFile);
            const sender = await qn.sender('wsstomptestsender');
            const receiver = await qn.receiver('wsstomptestreceiver');
            try {

                await sleep(1000);
                const p = new Promise<void> ( (resolve, reject) => {
                    // @ts-ignore
                    receiver.subscribe({ next: (msg: Message) => {
                        log.info('Received message', msg);
                        resolve();
                    }});
                    setTimeout(reject, 5000);
                });


                const msg = await sender.send(
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

                // expect that p resolves
                await p;
            } finally {
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
        await sleep(1000);

        qn.config(configFile2, undefined, true);
        const cnn2 = await qn.connector('wsstomptest');
        const sender2 = await qn.sender('wsstomptestsender');
        const receiver2 = await qn.receiver('wsstomptestreceiver');

        await sleep(1000);

        expect(cnn1).not.toBe(cnn2);
        expect(sender).not.toBe(sender2);
        expect(receiver).not.toBe(receiver2);

        expect(receiver.state$.value).toBe(ChannelState.CLOSED);
        expect(sender.state$.value).toBe(ChannelState.CLOSED);
        expect(receiver2.state$.value).toBe(ChannelState.OPEN);
        expect(sender2.state$.value).toBe(ChannelState.OPEN);
        await quicknote().close();
    });
});
