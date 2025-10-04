const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "darex.db";

const db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
        console.error(err.message);
        throw err;
    } else {
        console.log('Connected to the SQLite database.');
        db.get("SELECT name FROM sqlite_master WHERE type='table' AND name='dares'", (err, table) => {
            if (err) {
                console.error("Error checking for tables:", err.message);
                return;
            }
            if (!table) {
                console.log("Creating and seeding new database...");
                db.serialize(() => {
                    db.run(`CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        walletAddress TEXT UNIQUE,
                        avatar TEXT,
                        displayName TEXT,
                        bio TEXT,
                        dareAccepted INTEGER DEFAULT 0,
                        daresCompleted INTEGER DEFAULT 0,
                        daresCreated INTEGER DEFAULT 0,
                        totalEarned REAL DEFAULT 0,
                        votingAccuracy INTEGER DEFAULT 0,
                        currentStreak INTEGER DEFAULT 0,
                        longestStreak INTEGER DEFAULT 0,
                        rank INTEGER DEFAULT 0
                    )`);

                    db.run(`CREATE TABLE user_notification_settings (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId INTEGER UNIQUE,
                        dareUpdates BOOLEAN DEFAULT 1,
                        comments BOOLEAN DEFAULT 1,
                        submissionStatus BOOLEAN DEFAULT 1,
                        FOREIGN KEY (userId) REFERENCES users (id)
                    )`);

                    db.run(`CREATE TABLE dares (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        title TEXT,
                        description TEXT,
                        reward REAL,
                        creator TEXT,
                        deadline TEXT,
                        difficulty TEXT,
                        participants INTEGER DEFAULT 0,
                        status TEXT,
                        category TEXT,
                        location TEXT,
                        featured BOOLEAN,
                        likes INTEGER DEFAULT 0,
                        comments INTEGER DEFAULT 0,
                        createdAt TEXT DEFAULT CURRENT_TIMESTAMP
                    )`);

                    db.run(`CREATE TABLE submissions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        dareId INTEGER,
                        userId INTEGER,
                        description TEXT,
                        fileCID TEXT,
                        timestamp TEXT,
                        status TEXT,
                        FOREIGN KEY (dareId) REFERENCES dares (id),
                        FOREIGN KEY (userId) REFERENCES users (id)
                    )`);

                    db.run(`CREATE TABLE votes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        submissionId INTEGER,
                        userId INTEGER,
                        vote TEXT,
                        FOREIGN KEY (submissionId) REFERENCES submissions (id),
                        FOREIGN KEY (userId) REFERENCES users (id)
                    )`);
                    
                    db.run(`CREATE TABLE user_dares (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId INTEGER,
                        dareId INTEGER,
                        status TEXT DEFAULT 'accepted',
                        acceptedAt TEXT,
                        FOREIGN KEY (userId) REFERENCES users (id),
                        FOREIGN KEY (dareId) REFERENCES dares (id),
                        UNIQUE (userId, dareId)
                    )`);

                    db.run(`CREATE TABLE dare_likes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId INTEGER,
                        dareId INTEGER,
                        FOREIGN KEY (userId) REFERENCES users (id),
                        FOREIGN KEY (dareId) REFERENCES dares (id),
                        UNIQUE (userId, dareId)
                    )`);

                    db.run(`CREATE TABLE dare_comments (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        dareId INTEGER,
                        userId INTEGER,
                        comment TEXT,
                        timestamp TEXT,
                        replyingTo INTEGER,
                        likes INTEGER DEFAULT 0,
                        FOREIGN KEY (dareId) REFERENCES dares (id),
                        FOREIGN KEY (userId) REFERENCES users (id),
                        FOREIGN KEY (replyingTo) REFERENCES dare_comments (id)
                    )`);
                    
                    db.run(`CREATE TABLE dare_comment_likes (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId INTEGER,
                        commentId INTEGER,
                        FOREIGN KEY (userId) REFERENCES users (id),
                        FOREIGN KEY (commentId) REFERENCES dare_comments (id),
                        UNIQUE (userId, commentId)
                    )`);

                    db.run(`CREATE TABLE notifications (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        userId INTEGER,
                        type TEXT,
                        message TEXT,
                        isRead BOOLEAN DEFAULT 0,
                        createdAt TEXT,
                        FOREIGN KEY (userId) REFERENCES users (id)
                    )`);

                    console.log('Database tables created.');
                });
            } else {
                console.log("Database already exists. Skipping creation.");
            }
        });
    }
});

module.exports = db;