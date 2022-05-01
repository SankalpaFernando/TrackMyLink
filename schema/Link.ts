import mongoose from '../db';
import { Schema } from 'mongoose';

interface ILink {
  name: String;
  link: String;
  uid: Object;
}

const LinkSchema = new Schema<ILink>({
  name: { type: String, required: true },
  link: { type: String, required: true },
  uid: { type: Schema.Types.Number, ref: "User",key:"_id" }
});

export default mongoose.model<ILink>('Link', LinkSchema);
