import db from "../lib/db.js";

const createProductTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT NOT NULL,
      price DECIMAL(10, 2) CHECK (price >= 0) NOT NULL,
      image TEXT NOT NULL,
      category VARCHAR(255) NOT NULL,
      is_featured BOOLEAN DEFAULT FALSE
    )
  `;

  try {
    await db.query(queryText);
    console.log("Product table created if not exists");
  } catch (error) {
    console.log("Error creating products table: ", error);
  }
};

export default createProductTable;
