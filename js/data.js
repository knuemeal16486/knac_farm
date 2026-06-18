/* =============================================================
   data.js  —  여기만 수정하면 사이트 내용이 바뀝니다.
   (app.js, style.css 는 건드릴 필요 없음)
   ============================================================= */

/* ---------- 1. 농장 기본 정보 ---------- */
const FARM = {
  name: "소정리 샤인머스켓 농원",          // 농장 이름
  tagline: "경북 상주 · 모서면 소정리",     // 상단 작은 라벨
  brix: 18,                                  // 대표 당도(Brix) — 히어로에 크게 표시
  address: "경상북도 상주시 모서면 소정리",  // 주소
  mapQuery: "상주시 모서면 소정리",          // 지도 검색어
  phone: "010-0000-0000",                    // 농장 대표 전화 (★ 실제 번호로 교체)
  businessHours: "수확기(8~10월) 매일 09:00 ~ 18:00 / 그 외 전화 문의",
};

/* ---------- 2. 농부(아버지) 소개 ---------- */
const FARMER = {
  name: "OOO",                               // ★ 아버지 성함
  years: 0,                                  // ★ 농사 경력(년) — 0이면 숨김
  // 손편지 톤으로 자유롭게 수정하세요. \n 으로 줄바꿈.
  letter:
    "소정리 골짜기의 맑은 물과 일교차 큰 바람을 맞고 자란 샤인머스켓입니다.\n" +
    "한 송이 한 송이 손으로 알을 솎고, 당도를 재고, 가장 좋은 날 따서 보냅니다.\n" +
    "내 가족이 먹는다는 마음으로 키웠습니다. 믿고 드셔 주세요.",
  // 사진: assets/farmer.jpg 파일을 넣으면 자동 표시. 없으면 일러스트로 대체.
  photo: "assets/farmer.jpg",
};

/* ---------- 3. 제품 목록 ----------
   id      : 고유값(영문, 중복 금지)
   name    : 상품명
   grade   : 등급 라벨 (가정용 / 선물용 / 특상 등)
   weight  : 중량 표기
   bunches : 송이 수 표기
   brix    : 당도(Brix)
   price   : 가격(숫자만)
   desc    : 한 줄 설명
   image   : assets/p1.jpg 처럼 사진 경로 (없으면 일러스트 자동 표시)
   soldout : 품절이면 true
*/
const PRODUCTS = [
  {
    id: "home2kg",
    name: "가정용 샤인머스켓",
    grade: "가정용",
    weight: "2kg",
    bunches: "2~3송이",
    brix: 17,
    price: 30000,
    desc: "온 가족이 매일 부담 없이 즐기는 실속 구성.",
    image: "assets/p1.jpg",
    soldout: false,
  },
  {
    id: "gift2kg",
    name: "선물용 샤인머스켓",
    grade: "선물용",
    weight: "2kg",
    bunches: "2송이 · 박스 포장",
    brix: 18,
    price: 45000,
    desc: "고급 선물 박스에 담아 드립니다. 명절·감사 선물용.",
    image: "assets/p2.jpg",
    soldout: false,
  },
  {
    id: "premium5kg",
    name: "프리미엄 특상",
    grade: "특상",
    weight: "5kg",
    bunches: "5~6송이",
    brix: 19,
    price: 90000,
    desc: "가장 굵고 단 알만 선별한 최상급 구성.",
    image: "assets/p3.jpg",
    soldout: false,
  },
  {
    id: "value3kg",
    name: "실속형 (흠과)",
    grade: "실속",
    weight: "3kg",
    bunches: "랜덤 송이",
    brix: 17,
    price: 25000,
    desc: "맛은 그대로, 모양만 조금 아쉬운 알뜰 구성.",
    image: "assets/p4.jpg",
    soldout: false,
  },
];

/* ---------- 4. 주문/연락 설정 ---------- */
const CONFIG = {
  // (선택) Formspree 등 폼-이메일 서비스 주소를 넣으면 주문이 이메일로 자동 전송됩니다.
  // 비워두면 → 고객이 '문자로 주문 보내기' 버튼으로 농장 전화에 바로 전송합니다.
  // 예: "https://formspree.io/f/xxxxxxxx"
  formEndpoint: "",

  // (선택) 카카오톡 채널 주소. 넣으면 '카카오톡 상담' 버튼이 활성화됩니다.
  kakaoUrl: "",

  // 입금 안내 (주문 확인 화면에 표시)
  bankAccount: "농협 000-0000-0000-00 (예금주: OOO)",  // ★ 실제 계좌로 교체

  // 배송비 안내 문구
  shipping: "택배 3,000원 (5kg 이상 무료) · 농장 직접수령 무료",
};
