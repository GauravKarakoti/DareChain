const express = require('express');
const cors = require('cors');
const db = require('./database.js');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

// --- Function to check dare deadlines ---
const checkDareDeadlines = () => {
    const sql = "SELECT id, deadline, createdAt FROM dares WHERE status = 'open'";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Error fetching open dares:", err.message);
            return;
        }

        rows.forEach(dare => {
            const createdAt = new Date(dare.createdAt);
            const deadlineParts = dare.deadline.split(" ");
            const amount = parseInt(deadlineParts[0]);
            const unit = deadlineParts[1];

            let deadlineDate = new Date(createdAt);

            if (unit.includes("day")) {
                deadlineDate.setDate(deadlineDate.getDate() + amount);
            } else if (unit.includes("week")) {
                deadlineDate.setDate(deadlineDate.getDate() + amount * 7);
            } else if (unit.includes("month")) {
                deadlineDate.setMonth(deadlineDate.getMonth() + amount);
            }

            if (new Date() > deadlineDate) {
                const updateSql = "UPDATE dares SET status = 'voting' WHERE id = ?";
                db.run(updateSql, [dare.id], function(err) {
                    if (err) {
                        console.error(`Error updating dare ${dare.id} to voting status:`, err.message);
                    } else {
                        console.log(`Dare ${dare.id} has been moved to the voting phase.`);
                    }
                });
            }
        });
    });
};

// Run the deadline check every minute
setInterval(checkDareDeadlines, 60000);


// --- Notification Endpoints ---

// GET notifications for a user
app.get("/api/notifications/:userId", (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT * FROM notifications WHERE userId = ? ORDER BY createdAt DESC";
    db.all(sql, [userId], (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": "Database error fetching notifications" });
        }
        res.json({ "message": "success", "data": rows });
    });
});

// POST a new notification
app.post("/api/notifications", (req, res) => {
    const { userId, type, message } = req.body;
    if (!userId || !type || !message) {
        return res.status(400).json({ "error": "Missing required fields: userId, type, or message." });
    }
    const createdAt = new Date().toISOString();
    const sql = `INSERT INTO notifications (userId, type, message, createdAt) VALUES (?, ?, ?, ?)`;
    db.run(sql, [userId, type, message, createdAt], function (err) {
        if (err) {
            return res.status(500).json({ "error": "Database error creating notification" });
        }
        res.json({
            "message": "Notification created successfully",
            "notificationId": this.lastID
        });
    });
});

// PUT to mark all notifications as read for a user
app.put("/api/notifications/read/:userId", (req, res) => {
    const { userId } = req.params;
    const sql = `UPDATE notifications SET isRead = 1 WHERE userId = ?`;
    db.run(sql, [userId], function (err) {
        if (err) {
            return res.status(500).json({ "error": "Database error marking notifications as read" });
        }
        res.json({ "message": "All notifications marked as read." });
    });
});


// --- NEW ENDPOINT TO FIND OR CREATE USER ON WALLET CONNECT ---
app.post("/api/users/findOrCreate", (req, res) => {
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ "error": "walletAddress is required" });
    }

    const findSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findSql, [walletAddress], (err, row) => {
        if (err) {
            console.error("Database error finding user:", err.message);
            return res.status(500).json({ "error": "Database error finding user" });
        }

        if (row) {
            // User already exists
            console.log(`User ${walletAddress} already exists with ID ${row.id}.`);
            res.json({
                message: "User session initialized.",
                userId: row.id,
                isNewUser: false
            });
        } else {
            // User does not exist, create them
            const insertSql = `INSERT INTO users (walletAddress) VALUES (?)`;
            db.run(insertSql, [walletAddress], function (err) {
                if (err) {
                    console.error("Database error creating user:", err.message);
                    return res.status(500).json({ "error": "Database error creating user" });
                }
                console.log(`New user created with wallet ${walletAddress} and ID ${this.lastID}.`);
                res.status(201).json({
                    message: "New user created successfully.",
                    userId: this.lastID,
                    isNewUser: true
                });
            });
        }
    });
});


// --- MODIFIED ENDPOINT FOR FETCHING ALL DARES ---
app.get("/api/dares", (req, res) => {
    const { walletAddress } = req.query;

    const fetchAllDares = (acceptedDareIds = new Set(), likedDareIds = new Set()) => {
        const sql = "SELECT * FROM dares";
        db.all(sql, [], (err, rows) => {
            if (err) {
                return res.status(500).json({ "error": "Database error fetching dares" });
            }
            const daresData = rows || [];
            const enhancedDares = daresData.map(dare => ({
                ...dare,
                isAcceptedByUser: acceptedDareIds.has(dare.id),
                isLikedByUser: likedDareIds.has(dare.id)
            }));
            res.json({ "message": "success", "data": enhancedDares });
        });
    };

    if (walletAddress) {
        const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
        db.get(findUserSql, [walletAddress], (err, user) => {
            if (err || !user) {
                fetchAllDares();
                return;
            }

            const findAcceptedDaresSql = "SELECT dareId FROM user_dares WHERE userId = ?";
            const findLikedDaresSql = "SELECT dareId FROM dare_likes WHERE userId = ?";

            Promise.all([
                new Promise((resolve, reject) => {
                    db.all(findAcceptedDaresSql, [user.id], (err, rows) => err ? reject(err) : resolve(new Set(rows.map(r => r.dareId))));
                }),
                new Promise((resolve, reject) => {
                    db.all(findLikedDaresSql, [user.id], (err, rows) => err ? reject(err) : resolve(new Set(rows.map(r => r.dareId))));
                })
            ]).then(([acceptedDareIds, likedDareIds]) => {
                fetchAllDares(acceptedDareIds, likedDareIds);
            }).catch(err => {
                console.error("Error fetching user dare data:", err.message);
                fetchAllDares();
            });
        });
    } else {
        fetchAllDares();
    }
});

// --- NEW ENDPOINT FOR FETCHING A SINGLE DARE ---
app.get("/api/dares/:id", (req, res) => {
    const { id } = req.params;
    const sql = "SELECT * FROM dares WHERE id = ?";
    db.get(sql, [id], (err, row) => {
        if (err) {
            console.error("Database error fetching dare:", err.message);
            return res.status(500).json({ "error": "Database error fetching dare" });
        }
        if (!row) {
            return res.status(404).json({ "error": `Dare with ID ${id} not found.` });
        }
        res.json({
            "message": "success",
            "data": row
        });
    });
});


// --- ENDPOINT FOR CREATING A DARE IN THE DATABASE ---
app.post("/api/dares", (req, res) => {
    // Expected body fields: title, description, reward (string), category, difficulty, deadlineLabel (string), creator (address), location (string, optional), featured (boolean)
    const {
        title,
        description,
        reward,
        category,
        difficulty,
        deadlineLabel,
        creator,
        location,
        featured
    } = req.body;

    // Minimal validation
    if (!title || !description || !reward || !creator) {
        return res.status(400).json({ "error": "Missing required fields: title, description, reward, or creator." });
    }

    const sql = `INSERT INTO dares (
        title,
        description,
        reward,
        creator,
        deadline,
        difficulty,
        participants,
        status,
        category,
        location,
        featured,
        likes,
        comments,
        createdAt
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, CURRENT_TIMESTAMP)`; // Added likes and comments

    // The reward and deadline are passed as strings for simplicity based on mock data
    const params = [
        title,
        description,
        reward,
        creator,
        deadlineLabel || '7 days',
        difficulty || 'medium',
        0,                                  // Default participants
        'open',                             // Default status for a new dare
        category || 'uncategorized',        // Default category if missing
        location || null,
        !!featured                          // Coerced to integer (0 or 1) by SQLite
    ];
    console.log("Inserting new dare with params:", params);

    db.run(sql, params, function (err) {
        if (err) {
            console.error("Database error creating dare:", err.message);
            return res.status(500).json({ "error": "Database error creating dare" });
        }
        // return the ID of the new dare in the database
        res.json({
            "message": "Dare successfully added to database",
            "dareId": this.lastID
        });
    });
    console.log("Create dare request processed.");
});

// --- MODIFIED ENDPOINT FOR ACCEPTING A DARE ---
app.post("/api/dares/:id/accept", (req, res) => {
    const dareId = req.params.id;
    const { walletAddress } = req.body; // Expect wallet address from the frontend

    if (!walletAddress) {
        return res.status(400).json({ "error": "walletAddress is required to accept a dare." });
    }

    // 1. Find the user ID from the wallet address
    const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err) {
            console.error(`Database error finding user ${walletAddress}:`, err.message);
            return res.status(500).json({ "error": "Database error finding user" });
        }
        if (!user) {
            return res.status(404).json({ "error": `User with wallet address ${walletAddress} not found.` });
        }

        const userId = user.id;
        const acceptedAt = new Date().toISOString();

        // Use a transaction to ensure both operations succeed or fail together
        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");

            // 2. Insert into user_dares to link the user and dare
            const insertSql = `INSERT INTO user_dares (userId, dareId, acceptedAt) VALUES (?, ?, ?)`;
            db.run(insertSql, [userId, dareId, acceptedAt], function (err) {
                if (err) {
                    console.error(`Error in user_dares for userId ${userId}, dareId ${dareId}:`, err.message);
                    db.run("ROLLBACK;");
                    if (err.message.includes("UNIQUE constraint failed")) {
                        return res.status(409).json({ "error": "You have already accepted this dare." });
                    }
                    return res.status(500).json({ "error": "Database error linking dare to user." });
                }

                // 3. Increment the participants count on the dare
                const updateSql = `UPDATE dares SET participants = participants + 1 WHERE id = ?`;
                db.run(updateSql, [dareId], function (err) {
                    if (err) {
                        console.error(`Database error incrementing participants for dare ${dareId}:`, err.message);
                        db.run("ROLLBACK;");
                        return res.status(500).json({ "error": "Database error updating participant count." });
                    }
                    if (this.changes === 0) {
                        console.log(`Attempted to accept non-existent dare ID: ${dareId}`);
                        db.run("ROLLBACK;");
                        return res.status(404).json({ "error": `Dare with ID ${dareId} not found.` });
                    }

                    // If both were successful, commit
                    db.run("COMMIT;");
                    console.log(`Dare ID ${dareId} accepted by user ID ${userId}. Participants incremented.`);
                    res.json({
                        "message": "Dare successfully accepted.",
                        "dareId": dareId,
                        "userId": userId
                    });
                });
            });
        });
    });
});

// --- NEW ENDPOINT FOR LIKING A DARE ---
app.post("/api/dares/:id/like", (req, res) => {
    const dareId = req.params.id;
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ "error": "walletAddress is required to like a dare." });
    }

    const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ "error": `User with wallet address ${walletAddress} not found.` });
        }

        const userId = user.id;
        const findLikeSql = "SELECT id FROM dare_likes WHERE userId = ? AND dareId = ?";
        db.get(findLikeSql, [userId, dareId], (err, like) => {
            if (err) {
                return res.status(500).json({ "error": "Database error checking for like." });
            }

            if (like) {
                // Unlike
                const deleteLikeSql = "DELETE FROM dare_likes WHERE id = ?";
                db.run(deleteLikeSql, [like.id], function (err) {
                    if (err) {
                        return res.status(500).json({ "error": "Database error unliking dare." });
                    }
                    const updateDareSql = "UPDATE dares SET likes = likes - 1 WHERE id = ? AND likes > 0";
                    db.run(updateDareSql, [dareId], function (err) {
                        if (err) {
                            return res.status(500).json({ "error": "Database error updating dare likes." });
                        }
                        res.json({ message: "Dare unliked successfully." });
                    });
                });
            } else {
                // Like
                const insertLikeSql = "INSERT INTO dare_likes (userId, dareId) VALUES (?, ?)";
                db.run(insertLikeSql, [userId, dareId], function (err) {
                    if (err) {
                        return res.status(500).json({ "error": "Database error liking dare." });
                    }
                    const updateDareSql = "UPDATE dares SET likes = likes + 1 WHERE id = ?";
                    db.run(updateDareSql, [dareId], function (err) {
                        if (err) {
                            return res.status(500).json({ "error": "Database error updating dare likes." });
                        }
                        res.json({ message: "Dare liked successfully." });
                    });
                });
            }
        });
    });
});

app.get("/api/dares/:id/comments", (req, res) => {
    const dareId = req.params.id;
    const { walletAddress } = req.query;

    const sql = `
        SELECT c.id, u.walletAddress as user, c.comment, c.timestamp, c.likes, r.comment as repliedTo_comment, ru.walletAddress as repliedTo_user
        FROM dare_comments c
        JOIN users u ON c.userId = u.id
        LEFT JOIN dare_comments r ON c.replyingTo = r.id
        LEFT JOIN users ru ON r.userId = ru.id
        WHERE c.dareId = ? 
        ORDER BY c.timestamp ASC
    `;
    db.all(sql, [dareId], (err, rows) => {
        if (err) {
            return res.status(500).json({ "error": "Database error fetching comments." });
        }
        if (walletAddress) {
            const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
            db.get(findUserSql, [walletAddress], (err, user) => {
                if (err || !user) {
                    return res.json({ message: "success", data: rows.map(r => ({...r, isLiked: false})) });
                }
                const findLikesSql = "SELECT commentId FROM dare_comment_likes WHERE userId = ?";
                db.all(findLikesSql, [user.id], (err, likes) => {
                    if (err) {
                        return res.json({ message: "success", data: rows.map(r => ({...r, isLiked: false})) });
                    }
                    const likedCommentIds = new Set(likes.map(l => l.commentId));
                    const enhancedRows = rows.map(r => ({...r, isLiked: likedCommentIds.has(r.id)}));
                    res.json({ message: "success", data: enhancedRows });
                });
            });
        } else {
            res.json({ message: "success", data: rows.map(r => ({...r, isLiked: false})) });
        }
    });
});

// --- NEW ENDPOINT FOR LIKING A COMMENT ---
app.post("/api/comments/:id/like", (req, res) => {
    const commentId = req.params.id;
    const { walletAddress } = req.body;

    if (!walletAddress) {
        return res.status(400).json({ "error": "walletAddress is required." });
    }

    const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ "error": `User not found.` });
        }

        const userId = user.id;
        const findLikeSql = "SELECT id FROM dare_comment_likes WHERE userId = ? AND commentId = ?";
        db.get(findLikeSql, [userId, commentId], (err, like) => {
            if (err) {
                return res.status(500).json({ "error": "Database error." });
            }

            if (like) {
                // Unlike
                db.run("DELETE FROM dare_comment_likes WHERE id = ?", [like.id], (err) => {
                    if (err) return res.status(500).json({ "error": "Database error." });
                    db.run("UPDATE dare_comments SET likes = likes - 1 WHERE id = ? AND likes > 0", [commentId], (err) => {
                        if (err) return res.status(500).json({ "error": "Database error." });
                        res.json({ message: "Comment unliked." });
                    });
                });
            } else {
                // Like
                db.run("INSERT INTO dare_comment_likes (userId, commentId) VALUES (?, ?)", [userId, commentId], (err) => {
                    if (err) return res.status(500).json({ "error": "Database error." });
                    db.run("UPDATE dare_comments SET likes = likes + 1 WHERE id = ?", [commentId], (err) => {
                        if (err) return res.status(500).json({ "error": "Database error." });
                        res.json({ message: "Comment liked." });
                    });
                });
            }
        });
    });
});

// --- NEW ENDPOINT FOR ADDING A DARE COMMENT ---
app.post("/api/dares/:id/comment", (req, res) => {
    const dareId = req.params.id;
    const { walletAddress, comment, replyingTo } = req.body;

    if (!walletAddress || !comment) {
        return res.status(400).json({ "error": "walletAddress and comment are required." });
    }

    const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ "error": `User with wallet address ${walletAddress} not found.` });
        }

        const userId = user.id;
        const timestamp = new Date().toISOString();
        
        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            const insertCommentSql = "INSERT INTO dare_comments (dareId, userId, comment, timestamp, replyingTo) VALUES (?, ?, ?, ?, ?)";
            db.run(insertCommentSql, [dareId, userId, comment, timestamp, replyingTo], function(err) {
                if (err) {
                    db.run("ROLLBACK;");
                    return res.status(500).json({ "error": "Database error adding comment." });
                }
                const commentId = this.lastID;
                const updateDareSql = "UPDATE dares SET comments = comments + 1 WHERE id = ?";
                db.run(updateDareSql, [dareId], function(err) {
                    if (err) {
                        db.run("ROLLBACK;");
                        return res.status(500).json({ "error": "Database error updating comments count." });
                    }
                    db.run("COMMIT;");
                    res.status(201).json({ message: "Comment added successfully.", commentId: commentId });
                });
            });
        });
    });
});

// --- NEW ENDPOINT FOR CREATING A SUBMISSION ---
app.post("/api/submissions", (req, res) => {
    const { dareId, walletAddress, description, fileCID } = req.body;

    if (!dareId || !walletAddress || !description || !fileCID) {
        return res.status(400).json({ "error": "Missing required fields: dareId, walletAddress, description, or fileCID." });
    }

    const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            if (err) console.error("Database error finding user for submission:", err.message);
            return res.status(404).json({ "error": `User with wallet address ${walletAddress} not found.` });
        }

        const userId = user.id;
        const timestamp = new Date().toISOString();
        const status = 'pending'; // Initial status for a new submission

        const sql = `INSERT INTO submissions (dareId, userId, description, fileCID, timestamp, status) VALUES (?, ?, ?, ?, ?, ?)`;
        const params = [dareId, userId, description, fileCID, timestamp, status];

        db.run(sql, params, function (err) {
            if (err) {
                console.error("Database error creating submission:", err.message);
                return res.status(500).json({ "error": "Database error creating submission" });
            }
            res.status(201).json({
                "message": "Submission successfully created",
                "submissionId": this.lastID
            });
            console.log(`Submission for dare ${dareId} by user ${userId} created with ID ${this.lastID}.`);
        });
    });
});

// --- NEW ENDPOINT FOR FETCHING A USER'S SUBMISSION FOR A DARE ---
app.get("/api/submission", (req, res) => {
    const { dareId, walletAddress } = req.query;

    if (!dareId || !walletAddress) {
        return res.status(400).json({ "error": "dareId and walletAddress are required query parameters." });
    }

    // 1. Find user by wallet address to get their ID
    const findUserSql = "SELECT id FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err) {
            console.error("Database error finding user for submission fetch:", err.message);
            return res.status(500).json({ "error": "Database error finding user." });
        }
        if (!user) {
            return res.status(404).json({ "error": `User with wallet ${walletAddress} not found.` });
        }

        // 2. Find the submission using the user ID and dare ID
        const findSubmissionSql = "SELECT description, fileCID FROM submissions WHERE userId = ? AND dareId = ?";
        db.get(findSubmissionSql, [user.id, dareId], (err, submission) => {
            if (err) {
                console.error("Database error fetching submission:", err.message);
                return res.status(500).json({ "error": "Database error fetching submission." });
            }
            if (!submission) {
                return res.status(404).json({ "error": `No submission found for user ${walletAddress} on dare ${dareId}.` });
            }
            
            res.json({
                "message": "success",
                "data": submission
            });
        });
    });
});


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
    const { timeframe } = req.query; // timeframe is not used in the SQL query for now
    // Query to get users, order them by daresCompleted, and assign a rank
    const sql = `
        SELECT
            id,
            walletAddress AS name,
            avatar,
            daresCompleted AS score,
            (SELECT COUNT(*) FROM users AS u2 WHERE u2.daresCompleted >= u1.daresCompleted) AS rank,
            0 AS change, -- Placeholder for rank change
            daresCompleted,
            votingAccuracy AS successRate, -- Using votingAccuracy as successRate
            totalEarned,
            currentStreak AS streak,
            '[]' AS badges -- Placeholder for badges
        FROM
            users AS u1
        ORDER BY
            daresCompleted DESC;
    `;

    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Database error fetching leaderboard:", err.message);
            return res.status(500).json({ "error": "Database error fetching leaderboard" });
        }
        res.json({
            "message": "success",
            "data": rows
        });
    });
});

app.post("/api/profile/avatar", (req, res) => {
    const { walletAddress, avatarCid } = req.body;
    if (!walletAddress || !avatarCid) {
        return res.status(400).json({ "error": "walletAddress and avatarCid are required." });
    }

    const sql = `UPDATE users SET avatar = ? WHERE walletAddress = ?`;
    db.run(sql, [avatarCid, walletAddress], function (err) {
        if (err) {
            console.error("Database error updating avatar:", err.message);
            return res.status(500).json({ "error": "Database error updating avatar" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ "error": "User not found." });
        }
        res.json({ "message": "Avatar updated successfully." });
    });
});

app.get("/api/profile/stats", (req, res) => {
    // Note: This uses db.get, assuming 'users' table exists and only one row is returned/needed
    const sql = "SELECT * FROM users WHERE username = 'user'";
    db.get(sql, [], (err, row) => {
        if (err || !row) {
            // Providing mock data fallback
            return res.json({
                "message": "success (mocked)",
                "data": {
                    id: 5,
                    username: "user",
                    completedDares: 14,
                    successRate: 85,
                    totalEarned: 720,
                    totalUsers: 2847
                }
            });
        }
        res.json({
            "message": "success",
            "data": { ...row, totalUsers: 2847 }
        });
    });
});

app.get("/api/profile/achievements", (req, res) => {
    const { walletAddress } = req.query;
    console.log("Fetching achievements for wallet:", walletAddress);
    if (!walletAddress) {
        return res.status(400).json({ error: "walletAddress is required" });
    }

    const findUserSql = "SELECT * FROM users WHERE walletAddress = ?";
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err) {
            console.error("Database error fetching user for achievements:", err.message);
            return res.status(500).json({ error: "Database error fetching user data." });
        }
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }

        // Additional query to get the vote count for the user
        const countVotesSql = "SELECT COUNT(*) AS voteCount FROM votes WHERE userId = ?";
        db.get(countVotesSql, [user.id], (err, voteRow) => {
            if (err) {
                console.error("Database error fetching user votes for achievements:", err.message);
                return res.status(500).json({ error: "Database error fetching vote data." });
            }

            const votesCast = voteRow ? voteRow.voteCount : 0;

            // Define all possible achievements with their criteria
            const achievementsConfig = [
                { 
                    id: "first-dare", 
                    title: "First Steps", 
                    description: "Complete your first dare.", 
                    icon: "🎯",
                    criteria: (u) => u.daresCompleted >= 1,
                    getProgress: (u) => u.daresCompleted,
                    maxProgress: 1,
                },
                { 
                    id: "dare-novice", 
                    title: "Dare Novice", 
                    description: "Complete 5 dares.", 
                    icon: "💪",
                    criteria: (u) => u.daresCompleted >= 5,
                    getProgress: (u) => u.daresCompleted,
                    maxProgress: 5,
                },
                { 
                    id: "creator", 
                    title: "Creator", 
                    description: "Create your first dare.", 
                    icon: "💡",
                    criteria: (u) => u.daresCreated >= 1,
                    getProgress: (u) => u.daresCreated,
                    maxProgress: 1,
                },
                { 
                    id: "voter", 
                    title: "Community Voice", 
                    description: "Vote on 10 submissions.", 
                    icon: "🗳️",
                    criteria: (u, vc) => vc >= 10,
                    getProgress: (u, vc) => vc,
                    maxProgress: 10,
                },
                { 
                    id: "high-earner", 
                    title: "High Earner", 
                    description: "Earn a total of 500 reward points.", 
                    icon: "💰",
                    criteria: (u) => u.totalEarned >= 500,
                    getProgress: (u) => Math.floor(u.totalEarned),
                    maxProgress: 500,
                },
                { 
                    id: "streak-starter", 
                    title: "Streak Starter", 
                    description: "Maintain a 3-day streak.", 
                    icon: "🔥",
                    criteria: (u) => u.currentStreak >= 3,
                    getProgress: (u) => u.currentStreak,
                    maxProgress: 3,
                },
                { 
                    id: "streak-master", 
                    title: "Streak Master", 
                    description: "Maintain a 7-day streak.", 
                    icon: "🏆",
                    criteria: (u) => u.currentStreak >= 7,
                    getProgress: (u) => u.currentStreak,
                    maxProgress: 7,
                },
            ];

            // Process achievements based on user data
            const userAchievements = achievementsConfig.map(ach => {
                const isUnlocked = ach.criteria(user, votesCast);
                const currentProgress = ach.getProgress(user, votesCast);

                return {
                    id: ach.id,
                    title: ach.title,
                    description: ach.description,
                    icon: ach.icon,
                    unlocked: isUnlocked,
                    progress: isUnlocked ? ach.maxProgress : currentProgress,
                    maxProgress: ach.maxProgress,
                };
            });

            res.json({ message: "success", data: userAchievements });
        });
    });
});

app.get("/api/profile/activities", (req, res) => {
    const { walletAddress } = req.query;
    console.log("Fetching activities for wallet:", walletAddress);
    if (!walletAddress) {
        return res.status(400).json({ error: "walletAddress is required" });
    }

    const sql = `
        SELECT 'completed' as type, d.title, ud.acceptedAt as timestamp, d.reward
        FROM user_dares ud
        JOIN dares d ON ud.dareId = d.id
        JOIN users u ON ud.userId = u.id
        WHERE u.walletAddress = ?
        ORDER BY ud.acceptedAt DESC
        LIMIT 10
    `;
    db.all(sql, [walletAddress], (err, rows) => {
        console.log(`SQL executed for activities of wallet ${walletAddress}.`,err);
        if (err) {
            return res.status(500).json({ error: "Database error fetching activities" });
        }
        console.log(`Raw activity rows for wallet ${walletAddress}:`, rows);
        const activities = rows.map(row => ({
            id: row.timestamp, // Using timestamp as a unique id for simplicity
            type: row.type,
            title: row.title,
            description: `Accepted '${row.title}'`,
            reward: row.reward,
            timestamp: row.timestamp,
            status: 'success', // Assuming all accepted dares are successful for now
        }));
        console.log(`Fetched ${activities.length} activities for wallet ${walletAddress}`);
        res.json({ message: "success", data: activities });
    });
});

app.get("/api/profile/:walletAddress", (req, res) => {
    const { walletAddress } = req.params;
    const sql = "SELECT * FROM users WHERE walletAddress = ?";
    db.get(sql, [walletAddress], (err, row) => {
        if (err) {
            console.error("Database error fetching profile:", err.message);
            return res.status(500).json({ "error": "Database error fetching profile" });
        }
        if (!row) {
            return res.status(404).json({ "error": "User not found." });
        }
        res.json({ "message": "success", "data": row });
    });
});

app.put('/api/notifications/mark-all-read', (req, res) => {
    const { walletAddress } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ error: 'walletAddress is required' });
    }

    const findUserSql = 'SELECT id FROM users WHERE walletAddress = ?';
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sql = 'UPDATE notifications SET isRead = 1 WHERE userId = ?';
        db.run(sql, [user.id], function (err) {
            if (err) {
                return res.status(500).json({ error: 'Database error marking notifications as read' });
            }
            res.json({ message: 'All notifications marked as read.' });
        });
    });
});

// Settings Page Endpoints

// Update user profile
app.put('/api/profile', (req, res) => {
    const { walletAddress, displayName, bio } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ error: 'walletAddress is required' });
    }

    const sql = `UPDATE users SET displayName = ?, bio = ? WHERE walletAddress = ?`;
    db.run(sql, [displayName, bio, walletAddress], function (err) {
        if (err) {
            return res.status(500).json({ "error": "Database error updating profile" });
        }
        if (this.changes === 0) {
            return res.status(404).json({ "error": "User not found." });
        }
        res.json({ "message": "Profile updated successfully." });
    });
});

// Get notification settings
app.get('/api/settings/notifications/:walletAddress', (req, res) => {
    const { walletAddress } = req.params;
    const sql = `
        SELECT uns.dareUpdates, uns.comments, uns.submissionStatus
        FROM user_notification_settings uns
        JOIN users u ON uns.userId = u.id
        WHERE u.walletAddress = ?
    `;
    db.get(sql, [walletAddress], (err, row) => {
        if (err) {
            return res.status(500).json({ "error": "Database error fetching notification settings" });
        }
        if (!row) {
            // Return default settings if none are found
            return res.json({
                "message": "success",
                "data": {
                    "dareUpdates": true,
                    "comments": true,
                    "submissionStatus": true
                }
            });
        }
        res.json({ "message": "success", "data": row });
    });
});

// Update notification settings
app.put('/api/settings/notifications', (req, res) => {
    const { walletAddress, dareUpdates, comments, submissionStatus } = req.body;
    if (!walletAddress) {
        return res.status(400).json({ error: 'walletAddress is required' });
    }

    const findUserSql = 'SELECT id FROM users WHERE walletAddress = ?';
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const sql = `
            INSERT INTO user_notification_settings (userId, dareUpdates, comments, submissionStatus)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(userId) DO UPDATE SET
            dareUpdates = excluded.dareUpdates,
            comments = excluded.comments,
            submissionStatus = excluded.submissionStatus
        `;
        db.run(sql, [user.id, dareUpdates, comments, submissionStatus], function (err) {
            if (err) {
                return res.status(500).json({ "error": "Database error updating notification settings" });
            }
            res.json({ "message": "Notification settings updated successfully." });
        });
    });
});

// Delete user account
app.delete('/api/users/:walletAddress', (req, res) => {
    const { walletAddress } = req.params;
    const findUserSql = 'SELECT id FROM users WHERE walletAddress = ?';
    db.get(findUserSql, [walletAddress], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ error: 'User not found' });
        }
        const userId = user.id;

        db.serialize(() => {
            db.run("BEGIN TRANSACTION;");
            const tablesToDeleteFrom = [
                'dare_comment_likes', 'dare_comments', 'dare_likes',
                'notifications', 'submissions', 'user_dares', 'votes', 'user_notification_settings', 'users'
            ];

            tablesToDeleteFrom.forEach(table => {
                const condition = (table === 'users') ? 'id' : 'userId';
                db.run(`DELETE FROM ${table} WHERE ${condition} = ?`, [userId], function (err) {
                    if (err) {
                        console.error(`Error deleting from ${table}:`, err.message);
                        db.run("ROLLBACK;");
                        return res.status(500).json({ "error": `Database error deleting from ${table}` });
                    }
                });
            });

            db.run("COMMIT;", (err) => {
                if(err) {
                    console.error("Error committing transaction:", err.message);
                    return res.status(500).json({ "error": "Database error committing transaction" });
                }
                res.json({ "message": "User account deleted successfully." });
            });
        });
    });
});


console.log("Starting....")
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});