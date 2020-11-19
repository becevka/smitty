import axios from 'axios';
import express from "express";
import debug from "debug";
import Cache from "./Cache.js";
import {createApp} from "./utils.js";

const DEFAULT_SERVER_HOST = "http://localhost";
const DEFAULT_SERVER_PORT = 12345;

const log = debug('smitty:node');
log.color = 4;

const processOp = ({op, key, value, expire}, cache) => {
    switch (op) {
        case 'flush':
            try {
                const r = cache.flush();
                return {done: r};
            } catch (e) {
                return {error: e.message, code: 500};
            }
        case 'info':
            try {
                const size = cache.size();
                return {size, capacity: cache.capacity, expiredSet: cache.expireSetItems};
            } catch (e) {
                return {error: e.message, code: 500};
            }
        case 'get':
            try {
                const v = cache.get(key);
                const stat = cache.stat(key);
                return {key, value: v, ...stat};
            } catch (e) {
                return {error: e.message, code: 404};
            }
        case 'add':
            try {
                const r = cache.add(key, value, expire);
                return {key, value, created: r};
            } catch (e) {
                return {error: e.message, code: 400};
            }
        case 'set':
            try {
                cache.set(key, value, expire);
                const stat = cache.stat(key);
                return {key, value, lastUsed: stat};
            } catch (e) {
                return {error: e.message, code: 404};
            }
        case 'remove':
            try {
                const r = cache.remove(key);
                return {key, removed: r};
            } catch (e) {
                return {error: e.message, code: 404};
            }
        default:
            return {error: `Operation ${op} not supported`};
    }
}

const createRoutes = (cache) => {
    const router = express.Router();
    router.post('/v1/', function(req, res) {
        res.send(processOp(req.body, cache));
    });
    return router;
}

class Node {
    constructor(config, mono) {
        this.name = config.name;
        this.server = `${config.host || DEFAULT_SERVER_HOST}:${config.port || DEFAULT_SERVER_PORT}/v1/`;
        this.maxSize = config.maxSize;
        this.mono = mono;
        this.cache = new Cache(this.maxSize);
    }

    async sendCommand (command) {
        log(`Sending command to ${this.name}`);
        log(command);
        if (this.mono) {
            const res = processOp(command, this.cache);
            return new Promise((resolve) => {
                resolve(res);
            });
        }
        const res = await axios.post(this.server, command);
        return res.data;
    }

    createApp () {
        if (this.app != null) throw "already initialized";
        this.app = createApp(createRoutes(this.cache));
        return this.app;
    }
}

export default Node;
