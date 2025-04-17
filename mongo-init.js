// MongoDB 초기화 스크립트
db = db.getSiblingDB(process.env.MONGO_INITDB_DATABASE || 'harucare');

// 사용자 생성 및 권한 부여
db.createUser({
  user: process.env.MONGO_INITDB_ROOT_USERNAME || 'harucare_user',
  pwd: process.env.MONGO_INITDB_ROOT_PASSWORD || 'harucare_password',
  roles: [
    {
      role: 'readWrite',
      db: process.env.MONGO_INITDB_DATABASE || 'harucare'
    },
    {
      role: 'dbAdmin',
      db: process.env.MONGO_INITDB_DATABASE || 'harucare'
    }
  ]
});

// 컬렉션 생성
db.createCollection('users');
db.createCollection('fitbit_activities');

// 인덱스 생성
db.users.createIndex({ "email": 1 }, { unique: true });
db.fitbit_activities.createIndex({ "userId": 1, "date": 1 }, { unique: true });