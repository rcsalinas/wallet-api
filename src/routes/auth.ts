import { Router, Request, Response } from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import pool from "../db";

const router = Router();

router.post("/signup", async (req: Request, res: Response): Promise<any> => {
	const { email, password } = req.body;
	if (!email || !password)
		return res
			.status(400)
			.json({ error: "Email and password are required" });

	try {
		// Verifica si ya existe el usuario
		const result = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email]
		);
		if (result.rows.length > 0)
			return res.status(400).json({ error: "Email already in use" });

		// Encripta la contraseña
		const hashedPassword = await bcrypt.hash(password, 10);

		// Inserta el nuevo usuario
		await pool.query(
			"INSERT INTO users (email, password) VALUES ($1, $2)",
			[email, hashedPassword]
		);

		res.status(201).json({ message: "User registered successfully" });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/signin", async (req: Request, res: Response): Promise<any> => {
	const { email, password } = req.body;
	if (!email || !password)
		return res
			.status(400)
			.json({ error: "Email and password are required" });

	try {
		const result = await pool.query(
			"SELECT * FROM users WHERE email = $1",
			[email]
		);
		const user = result.rows[0];
		if (!user)
			return res.status(401).json({ error: "Invalid credentials" });

		const passwordMatch = await bcrypt.compare(password, user.password);
		if (!passwordMatch)
			return res.status(401).json({ error: "Invalid credentials" });

		const token = jwt.sign(
			{ userId: user.id },
			process.env.JWT_SECRET as string,
			{ expiresIn: "1h" }
		);
		res.json({ token });
	} catch (err) {
		res.status(500).json({ error: "Internal server error" });
	}
});

router.post("/signout", (req, res) => {
	res.json({ message: "Signed out" });
});

export default router;
