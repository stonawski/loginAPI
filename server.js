const express = require("express");
const bodyParser = require("body-parser");
const sqlite3 = require("sqlite3").verbose();
const fs = require("fs");
const cors = require("cors");

const app = express();
const PORT = 3001;
const DB_FILE = "users.db";

app.use(cors());

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Check if the SQLite database file exists
const dbExists = fs.existsSync(DB_FILE);

// Connect to SQLite database
const db = new sqlite3.Database(DB_FILE);

// Create users table if the database file doesn't exist
if (!dbExists) {
  db.serialize(() => {
    db.run(
      "CREATE TABLE users (id INTEGER PRIMARY KEY, username TEXT, email TEXT, password TEXT, likedMovies TEXT)"
    );

    // Insert sample users for demonstration
    const insertUser = db.prepare(
      "INSERT INTO users (username, email, password, likedMovies) VALUES (?, ?, ?, ?)"
    );
    insertUser.run("admin", "admin@example.com", "admin", '{"movies": []}');
    insertUser.finalize();
  });
}

// Authentication endpoint
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  console.log("The api was called!");
  // Check if the username and password match a user in the database
  db.get(
    "SELECT * FROM users WHERE email = ? AND password = ?",
    [email, password],
    (err, row) => {
      if (err) {
        console.error("Database error:", err.message);
        res.status(500).json({ error: "Internal server error" });
      } else if (row) {
        // Successful authentication
        res
          .status(200)
          .json({ id: row.id, username: row.username, email: row.email });
      } else {
        // Authentication failed
        res.status(401).json({ error: "Invalid credentials" });
      }
    }
  );
});

// Register endpoint
app.post("/api/register", (req, res) => {
  const { email, password, username } = req.body;

  // Check if the email already exists
  db.get("SELECT * FROM users WHERE email = ?", [email], (err, row) => {
    if (err) {
      console.error("Database error:", err.message);
      res.status(500).json({ error: "Internal server error" });
    } else if (row) {
      // Email already exists
      res.status(400).json({ error: "Account already exists" });
    } else {
      // Email doesn't exist, insert the new user
      db.run(
        "INSERT INTO users (username, email, password, likedMovies) VALUES (?, ?, ?, ?)",
        [username, email, password, ""],
        function (err) {
          if (err) {
            console.error("Database error:", err.message);
            res.status(500).json({ error: "Internal server error" });
          } else {
            // User successfully registered
            res.status(201).json({ message: "User registered successfully" });
          }
        }
      );
    }
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
