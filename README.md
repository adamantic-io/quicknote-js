# Quicknote` Library for Typescript and Javascript

Quicknote is a library to help applications exchange messages 
using different protocols and formats.

Compared with its [Java](https://bitbucket.org/adamantic/quicknote-java/)
counterpart, this version has to make lighter assumptions regarding the
operating environment. For example, it does not assume the presence of
a file system or an application *environment* (so it doesn't try to auto-load)
its configuration from a file or from any other source - you, as a user,
are responsible for sourcing the configuration.

## Usage example

To send a message...
```typescript
import quicknote from 'quicknote';

const qn = quicknote();
qn.config({ /* ... config object ... */ });

const sender = quicknote().sender('my-sender');
sender.send(new Message().payload('Hello world!'));
```

To receive a message...
```typescript
import quicknote from 'quicknote';

const qn = quicknote();
qn.config({ /* ... config object ... */ });

const receiver = quicknote().receiver('my-receiver');
r.subscribe((message: Message) => {
    console.log(message.payload());
});
```

For more examples, see the [examples](examples) directory (TODO).
