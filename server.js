const express = require('express');
const cors = require('cors');
const path = require('path');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
require('dotenv').config();
const { sessionMiddleware } = require('./configludo/session');
const Room = require('./Ludomodels/room');
const PORT = process.env.PORT;
const app = express();
const Game = require('./Ludomodels/Game');
const User = require('./Ludomodels/User');

app.use(cookieParser());
app.use(
    express.urlencoded({
        extended: true,
    })
);
app.use(express.json());
app.set('trust proxy', 1);

const allowedOrigins = process.env.NODE_ENV === 'production'
    ? ['https://manual.a3adda.com', 'https://a3adda.com']
    : ['http://localhost:3000', 'http://localhost:1620', 'http://localhost:3001'];

app.use(
    cors({
        origin: allowedOrigins,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        
    })
);
// app.use(
//     cors({
//         origin: '*',  // This allows all origins
//         credentials: true,
//     })
// );
// app.use(sessionMiddleware);
app.get('/api/rooms', async (req, res) => {
    try {
        const rooms = await Room.find({Game_status: 'active'}, {
            createrId: 1,
            private: 1,
            started: 1,
            full: 1,
            winner: 1,
            startTime: 1,
            endTime: 1,
            name: 1,
            password: 1,
            Game_type: 1,
            Game_status: 1,
            gameuniqueId: 1,
            createDate: 1,
            winprice: 1,
            _id: 1
        });
        res.json(rooms);
    } catch (error) {
        console.error('Error fetching rooms:', error);
        res.status(500).json({ message: 'Server error' });
    }
});
app.post('/update-room-id/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { MannualroomId } = req.body;

        if (!MannualroomId) {
            return res.status(400).json({ success: false, message: 'MannualroomId is required' });
        }

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        game.MannualroomId = MannualroomId;
        await game.save();

        return res.status(200).json({ success: true, message: 'MannualroomId updated successfully', game });
    } catch (error) {
        console.error('Error updating MannualroomId:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.post('/update-Game-status/:gameId', async (req, res) => {
    try {
        const { gameId } = req.params;
        const { statuswinner, status } = req.body;

        if (!statuswinner) {
            return res.status(400).json({ success: false, statuswinner: 'status is required' });
        }

        const game = await Game.findById(gameId);
        if (!game) {
            return res.status(404).json({ success: false, message: 'Game not found' });
        }

        game.Statuswinner = statuswinner;
        game.status = status;
        await game.save();

        return res.status(200).json({ success: true, message: 'status updated successfully', game });
    } catch (error) {
        console.error('Error updating status:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});

app.post('/update-game-id/:roomId', async (req, res) => {
    try {
        const { roomId } = req.params;
        const { GameId,Accepetd_By , } = req.body;

        // Validate GameId
        if (!GameId) {
            return res.status(400).json({ success: false, message: 'GameId is required' });
        }

        // Find a single room by ID
        const room = await Room.findById(roomId);
        if (!room) {
            return res.status(404).json({ success: false, message: 'Room not found' });
        }

        // Update GameId in room
        room.GameId = GameId;
        room.Accepetd_By = Accepetd_By;
        await room.save();

        return res.status(200).json({ success: true, message: 'GameId updated successfully', room });
    } catch (error) {
        console.error('Error updating GameId:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
});
app.get('/api/get-token/:userId', async (req, res) => {
    try {
        const { userId } = req.params;

        // Find user by ID
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Check if user has any tokens
        if (!user.tokens || user.tokens.length === 0) {
            return res.status(404).json({ message: 'No token found for this user' });
        }

        // Get the latest token (last entry in tokens array)
        const latestToken = user.tokens[user.tokens.length - 1].token;

        res.status(200).json({ success: true, token: latestToken });
    } catch (error) {
        console.error('Error fetching token:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
});
app.get('/get-connect-sid', (req, res) => {
    console.log(req.cookies['conneccct.sid']);
    res.json({ connectSid: req.cookies['connect.sid'] });
  });

const server = app.listen(PORT);

require('./configludo/database')(mongoose);
require('./configludo/socket')(server);

// if (process.env.NODE_ENV === 'production') {
//     app.use(express.static('./build'));
//     app.get('*', (req, res) => {
//         const indexPath = path.join(__dirname, './build/index.html');
//         res.sendFile(indexPath);
//     });
// }

module.exports = { server };
