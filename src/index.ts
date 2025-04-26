import express from "express";
import pool from "./db";

import authRoutes from "./routes/auth";
import walletRoutes from "./routes/wallets";

const app = express();
app.use(express.json());
app.use("/api", authRoutes);
app.use("/api", walletRoutes);

app.get("/", (_, res) => {
	res.send("API Running");
});

app.get("/db-test", async (_, res) => {
	try {
		const result = await pool.query("SELECT NOW()");
		res.json(result.rows[0]);
	} catch (err) {
		console.error(err);
		res.status(500).json({ error: "Database connection failed" });
	}
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
