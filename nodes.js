import Node from "./src/Node.js";
import {startServer} from "./src/utils.js";

import { createRequire } from 'module';
const require = createRequire(import.meta.url);
const config = require("./config.json");

config.nodes.forEach(n => {
    const node = new Node(n);
    // starting node if it is local
    if (n.host == null) {
        startServer(node.createApp(), n.port);
    }
});
