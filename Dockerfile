FROM node:18-alpine
WORKDIR /app

# 레포지토리 전체 복사
COPY . .

# 패키지 설치
RUN npm install --prefix BitWishNetwork_MiningSystem --legacy-peer-deps

EXPOSE 5000

# 하위 폴더로 이동(WORKDIR)하지 않고 루트(/app)에서 직접 ts-node 실행
CMD ["npx", "ts-node", "--project", "BitWishNetwork_MiningSystem/server/tsconfig.json", "BitWishNetwork_MiningSystem/server/index.ts"]