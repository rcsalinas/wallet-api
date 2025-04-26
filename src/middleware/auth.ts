import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

export interface AuthRequest extends Request {
	user?: { userId: string };
}

export function authenticateJWT(
	req: AuthRequest,
	res: Response,
	next: NextFunction
): void {
	const authHeader = req.headers.authorization;
	if (!authHeader) {
		res.status(401).json({ error: "No token provided" });
		return;
	}

	const [scheme, token] = authHeader.split(" ");

	if (scheme !== "Bearer" || !token) {
		res.status(401).json({ error: "Invalid authorization header format" });
		return;
	}

	try {
		const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as {
			userId: string;
		};
		req.user = { userId: decoded.userId };
		next();
	} catch (error) {
		res.status(401).json({ error: "Invalid or expired token" });
		return;
	}
}
