FROM node:18-alpine
WORKDIR /app

# 1. 상위 블록체인 엔진과 마이닝 시스템을 포함한 전체 레포지토리를 도커 컨테이너로 복사합니다.
COPY . .

# 2. 마이닝 시스템 내부로 이동하여 의존성을 설치합니다 (--legacy-peer-deps로 충돌 방지)
WORKDIR /app/BitWishNetwork_MiningSystem
RUN npm install --legacy-peer-deps

# 3. TypeScript가 상위 폴더의 엔진 파일과 모듈을 정확히 인식할 수 있도록 환경을 고정합니다.
EXPOSE 5000

# 4. ts-node를 통해 백엔드 서버를 구동합니다.
CMD ["npm", "run", "server"]