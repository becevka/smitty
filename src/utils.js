// Initialize server for port using app;
import http from "http";
import express from "express";
import logger from "morgan";
import debug from "debug";

const log = debug('smitty:server');
log.color = 3;

export const startServer = (app, port) => {
    app.set('port', port);
    const server = http.createServer(app);
    server.listen(port);
    server.on('error', (e) => {
        console.error("Server error:", e);
    });
    server.on('listening', () => {
        log('Listening on ' + port);
    });
}

export const createApp = (router) => {
    const app = express();
    app.use(logger("dev"));
    app.use(express.json());
    app.use(express.urlencoded({extended: false}));

    app.use("/", router);

    app.use(function (req, res) {
        res.status(404).send("Not Found");
    });

    // error handler
    app.use(function (err, req, res) {
        res.locals.message = err.message;
        res.locals.error = req.app.get('env') === 'development' ? err : {};

        res.status(err.status || 500);
    });

    return app;
}
