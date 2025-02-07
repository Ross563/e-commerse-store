declare module "jsonwebtoken";
declare module "bcryptjs";
declare module "express";
declare module "cookie-parser";
declare module "cors";
declare module "pg";
declare module "multer";

import { Request } from "express";

declare module "express" {
  interface Request {
    user?: {
      id: number;
      name?: string;
      email?: string;
      role?: string;
      created_at?: Date;
    };
  }
}
