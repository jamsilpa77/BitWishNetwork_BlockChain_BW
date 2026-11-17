FROM node:18-alpine
WORKDIR /app

# 루트 전체 파일(블록체인 엔진 및 마이닝 시스템 포함)을 컨테이너로 복사
COPY . .

# 마이닝 시스템 폴더로 이동하여 의존성 설치
WORKDIR /app/BitWishNetwork_MiningSystem
RUN npm install --legacy-peer-deps

EXPOSE 5000

# ts-node 실행 시 상위 폴더를 올바르게 참조할 수 있도록 지정
CMD ["npx", "ts-node", "--project", "server/tsconfig.json", "server/index.ts"]