import cline from "cline";
import axios from "axios";
import chalk from "chalk";
import {createRequire} from 'module';

const require = createRequire(import.meta.url);
const config = require("./config.json");

const DEFAULT_SERVER_HOST = "http://localhost"
const DEFAULT_SERVER_PORT = 8080;

const path = `${config.host || DEFAULT_SERVER_HOST}:${config.port || DEFAULT_SERVER_PORT}/v1`;

const cli = cline();

const namespaces = config.nodes.map(n => n.name);
let selectedNamespace = config.defaultNamespace || namespaces[0];

const print = (o) => {
    if (o.data != null) {
        console.log(o.data);
    } else {
        console.error(chalk.red(o.response.data));
    }
    cli.prompt('smitty>');
}

cli.command('use {namespace}', 'selects namespace',
    {namespace: '\\w+'},
    (input, args) => {
        if (namespaces.includes(args.namespace)) {
            selectedNamespace = args.namespace;
            console.log(chalk.blue(`Using ${selectedNamespace}`));
        } else {
            console.error(chalk.red(`Namespace ${args.namespace} not found`));
            console.log(`Available namespaces: ${namespaces.join(", ")}`);
        }
    });

cli.command('ns', 'show current namespace',
    {namespace: '\\w+'},
    () => {
        console.log(chalk.blue(`Using ${selectedNamespace}`));
    });

cli.command('get {key}', 'retrieves value by key',
    {key: '\\w+', value: '\\w+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.get(url).then(print).catch(print);
    });

cli.command('info', 'shows cache info',
    {key: '\\w+', value: '\\w+'},
    () => {
        const url = `${path}/manage/${selectedNamespace}/info`;
        axios.get(url).then(print).catch(print);
    });

cli.command('flush', 'flushes cache',
    {key: '\\w+', value: '\\w+'},
    () => {
        const url = `${path}/manage/${selectedNamespace}/flush`;
        axios.post(url).then(print).catch(print);
    });

cli.command('remove {key}', 'deletes value by key',
    {key: '\\w+', value: '\\w+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.delete(url).then(print).catch(print);
    });

cli.command('add {key} {expire} {value}', 'adds value by key with expiration',
    {key: '\\w+', expire: "\\d*", value: '.+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.post(url, args).then(print).catch(print);
    });

cli.command('add {key} {value}', 'adds value by key',
    {key: '\\w+', value: '.+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.post(url, args).then(print).catch(print);
    });

cli.command('set {key} {expire} {value}', 'sets value by key with expiration',
    {key: '\\w+', expire: "\\d*", value: '.+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.put(url, args).then(print).catch(print);
    });

cli.command('set {key} {value}', 'sets value by key',
    {key: '\\w+', value: '.+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.put(url, args).then(print).catch(print);
    });

cli.command('set {key} {value}', 'sets value by key',
    {key: '\\w+', value: '.+'},
    (input, args) => {
        const url = `${path}/${selectedNamespace}/${args.key}`;
        axios.put(url, args).then(print).catch(print);
    });

console.log(chalk.blue(`Using ${selectedNamespace}`));

cli.interact('smitty>');
cli.on('close', () => process.exit());