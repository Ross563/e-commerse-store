import express, { Request, Response } from "express";
import { adminRoute, protectRoute } from "../middleware/auth.middleware.js";
import {
  getAnalyticsData,
  getDailySalesData,
} from "../controllers/analytics.controller.js";

const router = express.Router();

router.get(
  "/",
  protectRoute,
  adminRoute,
  async (req: Request, res: Response) => {
    try {
      const analyticsData = await getAnalyticsData();

      const endDate = new Date();
      const startDate = new Date(endDate.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

      const dailySalesData = await getDailySalesData(
        startDate.toISOString().split("T")[0],
        endDate.toISOString().split("T")[0]
      );

      res.json({
        analyticsData,
        dailySalesData,
      });
    } catch (error) {
      console.log("Error in analytics route", (error as Error).message);
      res.status(500).json({
        message: "Server error",
        error: (error as Error).message,
      });
    }
  }
);

export default router;
