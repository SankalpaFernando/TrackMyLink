import mongoose, { Schema } from "mongoose";
require('dotenv').config();

mongoose.connect(
  process.env.DATABASE_URL || "",
  (res) => {
    if(res===null) console.log("Database Connected")
  }
);

export default mongoose;