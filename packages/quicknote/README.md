# `@adamantic/quicknote`
A library to easily exchange messages across different languages
and protocols - Javascript / Typescript version.

## Compatibility
This library is designed to be used in Node.js and in the browser.
However, cross-support is a work-in-progress.

## Installation
In order to install the library, run the following command:
```
npm install @adamantic/quicknote
```
You also need to install the specific package for the protocol you want to use, for example:
```
npm install @adamantic/quicknote-wsstomp
```

## Usage
Here's an example of how to configure the library:
```typescript
    import { Quicknote, ChannelState, Message } from '@adamantic/quicknote';
    
    const qn = Quicknote.instance();
    
    /*
     * The config and vars objects can be sourced however you
     * prefer - if in a browser, you can fetch them from a remote server,
     * if in Node.js, you can read them from a file, etc.
     */
    const config: any = await import('./quicknote-config.json');
    const vars: any = await import('./quicknote-vars.json');
    
    /*
     * Configuring the library
     */
    qn.config(config, vars);
```

Once configured, you can use the library to receive messages:
```typescript
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
```

Or you can send messages:
```typescript
    const sender = await qn.sender('wsstomptestsender');
    await sender.send(
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
```

Please refer to the documentation (work-in-progress) for more details.
