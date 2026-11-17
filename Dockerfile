FROM node:18-alpine
WORKDIR /app

# 1. 전체 레포지토리 복사
COPY . .

# 2. 상위 블록체인 엔진 의존성 설치
WORKDIR /app/BitWishNetwork_BlockChain
RUN npm install --legacy-peer-deps || true

# 3. 하위 마이닝 시스템 의존성 설치 (decimal.js 포함)
WORKDIR /app/BitWishNetwork_MiningSystem
RUN npm install --legacy-peer-deps

EXPOSE 5000
CMD ["npm", "run", "server"]