import jwt, { JwtPayload } from "jsonwebtoken";
import db from "../lib/db.js";
import { NextFunction, Request, Response } from "express";

export const protectRoute = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const accessToken: string | undefined = req.cookies.accessToken;

    if (!accessToken) {
      res
        .status(401)
        .json({ message: "Unauthorized - No access token provided" });
      return;
    }

    try {
      const decoded = jwt.verify(
        accessToken,
        process.env.ACCESS_TOKEN_SECRET as string
      ) as JwtPayload;

      const queryText = "SELECT id, name, email, role FROM users WHERE id = $1";
      const { rows } = await db.query(queryText, [decoded.userId]);

      if (rows.length === 0) {
        res.status(401).json({ message: "User not found" });
        return;
      }

      // Attach the user details to the request object
      req.user = rows[0];

      next();
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        res
          .status(401)
          .json({ message: "Unauthorized - Access token expired" });
        return;
      }
      throw error;
    }
  } catch (error) {
    console.error("Error in protectRoute middleware", (error as Error).message);
    res.status(401).json({ message: "Unauthorized - Invalid access token" });
    return;
  }
};

export const adminRoute = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied - Admin only" });
    return;
  }
};
