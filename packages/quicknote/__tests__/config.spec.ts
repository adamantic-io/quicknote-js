import {QuicknoteConfig, VariableInterpolator} from "../src/config";

describe('VariableInterpolator', () => {
    // check that the VariableInterpolator interpolates a string correctly
    test('VariableInterpolator string', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate('${foo}', vars);
        expect(result).toBe('bar');
    });

    // check that the VariableInterpolator interpolates an object correctly
    test('VariableInterpolator object', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate({'foo': '${foo}'}, vars);
        expect(result).toEqual({'foo': 'bar'});
    });

    // check that the VariableInterpolator interpolates an array correctly
    test('VariableInterpolator array', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate(['${foo}'], vars);
        expect(result).toEqual(['bar']);
    });

    // check that the VariableInterpolator interpolates a nested object correctly
    test('VariableInterpolator nested object', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate({'foo': {'bar': '${foo}'}}, vars);
        expect(result).toEqual({'foo': {'bar': 'bar'}});
    });

    // check that the VariableInterpolator interpolates a nested array correctly
    test('VariableInterpolator nested array', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate([{'foo': '${foo}'}], vars);
        expect(result).toEqual([{'foo': 'bar'}]);
    });

    // check that the VariableInterpolator interpolates a nested array of objects correctly
    test('VariableInterpolator nested array of objects', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate([{'foo': [{'bar': '${foo}'}]}], vars);
        expect(result).toEqual([{'foo': [{'bar': 'bar'}]}]);
    });

    // check that the VariableInterpolator interpolates a nested object of arrays correctly
    test('VariableInterpolator nested object of arrays', () => {
        const vi = new VariableInterpolator();
        const vars = {
            'foo': 'bar'
        };
        const result = vi.interpolate({'foo': [{'bar': '${foo}'}]}, vars);
        expect(result).toEqual({'foo': [{'bar': 'bar'}]});
    });
});

describe('QuicknoteConfig', () => {

    // check that the QuicknoteConfig singleton is instantiated correctly
    test('QuicknoteConfig singleton', () => {
        const q1 = QuicknoteConfig.init({}, {}, false);
        const q2 = QuicknoteConfig.init({}, {}, false)
        expect(q1).toBe(q2);
    });

    // check that the QuicknoteConfig singleton is reloaded with reload=true
    test('QuicknoteConfig singleton reload', () => {
        const q1 = QuicknoteConfig.init({}, {}, false);
        const q2 = QuicknoteConfig.init({}, {}, true)
        expect(q1).not.toBe(q2);
    });

    // check that the connector config is loaded correctly and interpolated
    test('QuicknoteConfig connector', () => {
        const q = QuicknoteConfig.init({
            'quicknote': {
                'connectors': {
                    'foo': {
                        'type': 'amqp',
                        'url': 'amqp://${foo}'
                    }
                }
            }
        }, {'foo': 'bar'}, false);
        const config = q.configForConnector('foo');
        expect(config).toEqual({
            'type': 'amqp',
            'url': 'amqp://bar'
        });
    });

    // check that the sender config is loaded correctly and interpolated
    test('QuicknoteConfig sender', () => {
        const q = QuicknoteConfig.init({
            'quicknote': {
                'senders': {
                    'foo': {
                        'type': 'amqp',
                        'url': 'amqp://${foo}'
                    }
                }
            }
        }, {'foo': 'bar'}, false);
        const config = q.configForSender('foo');
        expect(config).toEqual({
            'type': 'amqp',
            'url': 'amqp://bar'
        });
    });

    // check that the receiver config is loaded correctly and interpolated
    test('QuicknoteConfig receiver', () => {
        const q = QuicknoteConfig.init({
            'quicknote': {
                'receivers': {
                    'foo': {
                        'type': 'amqp',
                        'url': 'amqp://${foo}'
                    }
                }
            }
        }, {'foo': 'bar'}, false);
        const config = q.configForReceiver('foo');
        expect(config).toEqual({
            'type': 'amqp',
            'url': 'amqp://bar'
        });
    });
});
