import { Request, Response } from "express";
import db from "../lib/db.js";
import createProductTable from "../models/product.model.js";

createProductTable();

interface CartItem {
  id: number;
  user_id: number;
  product_id: number;
  quantity: number;
}

export const getCartProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryText = `
      SELECT p.*, ci.quantity
      FROM cart_items ci
      JOIN products p ON ci.product_id = p.id
      WHERE ci.user_id = $1
    `;
    const { rows: cartItems }: { rows: CartItem[] } = await db.query(
      queryText,
      [req.user?.id]
    );

    res.json(cartItems);
  } catch (error) {
    console.log(
      "Error in getCartProducts controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const addToCart = async (req: Request, res: Response): Promise<void> => {
  try {
    const { productId }: { productId: number } = req.body;

    const queryText = `
      INSERT INTO cart_items (user_id, product_id, quantity)
      VALUES ($1, $2, 1)
      ON CONFLICT (user_id, product_id)
      DO UPDATE SET quantity = cart_items.quantity + 1
      RETURNING *
    `;
    const { rows: cartItem }: { rows: CartItem[] } = await db.query(queryText, [
      req.user?.id,
      productId,
    ]);

    res.json(cartItem[0]);
  } catch (error) {
    console.log("Error in addToCart controller", (error as Error).message);
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const removeAllFromCart = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { productId }: { productId?: number } = req.params;
    const queryText = productId
      ? "DELETE FROM cart_items WHERE user_id = $1 AND product_id = $2"
      : "DELETE FROM cart_items WHERE user_id = $1";
    const params = productId ? [req.user?.id, productId] : [req.user?.id];

    await db.query(queryText, params);
    res.json({ message: "Cart updated successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const updateQuantity = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { id: productId } = req.params; // `id` comes from the URL params
    const { quantity }: { quantity: number } = req.body;

    if (!quantity || isNaN(Number(quantity))) {
      res.status(400).json({ message: "Invalid quantity provided" });
      return;
    }

    const queryText = `
      UPDATE cart_items
      SET quantity = $1
      WHERE user_id = $2 AND product_id = $3
      RETURNING *
    `;

    const { rows: cartItem }: { rows: CartItem[] } = await db.query(queryText, [
      quantity,
      req.user?.id,
      Number(productId),
    ]);

    if (cartItem.length === 0) {
      res.status(404).json({ message: "Product not found in cart" });
      return;
    }

    res.json(cartItem[0]);
  } catch (error) {
    console.error(
      "Error in updateQuantity controller",
      (error as Error).message
    );
    res.status(500).json({
      message: "Server error",
      error: (error as Error).message,
    });
  }
};
