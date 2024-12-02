const express = require('express');
const next = require('next');
const socketIO = require('socket.io')
const http = require('http');

const dev = process.env.NODE_ENV !== 'production';
const nextApp = next({ dev });
const nextHandle = nextApp.getRequestHandler();

nextApp.prepare().then(() => {
    const app = express();
    const server = http.createServer(app); // Create an HTTP server
    const io = socketIO(server); // Attach socket.io to the HTTP server

    // Handle socket.io connection
    io.on('connection', (socket) => {
        console.log('A client connected');
        

        // Handle socket.io events here

        // Handle socket.io disconnection
        socket.on('disconnect', () => {
            console.log('A client disconnected');
        });
    });

    app.all('*', (req, res) => {
        return nextHandle(req, res);
    });

    server.listen(3001, (err) => {
        if (err) throw err;
        console.log('> Ready on http://localhost:3001');
    });

}).catch((ex) => {
    console.error(ex.stack)
    process.exit(1)
});