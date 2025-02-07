import db from "../lib/db.js";

const createOrderTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS orders (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
    );

    CREATE TABLE IF NOT EXISTS order_products (
      id SERIAL PRIMARY KEY,
      order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER CHECK (quantity >= 1) NOT NULL,
      price DECIMAL(10, 2) CHECK (price >= 0) NOT NULL
    );
  `;

  try {
    await db.query(queryText);
    console.log("Order and order_products tables created if not exists");
  } catch (error) {
    console.log("Error creating orders and order_products tables: ", error);
  }
};

export default createOrderTable;
