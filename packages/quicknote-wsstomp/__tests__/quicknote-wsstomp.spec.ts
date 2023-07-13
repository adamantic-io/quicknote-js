import logger from "@adamantic/quicknote/lib/logging";
import quicknote, {Message, Quicknote} from "@adamantic/quicknote";

const log = logger('quicknote-wsstomp.spec');

describe('quicknote-wsstomp',  () => {
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
        }
    });

    test('should be able to send and receive a message', async () => {
       // @ts-ignore
        const cfgFile = await import('./wsstomp-sample-config.json');
         const qn = Quicknote.instance();
            const cfg = await qn.config(cfgFile);
            const sender = await qn.sender('wsstomptestsender');
            const receiver = await qn.receiver('wsstomptestreceiver');
            try {

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
});
