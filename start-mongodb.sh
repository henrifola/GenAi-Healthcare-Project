#!/bin/bash

# .env.local 파일 읽기
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
  echo "환경 변수를 .env.local 파일에서 불러왔습니다."
else
  echo ".env.local 파일이 없습니다. 기본 설정을 사용합니다."
fi

# Docker Compose 실행
docker-compose up -d mongodb

echo "MongoDB가 시작되었습니다."
echo "연결 문자열: $MONGODB_URI"