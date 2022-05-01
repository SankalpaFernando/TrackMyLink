import mongoose from "../db";
import { Schema } from "mongoose";

interface IUser {
  _id: number;
  name: String;
}

const UserSchema = new Schema<IUser>({
  _id: { type: Number, required: true },
  name: { type: String, required: true },
});

export default mongoose.model<IUser>('User', UserSchema);
