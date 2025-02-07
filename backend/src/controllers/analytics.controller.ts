import db from "../lib/db.js";
import createUserTable from "../models/user.model.js";
import createProductTable from "../models/product.model.js";
import createOrderTable from "../models/order.model.js";
import { AnalyticsData, DailySalesData } from "../types/types.js";

createUserTable();
createProductTable();
createOrderTable();

export const getAnalyticsData = async (): Promise<AnalyticsData> => {
  const userQuery = "SELECT COUNT(*) FROM users";
  const productQuery = "SELECT COUNT(*) FROM products";
  const salesQuery = `
    SELECT COUNT(*) AS totalsales, SUM(total_amount) AS totalrevenue
    FROM orders
  `;

  const { rows: totalUsers } = await db.query(userQuery);
  const { rows: totalProducts } = await db.query(productQuery);
  const { rows: salesData } = await db.query(salesQuery);

  const { totalsales, totalrevenue } = salesData[0] || {
    totalsales: 0,
    totalrevenue: 0,
  };

  return {
    users: parseInt(totalUsers[0].count, 10),
    products: parseInt(totalProducts[0].count, 10),
    totalSales: parseInt(totalsales, 10),
    totalRevenue: parseFloat(totalrevenue),
  };
};

export const getDailySalesData = async (
  startDate: string,
  endDate: string
): Promise<DailySalesData[]> => {
  try {
    const salesQuery = `
      SELECT
        TO_CHAR(created_at, 'YYYY-MM-DD') AS date,
        COUNT(*) AS sales,
        SUM(total_amount) AS revenue
      FROM orders
      WHERE created_at BETWEEN $1 AND $2
      GROUP BY date
      ORDER BY date
    `;

    const { rows: dailySalesData } = await db.query(salesQuery, [
      startDate,
      endDate,
    ]);

    const dateArray = getDatesInRange(startDate, endDate);

    return dateArray.map((date) => {
      const foundData = dailySalesData.find((item) => item.date === date);

      return {
        date,
        sales: parseInt(foundData?.sales || "0", 10),
        revenue: parseFloat(foundData?.revenue || "0"),
      };
    });
  } catch (error) {
    throw new Error(
      `Error fetching daily sales data: ${(error as Error).message}`
    );
  }
};

function getDatesInRange(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  let currentDate = new Date(startDate);

  while (currentDate <= new Date(endDate)) {
    dates.push(currentDate.toISOString().split("T")[0]);
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}
