import db from "../lib/db.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import createUserTable from "../models/user.model.js";
import { Request, Response } from "express";

createUserTable();

const generateTokens = (userId: number) => {
  const accessToken = jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN_SECRET || "udfhguijdji",
    {
      expiresIn: "7d",
    }
  );

  return { accessToken };
};

const setCookies = (res: Response, accessToken: string) => {
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
};

export const signup = async (req: Request, res: Response) => {
  const { email, password, name } = req.body;
  try {
    const queryText = "SELECT * FROM users WHERE email = $1";
    const { rows } = await db.query(queryText, [email]);

    if (rows.length > 0) {
      return res.status(400).json({ message: "User already exists" });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const insertText = `
      INSERT INTO users (name, email, password)
      VALUES ($1, $2, $3)
      RETURNING id, name, email, role
    `;
    const { rows: newUser } = await db.query(insertText, [
      name,
      email,
      hashedPassword,
    ]);

    const { accessToken } = generateTokens(newUser[0].id);
    setCookies(res, accessToken);

    res.status(201).json(newUser[0]);
  } catch (error) {
    console.log("Error in signup controller", (error as Error).message);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    const queryText = "SELECT * FROM users WHERE email = $1";
    const { rows } = await db.query(queryText, [email]);

    if (rows.length > 0 && (await bcrypt.compare(password, rows[0].password))) {
      const { accessToken } = generateTokens(rows[0].id);
      setCookies(res, accessToken);

      res.json({
        id: rows[0].id,
        name: rows[0].name,
        email: rows[0].email,
        role: rows[0].role,
      });
    } else {
      res.status(400).json({ message: "Invalid email or password" });
    }
  } catch (error) {
    console.log("Error in login controller", (error as Error).message);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const changeRole = async (req: Request, res: Response) => {
  try {
    const userId = req.user!.id;
    const queryText = `
        UPDATE users
        SET role =  'admin'
        WHERE id = $1
        RETURNING *
      `;
    const { rows } = await db.query(queryText, [userId]);

    res.json({
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
    });
  } catch (error) {
    console.log("Error in changeRole controller", (error as Error).message);
    res.status(500).json({ message: (error as Error).message });
  }
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    res.clearCookie("accessToken");
    res.json({ message: "Logged out successfully" });
  } catch (error) {
    console.log("Error in logout controller", (error as Error).message);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const getProfile = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const user = req.user;
    res.json(user);
  } catch (error) {
    console.error("Error in getProfile controller", (error as Error).message);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};
