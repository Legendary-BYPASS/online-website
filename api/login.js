import fs from "fs";
import path from "path";

export default (req, res) => {
    if (req.method === "POST") {
        const { key } = req.body;
        const dataPath = path.join(process.cwd(), "keys.json");

        fs.readFile(dataPath, "utf-8", (err, data) => {
            if (err) {
                console.error("Error reading keys.json:", err);
                return res.status(500).json({ error: "Internal server error" });
            }

            const keys = JSON.parse(data);
            const member = keys.find((item) => item.key === key);
            if (member) {
                res.json({ success: true, member });
            } else {
                res.status(401).json({ success: false, message: "Invalid KEY" });
            }
        });
    } else {
        res.status(405).json({ message: "Method not allowed" });
    }
};
