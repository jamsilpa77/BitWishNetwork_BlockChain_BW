FROM node:18-alpine
WORKDIR /app

# 전체 레포지토리 복사
COPY . .

# 의존성 설치
WORKDIR /app/BitWishNetwork_MiningSystem
RUN npm install --legacy-peer-deps

EXPOSE 5000
# tsconfig 경로를 명시하고 노드로 직접 실행
CMD ["npx", "ts-node", "--project", "server/tsconfig.json", "server/index.ts"]