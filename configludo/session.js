const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
    uri: process.env.CONNECTION_URI,
    collection: 'Ludosessions',
});
const sessionMiddleware = session({
    store: store,
    credentials: true,
    cookie: {
        httpOnly: false,
        secure: false,
    },
    secret: 'secret',
    saveUninitialized: true,
    resave: true,
    maxAge: 1000*60*60*24,
 
});

const wrap = expressMiddleware => (socket, next) => expressMiddleware(socket.request, {}, next);

module.exports = { sessionMiddleware, wrap };
