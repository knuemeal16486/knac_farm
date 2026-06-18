# 소정리 샤인머스켓 농원 웹사이트

경북 상주 모서면 소정리 샤인머스켓 농장 — 농장 소개 · 농부 소개 · 제품 · 주문 접수 기능을 갖춘 정적 웹사이트임

## 폴더 구조
```
sojeongri/
├─ index.html        # 페이지 구조 (수정 거의 불필요)
├─ css/style.css     # 디자인 (수정 거의 불필요)
├─ js/data.js        # ★ 여기만 고치면 내용이 바뀜 (농장/농부/제품/계좌)
├─ js/app.js         # 로직 (수정 불필요)
└─ assets/           # 사진 넣는 곳 (farmer.jpg, p1~p4.jpg)
```

## 내가 바꿔야 할 것 (js/data.js)
1. `FARM` — 농장 이름, 전화번호, 주소, 대표 당도
2. `FARMER` — 아버지 성함, 경력, 손편지 글, 사진 경로
3. `PRODUCTS` — 상품명/등급/중량/가격/당도 (행을 추가·삭제 가능)
4. `CONFIG.bankAccount` — 실제 입금 계좌
5. (선택) `CONFIG.formEndpoint` — 주문을 이메일로 자동 받고 싶을 때
6. (선택) `CONFIG.kakaoUrl` — 카카오톡 채널 주소

사진은 `assets/` 폴더에 `farmer.jpg`, `p1.jpg`~`p4.jpg`로 넣으면 자동 표시됩니다. (없으면 포도 일러스트가 대신 나옵니다.)

## GitHub Pages 배포
1. GitHub에 새 저장소 생성 (예: `sojeongri`)
2. 이 폴더의 **내용물 전체**를 저장소 루트에 올림 (`index.html`이 루트에 있어야 함)
3. 저장소 → **Settings → Pages** → Source: `Deploy from a branch` → Branch: `main` / `/(root)` → Save
4. 1~2분 뒤 `https://<아이디>.github.io/<저장소명>/` 에서 확인

## 주문 흐름 (중요)
GitHub Pages는 서버가 없어 **실시간 카드결제는 불가능**합니다. 그래서 이렇게 동작합니다:

```
고객이 장바구니 담기 → 주문서 작성 → "주문 접수"
  → 주문 내용이 정리됨
  → [문자로 주문 보내기] / [전화] / [복사] 버튼으로 농장에 전달
  → 농장주가 확인 후 입금 안내 → 입금 → 발송
```

- `CONFIG.formEndpoint`에 [Formspree](https://formspree.io) 같은 무료 폼 주소를 넣으면 주문이 **이메일로 자동 전송**됩니다. (회원가입 후 받은 주소를 붙여넣기만 하면 됨)

## 다음 단계 (실결제 도입 시)
- **가장 쉬움**: 네이버 스마트스토어를 만들고, 이 사이트의 "주문하기"를 스토어 링크로 연결
- **자체 결제**: 토스페이먼츠 등 PG 연동 → 서버(또는 Cloudflare/Vercel 서버리스 함수) 필요 → 이때는 GitHub Pages가 아닌 호스팅으로 이전
