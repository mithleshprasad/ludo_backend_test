const { sessionMiddleware } = require('../configludo/session');


const socketManager = {
    io: null,
    initialize(server) {
        this.io = require('socket.io')(server, {
            cors: {
                origin: process.env.NODE_ENV === 'production'
                    ? ['https://manual.a3adda.com', 'https://a3adda.com']
                    : ['http://localhost:3000', 'http://localhost:1620', 'http://localhost:3001'],
                credentials: true, // Allow credentials (cookies)
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
                    callback(null, true); // Allow the request
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
