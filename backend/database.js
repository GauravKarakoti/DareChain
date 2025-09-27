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
            // If the dares table doesn't exist, it's a new database.
            if (!table) {
                console.log("Creating and seeding new database...");
                db.serialize(() => {
                    db.run(`CREATE TABLE users (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        username TEXT UNIQUE,
                        password TEXT,
                        avatar TEXT,
                        daresCompleted INTEGER DEFAULT 0,
                        daresCreated INTEGER DEFAULT 0,
                        totalEarned REAL DEFAULT 0,
                        votingAccuracy INTEGER DEFAULT 85,
                        currentStreak INTEGER DEFAULT 5,
                        longestStreak INTEGER DEFAULT 8,
                        rank INTEGER DEFAULT 156
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
                        featured BOOLEAN
                    )`);

                    db.run(`CREATE TABLE submissions (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        dareId INTEGER,
                        userId INTEGER,
                        description TEXT,
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

                    // Seed initial data
                    const insertUser = `INSERT INTO users (username, password, avatar) VALUES (?,?,?)`;
                    db.run(insertUser, ["user", "password", "U"]);

                    const insertDare = `INSERT INTO dares (title, description, reward, creator, deadline, difficulty, participants, status, category, location, featured) VALUES (?,?,?,?,?,?,?,?,?,?,?)`;
                    const dares = [
                        ["Dance for 30 seconds in public", "Show off your moves in a busy public space and record it! Extra points for creativity and crowd reaction.", 5, "Alice", "2 days", "Easy", 12, "active", "Performance", "Any public space", true],
                        ["Learn a new language phrase", "Record yourself speaking a 10-word phrase in a language you don't know. Must include pronunciation guide.", 3, "Bob", "1 week", "Medium", 8, "active", "Learning", null, false],
                        ["Random act of kindness", "Do something nice for a stranger and capture the moment. Show the impact of your kindness.", 10, "Charlie", "3 days", "Easy", 25, "voting", "Social Good", null, true],
                        ["Create art with recycled materials", "Make something beautiful from trash. Show before and after photos of your materials.", 8, "Diana", "5 days", "Medium", 15, "active", "Creative", null, false],
                        ["Compliment 5 strangers genuinely", "Spread positivity by giving genuine compliments to 5 different people. Record their reactions.", 6, "Eve", "1 day", "Hard", 3, "active", "Social Good", null, false]
                    ];

                    dares.forEach((dare) => {
                        db.run(insertDare, dare);
                    });
                    console.log('Database tables created and seeded.');
                });
            } else {
                console.log("Database already exists. Skipping creation and seeding.");
            }
        });
    }
});

module.exports = db;