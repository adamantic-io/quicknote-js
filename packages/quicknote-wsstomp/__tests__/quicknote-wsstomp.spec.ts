import {Quicknote} from "@adamantic/quicknote";


describe('quicknote-wsstomp',  () => {
    test('should be able to instantiate a quicknote-wsstomp connector', async () => {
        const cfgFile = await import('./wsstomp-sample-config.json');
        const qn = Quicknote.instance();
        const cfg = await qn.config(cfgFile);
        const cnn = await qn.connector('wsstomptest')
        expect(cnn).toBeDefined();
    });

    test('should be able to instantiate a quicknote-wsstomp sender', async () => {
        const cfgFile = await import('./wsstomp-sample-config.json');
        const qn = Quicknote.instance();
        const cfg = await qn.config(cfgFile);
        const sender = await qn.sender('wsstomptestsender');
        expect(sender).toBeDefined();
    });

    test('should be able to instantiate a quicknote-wsstomp receiver', async () => {
        const cfgFile = await import('./wsstomp-sample-config.json');
        const qn = Quicknote.instance();
        const cfg = await qn.config(cfgFile);
        const receiver = await qn.receiver('wsstomptestreceiver');
        expect(receiver).toBeDefined();
    });
});
