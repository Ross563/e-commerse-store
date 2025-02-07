import db from "../lib/db.js";

const createCouponTable = async () => {
  const queryText = `
    CREATE TABLE IF NOT EXISTS coupons (
      id SERIAL PRIMARY KEY,
      code VARCHAR(255) UNIQUE NOT NULL,
      discount_percentage DECIMAL(5, 2) CHECK (discount_percentage >= 0 AND discount_percentage <= 100) NOT NULL,
      expiration_date TIMESTAMP NOT NULL,
      is_active BOOLEAN DEFAULT TRUE,
      user_id INTEGER REFERENCES users(id)
    );
  `;

  try {
    await db.query(queryText);
    console.log("Coupon table created if not exists");
  } catch (error) {
    console.log("Error creating coupons table: ", error);
  }
};

export default createCouponTable;
