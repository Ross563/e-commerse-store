import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis({
  password: process.env.REDIS_PASSWORD as string,
  host: "redis-12939.c301.ap-south-1-1.ec2.redns.redis-cloud.com",
  port: 12939,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});
