import db from "../lib/db.js";

const createUserTable = async (): Promise<void> => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role VARCHAR(10) DEFAULT 'customer',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS cart_items (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      product_id INTEGER REFERENCES products(id),
      quantity INTEGER DEFAULT 1
    );
  `;

  try {
    await db.query(queryText);
    console.log("User and cart_items tables created if not exists");
  } catch (error) {
    console.log("Error creating users and cart_items tables: ", error);
  }
};

export default createUserTable;
