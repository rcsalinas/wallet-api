import { Router } from "express";
import pool from "../db";
import { authenticateJWT, AuthRequest } from "../middleware/auth";

const router = Router();

// Get all wallets for authenticated user
router.get("/wallets", authenticateJWT, async (req: AuthRequest, res) => {
	try {
		const userId = req.user!.userId;
		const result = await pool.query(
			"SELECT * FROM wallets WHERE user_id = $1",
			[userId]
		);
		res.json(result.rows);
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// Create new wallet
router.post("/wallets", authenticateJWT, async (req: AuthRequest, res) => {
	const { tag, chain, address } = req.body;
	if (!chain || !address) {
		res.status(400).json({ error: "Chain and address are required" });
		return;
	}
	try {
		const userId = req.user!.userId;

		// Verify address uniqueness
		const exists = await pool.query(
			"SELECT * FROM wallets WHERE address = $1",
			[address]
		);
		if (exists.rows.length > 0) {
			res.status(400).json({ error: "Address already exists" });
			return;
		}

		const result = await pool.query(
			`INSERT INTO wallets (user_id, tag, chain, address)
            VALUES ($1, $2, $3, $4) RETURNING *`,
			[userId, tag, chain, address]
		);
		res.status(201).json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// Get specific wallet by id
router.get("/wallets/:id", authenticateJWT, async (req: AuthRequest, res) => {
	const userId = req.user!.userId;
	const walletId = req.params.id;
	try {
		const result = await pool.query(
			"SELECT * FROM wallets WHERE id = $1 AND user_id = $2",
			[walletId, userId]
		);
		if (result.rows.length === 0) {
			res.status(404).json({ error: "Wallet not found" });
			return;
		}
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// Update wallet by id
router.put("/wallets/:id", authenticateJWT, async (req: AuthRequest, res) => {
	const { tag, chain, address } = req.body;
	const userId = req.user!.userId;
	const walletId = req.params.id;

	if (!chain && !address && !tag) {
		res.status(400).json({ error: "At least one field required" });
		return;
	}

	try {
		// Check wallet exists and belongs to user
		const found = await pool.query(
			"SELECT * FROM wallets WHERE id = $1 AND user_id = $2",
			[walletId, userId]
		);
		if (found.rows.length === 0) {
			res.status(404).json({ error: "Wallet not found" });
			return;
		}

		// If updating address, ensure uniqueness
		if (address) {
			const exists = await pool.query(
				"SELECT * FROM wallets WHERE address = $1 AND id <> $2",
				[address, walletId]
			);
			if (exists.rows.length > 0) {
				res.status(400).json({ error: "Address already exists" });
				return;
			}
		}

		const updates = [];
		const values = [];
		let idx = 1;
		if (tag !== undefined) {
			updates.push(`tag = $${idx++}`);
			values.push(tag);
		}
		if (chain !== undefined) {
			updates.push(`chain = $${idx++}`);
			values.push(chain);
		}
		if (address !== undefined) {
			updates.push(`address = $${idx++}`);
			values.push(address);
		}
		values.push(walletId, userId);

		const result = await pool.query(
			`UPDATE wallets SET ${updates.join(
				", "
			)} WHERE id = $${idx} AND user_id = $${idx + 1} RETURNING *`,
			values
		);
		res.json(result.rows[0]);
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

// Delete wallet by id
router.delete(
	"/wallets/:id",
	authenticateJWT,
	async (req: AuthRequest, res) => {
		const userId = req.user!.userId;
		const walletId = req.params.id;
		try {
			const result = await pool.query(
				"DELETE FROM wallets WHERE id = $1 AND user_id = $2 RETURNING *",
				[walletId, userId]
			);
			if (result.rows.length === 0) {
				res.status(404).json({
					error: "Wallet not found or not yours",
				});
				return;
			}
			res.json({ message: "Wallet deleted" });
		} catch (err) {
			res.status(500).json({ error: "Internal server error" });
		}
	}
);

export default router;
