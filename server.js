const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// Route untuk validasi KEY
app.post("/login", (req, res) => {
    const { key } = req.body;
    const dataPath = path.join(__dirname, "keys.json");

    fs.readFile(dataPath, "utf-8", (err, data) => {
        if (err) return res.status(500).json({ error: "Internal server error" });

        const keys = JSON.parse(data);
        const member = keys.find((item) => item.key === key);

        if (member) {
            res.json({ success: true, member });
        } else {
            res.status(401).json({ success: false, message: "Invalid KEY" });
        }
    });
});

// Menjalankan server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
