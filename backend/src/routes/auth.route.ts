import express, { Request, Response } from "express";
import {
  login,
  logout,
  signup,
  changeRole,
  getProfile,
} from "../controllers/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/signup", async (req: Request, res: Response) => {
  try {
    await signup(req, res);
  } catch (error) {
    console.error("Error in signup route:", error);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
});

router.post("/login", async (req: Request, res: Response) => {
  try {
    await login(req, res);
  } catch (error) {
    console.error("Error in login route:", error);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
});

router.post("/logout", async (req: Request, res: Response) => {
  try {
    await logout(req, res);
  } catch (error) {
    console.error("Error in logout route:", error);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
});

router.post(
  "/change-role",
  protectRoute,
  async (req: Request, res: Response) => {
    try {
      await changeRole(req, res);
    } catch (error) {
      console.error("Error in changeRole route:", error);
      res
        .status(500)
        .json({ message: "Server error", error: (error as Error).message });
    }
  }
);

router.get("/profile", protectRoute, async (req: Request, res: Response) => {
  try {
    await getProfile(req, res);
  } catch (error) {
    console.error("Error in profile route:", error);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
});

export default router;
