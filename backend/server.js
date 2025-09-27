const express = require('express');
const cors = require('cors');
const db = require('./database.js');
require('dotenv').config(); // Still useful for other potential secrets

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// These can remain for now as they are not contract-related.

app.get("/api/dares/:id/voting", (req, res) => {
    res.json({
        "message": "success",
        "data": {
            id: req.params.id,
            title: "Random act of kindness",
            description: "Do something nice for a stranger and capture the moment.",
            reward: 10,
            creator: "Charlie",
            deadline: "3 days",
            totalSubmissions: 25,
            votingEnds: "2 days",
            phase: "community-voting",
            submissions: []
        }
    });
});

app.get("/api/leaderboard", (req, res) => {
    res.json({
        "message": "success",
        "data": [
            { id: 1, name: "Sarah Kim", avatar: "SK", score: 2450, rank: 1, change: 2, completedDares: 23, successRate: 95, totalEarned: 1250, streak: 12, badges: ["Top Creator"] },
            { id: 2, name: "Alex Chen", avatar: "AC", score: 2380, rank: 2, change: -1, completedDares: 19, successRate: 89, totalEarned: 980, streak: 8, badges: ["Verified Pro"] },
            { id: 5, name: "You", avatar: "YU", score: 1890, rank: 8, change: 3, completedDares: 14, successRate: 85, totalEarned: 720, streak: 6, badges: ["Rising Star"] }
        ]
    });
});

app.get("/api/profile/stats", (req, res) => {
    const sql = "SELECT * FROM users WHERE username = 'user'";
    db.get(sql, [], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ "error": "User not found" });
        }
        res.json({
            "message": "success",
            "data": { ...row, totalUsers: 2847 }
        });
    });
});

app.get("/api/profile/achievements", (req, res) => {
    res.json({ "message": "success", "data": [
        { id: "first-dare", title: "First Steps", description: "Complete your first dare", icon: "🎯", unlocked: true, unlockedAt: "2 weeks ago" },
        { id: "voter", title: "Community Voice", description: "Vote on 50 submissions", icon: "🗳️", unlocked: false, progress: 23, maxProgress: 50 }
    ]});
});

app.get("/api/profile/activities", (req, res) => {
    res.json({ "message": "success", "data": [
        { id: "1", type: "completed", title: "Dance challenge", description: "Completed 'Dance for 30 seconds in public'", reward: 5, timestamp: "2 hours ago", status: "success" },
        { id: "2", type: "voted", title: "Community voting", description: "Voted on 'Random act of kindness' submissions", reward: 0.5, timestamp: "4 hours ago", status: "success" }
    ]});
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});