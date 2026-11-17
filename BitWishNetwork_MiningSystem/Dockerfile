FROM node:18-alpine
WORKDIR /app

# 상위 폴더 전체에서 package 파일들과 각 프로젝트 폴더를 복사합니다
COPY package*.json ./
COPY BitWishNetwork_MiningSystem/package*.json ./BitWishNetwork_MiningSystem/

# 전체 레포지토리 파일을 복사하여 상위 디렉토리 참조 경로를 맞춥니다
COPY . .

WORKDIR /app/BitWishNetwork_MiningSystem
RUN npm install --legacy-peer-deps

EXPOSE 5000
CMD ["npm", "run", "server"]