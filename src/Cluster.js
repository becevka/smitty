import express from 'express';
import debug from "debug";
import {createApp} from "./utils.js";

const log = debug('smitty:cluster');
log.color = 6;

const send = (obj, res) => {
    if (obj.code) {
        res.status(obj.code).send(obj.error);
    } else {
        res.send(obj);
    }
}

const cmd = {};
['get', 'set', 'add', 'remove', 'info', 'flush'].forEach((op) => {
    cmd[op] = (params) => {
        return {op, ...params}
    }
});

const findNode = (namespace, nodes) => {
    const node = nodes[namespace];
    if (node == null) {
        throw `Node not found: ${namespace}`;
    }
    return node;
}

const createRoutes = (nodes) => {
    const router = express.Router();
    router.get('/v1/:namespace/:key', function(req, res) {
        const {namespace, key} = req.params;
        const node = findNode(namespace, nodes);
        node.sendCommand(cmd.get({key})).then(result => send(result, res));
    });

    router.get('/v1/manage/:namespace/info', function(req, res) {
        const {namespace} = req.params;
        const node = findNode(namespace, nodes);
        node.sendCommand(cmd.info()).then(result => send(result, res));
    });

    router.post('/v1/:namespace/:key', function(req, res) {
        const {namespace, key} = req.params;
        const {value, expire} = req.body;
        const node = findNode(namespace, nodes);
        node.sendCommand(cmd.add({key, value, expire})).then(result => send(result, res));
    });

    router.post('/v1/manage/:namespace/flush', function(req, res) {
        const {namespace} = req.params;
        const node = findNode(namespace, nodes);
        node.sendCommand(cmd.flush()).then(result => send(result, res));
    });

    router.put('/v1/:namespace/:key', function(req, res) {
        const {namespace, key} = req.params;
        const {value, expire} = req.body;
        const node = findNode(namespace, nodes);
        node.sendCommand(cmd.set({key, value, expire})).then(result => send(result, res));
    });

    router.delete('/v1/:namespace/:key', function(req, res) {
        const {namespace, key} = req.params;
        const node = findNode(namespace, nodes);
        node.sendCommand(cmd.remove({key})).then(result => send(result, res));
    });
    return router;
}

class Cluster {

    constructor() {
        this.nodes = {};
    }

    createApp() {
        if (this.app != null) throw "already initialized";
        const router = createRoutes(this.nodes);
        this.app = createApp(router);
        return this.app;
    }

    addNode (node) {
        this.nodes[node.name] = node;
        log(`Adding node ${node.name}`);
    }

}

export default Cluster





