declare global {
  import { Mongoose } from 'mongoose';

  let mongoose: {
    conn: Mongoose | null;
    promise: Promise<Mongoose> | null;
  };
}
