const express = require('express');
const cors = require('cors');
const db = require('./database.js');
const { verifyCloudProof } = require('@worldcoin/minikit-js');
require('dotenv').config(); // Load environment variables

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// VERIFY ENDPOINT (For Worldcoin Login)
app.post("/api/verify", async (req, res) => {
    const { payload, action } = req.body;
    const app_id = process.env.APP_ID;

    if (!app_id) {
        return res.status(500).json({ error: "APP_ID not set in the environment variables." });
    }

    try {
        const verifyRes = await verifyCloudProof(payload, app_id, action);
        
        if (verifyRes.success) {
            // This is where you would perform actions for a verified user,
            // like creating a user record in your database using the nullifier_hash.
            console.log(`Proof verified for nullifier: ${payload.nullifier_hash}`);
            
            return res.status(200).json({ verifyRes });
        } else {
            // This handles verification errors from Worldcoin's side.
            return res.status(400).json({ verifyRes });
        }
    } catch (error) {
        console.error("Verification failed:", error);
        return res.status(500).json({ error: "Internal server error during verification." });
    }
});

// GET ALL DARES
app.get("/api/dares", (req, res) => {
    const sql = "SELECT * FROM dares";
    db.all(sql, [], (err, rows) => {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

// CREATE A NEW DARE
app.post("/api/dares", (req, res) => {
    const { title, description, category, difficulty, reward, deadline, location, requiresLocation, featured } = req.body;
    const sql = `INSERT INTO dares (title, description, reward, creator, deadline, difficulty, participants, status, category, location, featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
    // In a real app, the creator would be linked to the verified user's ID
    const params = [title, description, reward, "You", deadline, difficulty, 0, "active", category, requiresLocation ? location : null, featured || false];
    
    db.run(sql, params, function (err, result) {
        if (err) {
            res.status(400).json({ "error": err.message });
            return;
        }
        res.status(201).json({
            "message": "success",
            "data": { id: this.lastID, ...req.body }
        });
    });
});

// These should be replaced with real database logic as you build out the features.

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
            submissions: [] // In a real app, you would query the submissions table
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
    // In a real app, you'd get the user ID from a JWT token, not a hardcoded query
    const sql = "SELECT * FROM users WHERE username = 'user'";
    db.get(sql, [], (err, row) => {
        if (err || !row) {
            return res.status(404).json({ "error": "User not found" });
        }
        res.json({
            "message": "success",
            "data": { ...row, totalUsers: 2847 } // totalUsers could be a separate query
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