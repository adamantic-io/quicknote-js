import {Quicknote} from "@adamantic/quicknote";
import qnAmqp from "../src/quicknote-amqp";

describe('Quicknote AMQP', () => {
    Quicknote.instance().registerConnectorPlugin('amqp', qnAmqp);

    test('No-op', () => {
        expect(true).toBe(true);
    });

    test('Connector loading', async () => {
        const quicknote = Quicknote.instance();
        const cfg = quicknote.config({
            quicknote: {
                connectors: {
                    amqp: {
                        type: 'amqp',
                        url: 'amqp://localhost:5672'
                    }
                }
            }
        });
        const cnn = await quicknote.connector('amqp');
        expect(cnn).toBeDefined();
    })
});
