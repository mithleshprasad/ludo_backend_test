const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);

const store = new MongoDBStore({
    uri: process.env.CONNECTION_URI,
    collection: 'Ludosessions',
});

const sessionMiddleware = session({
    store: store,
    cookie: {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // Use secure cookies in production (for HTTPS)
        maxAge: 20000000000, // Session expiration time
    },
    secret: 'secret', // Change this to a stronger secret in production
    saveUninitialized: true,
    resave: true,
});

module.exports = { sessionMiddleware };
