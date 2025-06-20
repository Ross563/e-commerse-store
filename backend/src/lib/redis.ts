import { Redis } from "ioredis";
import dotenv from "dotenv";

dotenv.config();

export const redis = new Redis({
  password: process.env.REDIS_PASSWORD as string,
  host: "redis-11513.c301.ap-south-1-1.ec2.redns.redis-cloud.com",
  port: 11513,
});

redis.on("connect", () => {
  console.log("Connected to Redis");
});
