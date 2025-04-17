import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/harucare';

if (!MONGODB_URI) {
  throw new Error(
    'MongoDB URI가 설정되지 않았습니다. .env 파일에 MONGODB_URI를 설정해주세요.'
  );
}

/**
 * 전역 mongoose 연결 객체 관리
 */
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log('MongoDB 연결 성공');
      return mongoose;
    }).catch((error) => {
      console.error('MongoDB 연결 오류:', error);
      throw error;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;