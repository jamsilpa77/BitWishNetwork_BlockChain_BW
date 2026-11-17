FROM node:18-alpine
WORKDIR /app

# 1. 레포지토리 전체 파일을 컨테이너 루트(/app)로 복사합니다.
COPY . .

# 2. 마이닝 시스템 폴더 내부로 이동합니다.
WORKDIR /app/BitWishNetwork_MiningSystem

# 3. 해당 폴더 안에서 의존성을 설치합니다.
RUN npm install --legacy-peer-deps

EXPOSE 5000

# 4. 서버를 실행합니다.
CMD ["npm", "run", "server"]