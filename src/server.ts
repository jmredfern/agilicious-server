'use strict';

import { createServer } from 'http';
import bodyParser from 'body-parser';
import express from 'express';
import { inspect } from 'util';
import { getLoggerByFilename } from './util/logger';
import { Logger } from 'log4js';
import path from 'path';
import WebSocket from 'ws';
import cors from 'cors';
import { processPlayerEvent } from './FSM/FSM';
import { apiRouter } from './apiRouter';

const log: Logger = getLoggerByFilename(__filename);
const app = express();
const expressServer = createServer(app);

const wss = new WebSocket.Server({ server: expressServer });

wss.on('connection', (websocket: any): void => {
	log.info('Client connected');
	websocket.on('message', (eventJSON: string): void => {
		const event = JSON.parse(eventJSON);
		log.info(`Server received: ${inspect(event)}`);
		processPlayerEvent(event, websocket);
	});

	websocket.on('close', (): void => {
		log.info('Client disconnected');
	});
});

app.use(bodyParser.text({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
app.use('/api', apiRouter);
app.use(express.static(path.join(__dirname, '../build')));
app.get('/*', (req, res, next) => {
	res.sendFile(path.join(__dirname, '../build', 'index.html'));
});

export const start = (port: number): void => {
	log.info('Starting server');
	expressServer.listen(port, () => {
		log.info(`Server listening on port ${port}`);
	});
};
