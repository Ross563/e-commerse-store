import { redis } from "../lib/redis.js";
import cloudinary from "../lib/cloudinary.js";
import db from "../lib/db.js";
import createProductTable from "../models/product.model.js";
import { Request, Response } from "express";
import { Product } from "../types/types.js";

createProductTable();

export const getAllProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryText = "SELECT * FROM products";
    const { rows: products } = await db.query(queryText);
    res.json({ products });
  } catch (error) {
    console.error(
      "Error in getAllProducts controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const getFeaturedProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    let fProducts = await redis.get("featured_products");
    if (fProducts) {
      res.json(JSON.parse(fProducts));
      return;
    }

    const queryText = "SELECT * FROM products WHERE is_featured = true";
    const { rows: featuredProducts } = await db.query(queryText);

    if (!featuredProducts.length) {
      res.status(404).json({ message: "No featured products found" });
      return;
    }

    await redis.set("featured_products", JSON.stringify(featuredProducts));

    res.json(featuredProducts);
  } catch (error) {
    console.error(
      "Error in getFeaturedProducts controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const createProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { name, description, price, category }: Product = req.body;
    let imageUrl = "";

    if (req.file && req.file.buffer) {
      const { buffer: imageBuffer } = req.file;
      const base64Image = imageBuffer.toString("base64");
      const mimeType = req.file.mimetype.split("/")[1];
      const uploadResponse = await cloudinary.uploader.upload(
        `data:image/${mimeType};base64,${base64Image}`,
        { folder: "products" }
      );
      imageUrl = uploadResponse.secure_url;
    }

    const queryText = `
      INSERT INTO products (name, description, price, image, category)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    const { rows: product } = await db.query(queryText, [
      name,
      description,
      price,
      imageUrl,
      category,
    ]);

    res.status(201).json(product[0]);
  } catch (error) {
    console.error(
      "Error in createProduct controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const deleteProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryText = "SELECT * FROM products WHERE id = $1";
    const { rows: product } = await db.query(queryText, [req.params.id]);

    if (!product.length) {
      res.status(404).json({ message: "Product not found" });
      return;
    }

    if (product[0].image) {
      const publicId = product[0].image.split("/").pop()?.split(".")[0];
      try {
        await cloudinary.uploader.destroy(`products/${publicId}`);
      } catch (error) {
        console.error("Error deleting image from Cloudinary", error);
      }
    }

    const deleteText = "DELETE FROM products WHERE id = $1";
    await db.query(deleteText, [req.params.id]);

    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error(
      "Error in deleteProduct controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const getRecommendedProducts = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryText = `
      SELECT id, name, description, image, price
      FROM products
      ORDER BY RANDOM()
      LIMIT 4
    `;
    const { rows: products } = await db.query(queryText);

    res.json(products);
  } catch (error) {
    console.error(
      "Error in getRecommendedProducts controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const getProductsByCategory = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { category } = req.params;
  try {
    const queryText = "SELECT * FROM products WHERE category = $1";
    const { rows: products } = await db.query(queryText, [category]);
    res.json({ products });
  } catch (error) {
    console.error(
      "Error in getProductsByCategory controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

export const toggleFeaturedProduct = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const queryText = "SELECT * FROM products WHERE id = $1";
    const { rows: product } = await db.query(queryText, [req.params.id]);

    if (product.length > 0) {
      const updateText = `
        UPDATE products
        SET is_featured = NOT is_featured
        WHERE id = $1
        RETURNING *
      `;
      const { rows: updatedProduct } = await db.query(updateText, [
        req.params.id,
      ]);
      await updateFeaturedProductsCache();
      res.json(updatedProduct[0]);
    } else {
      res.status(404).json({ message: "Product not found" });
    }
  } catch (error) {
    console.error(
      "Error in toggleFeaturedProduct controller",
      (error as Error).message
    );
    res
      .status(500)
      .json({ message: "Server error", error: (error as Error).message });
  }
};

async function updateFeaturedProductsCache(): Promise<void> {
  try {
    const queryText = "SELECT * FROM products WHERE is_featured = true";
    const { rows: featuredProducts } = await db.query(queryText);
    await redis.set("featured_products", JSON.stringify(featuredProducts));
  } catch (error) {
    console.error("Error in update cache function", error);
  }
}
