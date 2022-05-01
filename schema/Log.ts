import mongoose from '../db';
import { Schema, SchemaTypes } from 'mongoose';

interface ILog {
  linkID: Object;
  dateTime: Date;
  location: Object;
  type: string;
}

const LogSchema = new Schema<ILog>({
  linkID: { type: Schema.Types.ObjectId, ref:"Link" },
  dateTime: { type: Date, required: true },
  location: { type: Schema.Types.Map },
  type: {type: String}
});

export default mongoose.model<ILog>('Log', LogSchema);
