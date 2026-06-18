# 크낙새 농장 주문 관리 서버

맥 미니에서 실행하는 농장 주문 관리 대시보드입니다.

**Phase 1 (현재):** 주문 등록 · 입금 수동 확인 · 발송 처리  
**Phase 2 (예정):** 카카오뱅크 자동 입금 감지 (오픈뱅킹 심사 후 ~4주)

---

## 맥 미니 초기 세팅

### 1. Homebrew & Node.js 설치

```bash
# Homebrew (이미 있으면 생략)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

brew install node
node --version   # v20 이상 확인
```

### 2. PM2 (서버 상시 실행)

```bash
npm install -g pm2
```

### 3. cloudflared (외부 접속 터널)

```bash
brew install cloudflare/cloudflare/cloudflared
```

### 4. 저장소 클론 & 설정

```bash
git clone https://github.com/knuemeal16486/knac-server
cd knac-server
npm install

cp .env.example .env
nano .env   # ADMIN_PASS 를 원하는 비밀번호로 변경
```

### 5. 서버 시작

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup   # 출력된 sudo 명령어를 복사해서 실행
```

### 6. Cloudflare Tunnel (윈도우에서 접속)

```bash
cloudflared tunnel login
cloudflared tunnel create knac-farm
cloudflared tunnel run --url http://localhost:3000 knac-farm
```

---

## Phase 2: 오픈뱅킹 자동 입금 감지

1. [금융결제원 오픈뱅킹](https://open.fss.or.kr) 서비스 신청
2. 심사 통과 후 `.env` 에 추가:

```
OPENBANK_CLIENT_ID=발급받은_클라이언트_ID
OPENBANK_CLIENT_SECRET=발급받은_시크릿
ACCOUNT_NUM=카카오뱅크_계좌번호
```

3. `pm2 restart knac-server` → 5분마다 자동 감지 시작
