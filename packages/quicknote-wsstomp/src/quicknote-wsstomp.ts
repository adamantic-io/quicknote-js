// instantiate websocket client from the 'ws' library or from the browser depending on the environment.

import {Channel, ChannelState, Connector, Message, QuicknoteConfig, Receiver, Sender} from '@adamantic/quicknote';
import logger, {LogLevel} from "@adamantic/quicknote/lib/logging";
import {BehaviorSubject, Observer, Unsubscribable} from "rxjs";
import {Client as StompClient, Message as StompMessage, StompSubscription} from "@stomp/stompjs";

const log = logger('quicknote-wsstomp');

if (typeof window !== 'undefined' && typeof window.document !== 'undefined') {
    log.info("Running in browser context, not importing ws.");
} else {
    log.info("Not in browser (probably nodejs), importing ws.");
    global.WebSocket = require('ws');
}


export async function connector(name: string, cfg: QuicknoteConfig): Promise<Connector> {
    log.info("Instantiating WS-STOMP connector.");
    const cnn = new WsstompConnector(name);
    await cnn.initialize(cfg);
    return cnn;
}

export default connector;

class WsstompConnector implements Connector {

    state$: BehaviorSubject<ChannelState> = new BehaviorSubject<ChannelState>(ChannelState.CLOSED);
    stompClient?: StompClient;

    constructor(
        public name_: string
    ) {}

    async initialize(cfg: QuicknoteConfig) {
        this._cfg = cfg;
        const myCfg = cfg.configForConnector(this.name());
        this.properties = {
            url: this.getOrFail('url', myCfg),
            username: myCfg['username'] || '',
            password: myCfg['password'] || '',
            reconnectDelay: parseInt(myCfg['reconnectDelay'] || '5000'),
            heartbeatIncoming: parseInt(myCfg['heartbeatIncoming'] || '0'),
        }
    }

    async close() {

        if (this.state$.value === ChannelState.CLOSED) {
            log.warn(`WS-STOMP connector [${this.name()}] already closed.`);
            return;
        }

        try {
            log.info(`Closing WS-STOMP connector [${this.name()}]`);
            await this.closeAllSendersAndReceivers();
            await this.stompClient?.deactivate();
        } catch (err) {
            log.error(`Error closing WS-STOMP connector [${this.name()}]`, err);
        }
        this.state$.next(ChannelState.CLOSED);
    }

    async open() {
        if (this.state$.value === ChannelState.OPEN) {
            log.warn(`WS-STOMP connector [${this.name()}] already open.`);
            return;
        }
        log.info(`Opening WS-STOMP connector [${this.name()}]`);
        this.stompClient = new StompClient({
            brokerURL: this.properties.url,
            connectHeaders: {
                login: this.properties.username,
                passcode: this.properties.password,
            },
            debug: (str) => {
                log.debug(str);
            },
            reconnectDelay: this.properties.reconnectDelay,
            heartbeatIncoming: this.properties.heartbeatIncoming
        });
        this.stompClient.onConnect = async (frame) => {
            log.info(`WS-STOMP connector [${this.name()}] connected.`);
            // this also occurs when reconnecting, so we have to close all senders and receivers
            // and re-open them.
            await this.recoverSubscriptionsAfterReconnect();
            this.state$.next(ChannelState.OPEN);
        }
        this.stompClient.onDisconnect = (frame) => {
            log.info(`WS-STOMP connector [${this.name()}] disconnected.`);
            this.state$.next(ChannelState.CLOSED);
        }
        this.stompClient.onStompError = (frame) => {
            log.error(`WS-STOMP connector [${this.name()}] error.`, frame);
            this._lastError = frame;
            this.state$.next(ChannelState.ERROR);
        }
        this.stompClient.onWebSocketError = (evt) => {
            log.error(`WS-STOMP connector [${this.name()}] websocket error.`, evt);
            this._lastError = evt;
            this.state$.next(ChannelState.ERROR);
        }
        return new Promise<void>((resolve, reject) => {
            this.state$.subscribe((state) => {
                if (state === ChannelState.OPEN) {
                    resolve();
                } else if (state === ChannelState.ERROR) {
                    reject(this.lastError() || `Error opening WS-STOMP connector [${this.name()}]`);
                }
            });
            this.stompClient!.activate();
        });
    }

    async receiver(name: string): Promise<Receiver> {
        if (this.receivers[name]) {
            if (this.receivers[name].state$.value === ChannelState.OPEN) {
                return this.receivers[name];
            }
            log.warn(`WS-STOMP receiver [${name}] already exists but is not open - reopening.`);
            await this.receivers[name].close();
        }
        const recv = new WsStompReceiver(name, this.stompClient!, this._cfg!);
        await recv.open();
        this.receivers[name] = recv;
        return recv;
    }

    protected async closeAllSendersAndReceivers() {
        // await in a promise.all
        try {
            const promises: Promise<any>[] = [];

            for (let key in this.senders) {
                promises.push(this.senders[key].close());
            }
            this.senders = {};

            for (let key in this.receivers) {
                promises.push(this.receivers[key].close());
            }
            this.receivers = {};
            await Promise.all(promises);
        } catch (err) {
            log.error(`Error closing all senders and receivers`, err);
        }
    }

    protected async recoverSubscriptionsAfterReconnect() {
        try {
            log.info(`Connector [${this.name()}] recovering subscriptions after reconnect.`);
            const promises: Promise<any>[] = [];

            for (let key in this.receivers) {
                promises.push(this.receivers[key].recoverAfterReconnect());
            }
            await Promise.all(promises);
        } catch (err) {
            log.error(`Error recovering subscriptions`, err);
        }
    }

    async sender(name: string): Promise<Sender> {
        if (this.senders[name]) {
            if (this.senders[name].state$.value === ChannelState.OPEN) {
                return this.senders[name];
            }
            log.warn(`WS-STOMP sender [${name}] already exists but is not open - reopening.`);
            await this.senders[name].close();
        }
        const send = new WsStompSender(name, this.stompClient!, this._cfg!);
        await send.open();
        this.senders[name] = send;
        return send;
    }

    name(): string {
        return this.name_;
    }

    lastError(): any {
        return this._lastError;
    }

    getOrFail(key: string, map: any): any {
        if (!map[key]) {
            throw new Error(`Missing configuration parameter [${key}] for WS-STOMP connector [${this.name()}].`);
        }
        return map[key];
    }

    private _cfg?: QuicknoteConfig;
    private _ws: any;
    private _lastError?: any;
    private properties: {[key: string]: any } = {};
    private senders: { [key: string]: WsStompSender } = {};
    private receivers: { [key: string]: WsStompReceiver } = {};

}

abstract class WsStompBaseChannel implements Channel {
    /*
     * The STOMP client is rather simple to manage, so it's easy to
     * implement both sender and receiver in the same class.
     */
    state$: BehaviorSubject<ChannelState> = new BehaviorSubject<ChannelState>(ChannelState.CLOSED);
    _destination: string;
    constructor(
        private   _name: string,
        protected _stompClient: StompClient,
        protected _config: QuicknoteConfig)
    {
        this._destination = this.getOrFail('dest', this.locateOwnConfig());
    }

    name(): string {
        return this._name;
    }

    /**
     * Recover subscriptions after a disconnect / reconnect.
     */
    async recoverAfterReconnect() { }

    abstract open(): Promise<void>;
    abstract close(): Promise<void>;


    protected abstract locateOwnConfig(): any;

    protected getOrFail(key: string, map: any): any {
        if (!map[key]) {
            throw new Error(`Missing configuration parameter [${key}] for WS-STOMP channel [${this.name()}].`);
        }
        return map[key];
    }
}

class WsStompSender extends WsStompBaseChannel implements Sender {
    protected locateOwnConfig(): any {
        return this._config.configForSender(this.name());
    }

    async open(): Promise<void> {
        log.debug(`Opening WS-STOMP sender [${this.name()}] - currently a NOOP`);
        if (this.state$.value !== ChannelState.OPEN) {
            this.state$.next(ChannelState.OPEN)
        }
    }
    async close(): Promise<void> {
        log.debug(`Closing WS-STOMP sender [${this.name()}] - currently a NOOP`);
        if (this.state$.value !== ChannelState.CLOSED) {
            this.state$.next(ChannelState.CLOSED)
        }
    }

    async send(message: Message) {
        log.debug(`Sending message to WS-STOMP sender [${this.name()}]`);
        const destination = message.routing ? this._destination + message.routing : this._destination;
        this._stompClient.publish({
            destination,
            binaryBody: message.payload,
            headers: {
                ...message.headers,
                routing_key: message.routing || '',
            },
        });
    }
}


class SubscriptionDescriptor {
    constructor(
        public destination: string,
        public sub: StompSubscription | null,
        public observer: Partial<Observer<Message>>,
        public routing?: string,
    ) { }

}

class WsStompReceiver extends WsStompBaseChannel implements Receiver {
    private stompSubs: SubscriptionDescriptor[] = [];

    protected locateOwnConfig(): any {
        return this._config.configForReceiver(this.name());
    }

    subscribe(observer: Partial<Observer<Message>>, routing?: string): Unsubscribable {
        const destination = routing ? this._destination + routing : this._destination;
        const desc = new SubscriptionDescriptor(destination, null, observer, routing);
        this.attachSubscription(desc);
        this.stompSubs.push(desc);
        return desc.sub!;
    }

    async recoverAfterReconnect() {
        for (let desc of this.stompSubs) {
            log.info(`Recovering subscription to [${desc.destination}] on WS-STOMP receiver [${this.name()}]`);
            if (desc.sub) {
                try { await desc.sub.unsubscribe(); } catch (err) { log.error(`Error unsubscribing from [${desc.destination}]`, err); }
            }
            this.attachSubscription(desc);
        }
    }

    attachSubscription(desc: SubscriptionDescriptor) {
        const sub = this._stompClient.subscribe(this._destination, (message: StompMessage) => {

            if (log.isLevelEnabled(LogLevel.TRACE)) {
                log.trace(`Received message on WS-STOMP receiver [${this.name()}]`, message);
            }
            if (desc.observer.next) { // pushing to observer via event loop
                setTimeout(() => desc.observer.next!(this.stompToQuicknoteMessage(message, { routing: desc.routing })), 0);
            }
        });
        desc.sub = sub;
        log.info(`Subscribed to [${desc.destination}] on WS-STOMP receiver [${this.name()}] with id [${sub.id}]`);
    }

    stompToQuicknoteMessage(message: StompMessage, additionalProps: object = {}): Message {
        const strid = message.headers['amqp-message-id'] || message.headers['message_id']
            || message.headers['message-id'] || message.headers['id'];
        let id = 0;
        if (strid !== undefined) {
            id = parseInt(strid, 10);
            if (isNaN(id)) {
                id = Message.nextId();
            }
        }
        const contentType = message.headers['content-type'] || Message.DEFAULT_CONTENT_TYPE;

        const msg = {
            headers: message.headers,
            payload: message.binaryBody,
        };

        const initProps = {
            ...additionalProps,
            id,
            contentType,
            payload: message.binaryBody,
            headers: message.headers,
        }
        if (message.headers['routing_key']) {
            initProps['routing'] = message.headers['routing_key'];
        }
        return new Message(initProps);
    }

    async open(): Promise<void> {
        log.debug(`Opening WS-STOMP receiver [${this.name()}] - currently a NOOP`);
        if (this.state$.value !== ChannelState.OPEN) {
            this.state$.next(ChannelState.OPEN)
        }
    }
    async close(): Promise<void> {
        log.debug("Closing all subscriptions on WS-STOMP receiver [${this.name()}]");
        for (let desc of this.stompSubs) {
            if (desc.sub) {
                log.debug(`Unsubscribing from [${desc.sub.id}] on WS-STOMP receiver [${this.name()}]`);
                try { desc.sub.unsubscribe(); }
                catch (err) {
                    log.warn(`Error unsubscribing from [${desc.sub.id}] on WS-STOMP receiver [${this.name()}]`, err);
                }
            }
            if (desc.observer && desc.observer.complete) {
                try { desc.observer.complete(); } catch (err) { log.error(`Error completing observer`, err); }
            }
        }
        this.stompSubs = [];
        log.info(`Closing WS-STOMP receiver [${this.name()}]`);
        if (this.state$.value !== ChannelState.CLOSED) {
            this.state$.next(ChannelState.CLOSED)
        }
    }

}
