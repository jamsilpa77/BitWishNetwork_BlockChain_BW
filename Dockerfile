FROM node:18-alpine
WORKDIR /app

# 최상단 전체 파일을 컨테이너로 복사합니다 (상위 폴더 참조 경로 유지)
COPY . .

# 마이닝 시스템 폴더로 이동하여 의존성 설치
WORKDIR /app/BitWishNetwork_MiningSystem
RUN npm install --legacy-peer-deps

EXPOSE 5000
CMD ["npm", "run", "server"]