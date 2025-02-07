import db from "../lib/db.js";
import { stripe } from "../lib/stripe.js";
import createOrderTable from "../models/order.model.js";
import createCouponTable from "../models/coupon.model.js";
import { Request, Response } from "express";
import { Coupon, Product } from "../types/types.js";

createOrderTable();
createCouponTable();

export const createCheckoutSession = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const {
      products,
      couponCode,
    }: { products: Product[]; couponCode?: string } = req.body;

    if (!Array.isArray(products) || products.length === 0) {
      res.status(400).json({ error: "Invalid or empty products array" });
      return;
    }

    let totalAmount = 0;

    const lineItems = products.map((product) => {
      const amount = Math.round(product.price * 100);
      totalAmount += amount * (product.quantity || 1);

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: product.name,
            images: [product.image],
          },
          unit_amount: amount,
        },
        quantity: product.quantity || 1,
      };
    });

    let coupon: Coupon | null = null;
    if (couponCode) {
      const queryText = `
        SELECT * FROM coupons
        WHERE code = $1 AND user_id = $2 AND is_active = true
      `;
      const { rows } = await db.query(queryText, [couponCode, req.user?.id]);
      coupon = rows[0] || null;

      if (coupon) {
        totalAmount -= Math.round(
          (totalAmount * coupon.discount_percentage) / 100
        );
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/purchase-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/purchase-cancel`,
      discounts: coupon
        ? [
            {
              coupon: await createStripeCoupon(coupon.discount_percentage),
            },
          ]
        : [],
      metadata: {
        userId: req.user?.id?.toString() || "",
        couponCode: couponCode || "",
        products: JSON.stringify(
          products.map((p) => ({
            id: p.id,
            quantity: p.quantity,
            price: p.price,
          }))
        ),
      },
    });

    if (totalAmount >= 20000) {
      await createNewCoupon(req.user?.id as number);
    }

    res.status(200).json({ id: session.id, totalAmount: totalAmount / 100 });
  } catch (error) {
    console.error("Error processing checkout:", (error as Error).message);
    res.status(500).json({
      message: "Error processing checkout",
      error: (error as Error).message,
    });
  }
};

export const checkoutSuccess = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { sessionId }: { sessionId: string } = req.body;
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      if (session.metadata?.couponCode) {
        const queryText = `
          UPDATE coupons
          SET is_active = false
          WHERE code = $1 AND user_id = $2
        `;
        await db.query(queryText, [
          session.metadata?.couponCode,
          session.metadata?.userId,
        ]);
      }

      const products: Product[] = JSON.parse(session.metadata!.products);
      const insertText = `
        INSERT INTO orders (user_id, products, total_amount, stripe_session_id)
        VALUES ($1, $2, $3, $4)
        RETURNING id
      `;
      const { rows: newOrder } = await db.query(insertText, [
        session.metadata?.userId,
        JSON.stringify(products),
        session.amount_total ? session.amount_total / 100 : 0,
        sessionId,
      ]);

      res.status(200).json({
        success: true,
        message:
          "Payment successful, order created, and coupon deactivated if used.",
        orderId: newOrder[0].id,
      });
    }
  } catch (error) {
    console.error(
      "Error processing successful checkout:",
      (error as Error).message
    );
    res.status(500).json({
      message: "Error processing successful checkout",
      error: (error as Error).message,
    });
  }
};

async function createStripeCoupon(discountPercentage: number): Promise<string> {
  const coupon = await stripe.coupons.create({
    percent_off: discountPercentage,
    duration: "once",
  });

  return coupon.id;
}

async function createNewCoupon(userId: number): Promise<Coupon> {
  const deleteText = "DELETE FROM coupons WHERE user_id = $1";
  await db.query(deleteText, [userId]);

  const insertText = `
    INSERT INTO coupons (code, discount_percentage, expiration_date, user_id)
    VALUES ($1, $2, $3, $4)
    RETURNING *
  `;
  const newCoupon = await db.query(insertText, [
    "GIFT" + Math.random().toString(36).substring(2, 8).toUpperCase(),
    10,
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    userId,
  ]);

  return newCoupon.rows[0];
}
