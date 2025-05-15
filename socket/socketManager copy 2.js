const { sessionMiddleware } = require('../configludo/session');
const allowedOrigins = ['http://localhost:3000', 'http://localhost:1620','http://localhost:3001', ''];

const socketManager = {
    io: null,
    initialize(server) {
        this.io = require('socket.io')(server, {
            cors: {
                origin: allowedOrigins, // Allow all origins
                credentials: true,
            },
            allowRequest: (req, callback) => {
                const fakeRes = {
                    getHeader() {
                        return [];
                    },
                    setHeader(key, values) {
                        req.cookieHolder = values[0];
                    },
                    writeHead() {},
                };
                sessionMiddleware(req, fakeRes, () => {
                    if (req.session) {
                        fakeRes.writeHead();
                        req.session.save();
                    }
                    callback(null, true);
                });
            },
        });
    },
    getIO() {
        if (!this.io) {
            throw new Error('Socket.io not initialized');
        }
        return this.io;
    },
};

module.exports = socketManager;
