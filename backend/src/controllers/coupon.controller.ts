import db from "../lib/db.js";
import createCouponTable from "../models/coupon.model.js";
import { Request, Response } from "express";
import { Coupon } from "../types/types.js";

createCouponTable();

export const getCoupon = async (req: Request, res: Response): Promise<void> => {
  try {
    const queryText = `
      SELECT * FROM coupons
      WHERE user_id = $1 AND is_active = true
    `;
    const { rows: coupon }: { rows: Coupon[] } = await db.query(queryText, [
      req.user?.id,
    ]);
    res.json(coupon[0] || null);
  } catch (error) {
    console.error("Error in getCoupon controller", (error as Error).message);
    res.status(500).json({
      message: "Server error",
      error: (error as Error).message,
    });
  }
};

export const validateCoupon = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { code }: { code: string } = req.body;
    const queryText = `
      SELECT * FROM coupons
      WHERE code = $1 AND user_id = $2 AND is_active = true
    `;
    const { rows: coupon }: { rows: Coupon[] } = await db.query(queryText, [
      code,
      req.user?.id,
    ]);

    if (coupon.length === 0) {
      res.status(404).json({ message: "Coupon not found" });
      return;
    }

    if (new Date(coupon[0].expiration_date) < new Date()) {
      const updateText = `
        UPDATE coupons
        SET is_active = false
        WHERE id = $1
      `;
      await db.query(updateText, [coupon[0].id]);
      res.status(404).json({ message: "Coupon expired" });
      return;
    }

    res.json({
      message: "Coupon is valid",
      code: coupon[0].code,
      discount_percentage: coupon[0].discount_percentage,
    });
  } catch (error) {
    console.error(
      "Error in validateCoupon controller",
      (error as Error).message
    );
    res.status(500).json({
      message: "Server error",
      error: (error as Error).message,
    });
  }
};
