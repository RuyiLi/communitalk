const WebSocket = require('ws');
const http = require('http');
const path = require('path');
const fs = require('fs').promises;

const PORT = process.env.PORT || 3000;
const STATIC_ROOT = './www/';

function getMimeType (filePath) {
    if (filePath.endsWith('.js')) return 'text/javascript';
    if (filePath.endsWith('.html')) return 'text/html';
    if (filePath.endsWith('.css')) return 'text/css';
    if (filePath.endsWith('.json')) return 'application/json';
    if (filePath.endsWith('.png')) return 'image/png';
    if (filePath.endsWith('.jpg')) return 'image/jpg';
    return 'application/octet-stream';
}

function parseQueryParams (url) {
    const startIdx = url.indexOf('?');
    if (startIdx === -1) return {};

    const data = {};
    const relevant = url.slice(startIdx + 1);

    const pairs = relevant.split('&').map(pair => pair.split('='));
    for (const [ key, value ] of pairs) {
        data[ key ] = value;
    }

    return data;
}

const server = http.createServer(async function (req, res) {
    console.log(`${ req.method } request to ${ req.url }`);

    if (req.url === '/') req.url = 'index.html';
    const filePath = path.join(STATIC_ROOT, req.url);

    try {
        const file = await fs.readFile(filePath);
        res.setHeader('Content-Type', getMimeType(filePath));
        res.writeHead(200);
        res.end(file);
    } catch (err) {
        console.warn(err);
        if (err.code === 'ENOENT') {
            res.writeHead(404);
            res.end('404 Not Found');
        }
    }
});

const wss = new WebSocket.Server({ server });
const rooms = new Map();

wss.on('connection', function (ws, req) {
    const { loc, name } = parseQueryParams(req.url);
    ws.username = name;

    if (!rooms.has(loc)) rooms.set(loc, []);
    const room = rooms.get(loc);
    room.push(ws);

    ws.on('message', function (msg) {
        console.log(name, msg);
        const { event, data } = JSON.parse(msg);
        if (event === 'SEND_MESSAGE') {
            if (!data.content) return;
            for (const otherWs of room) {
                otherWs.send(msg);
            }
        } else if (event === 'USER_JOIN') {
            ws.send(JSON.stringify({
                event: 'USER_JOIN',
                data: {
                    numUsers: room.length,
                    name: data.name,
                }
            }));
        }
    });

    ws.on('close', function () {
        room.splice(room.indexOf(ws), 1);
        if (room.length) {
            room[ 0 ].send(JSON.stringify({
                event: 'USER_LEAVE',
                data: {
                    numUsers: room.length,
                    name,
                }
            }));
        }
    })
});

server.listen(PORT, function () {
    console.info(`Listening on port ${ PORT }.`)
});