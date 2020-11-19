import Cluster from "./src/Cluster.js";
import Node from "./src/Node.js";

import { createRequire } from 'module';
import {startServer} from "./src/utils.js";

const require = createRequire(import.meta.url);
const config = require("./config.json");

const mono = config.mono;
const cluster = new Cluster();
config.nodes.forEach(n => {
    const node = new Node(n, mono);
    cluster.addNode(node);
    // starting node if it is local
    if (n.host == null && !mono) {
        startServer(node.createApp(), n.port);
    }
});
// start registry cluster
startServer(cluster.createApp(), config.port);

