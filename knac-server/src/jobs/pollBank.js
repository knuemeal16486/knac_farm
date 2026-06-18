// Phase 2: 금융결제원 오픈뱅킹 API 자동 입금 감지
// 오픈뱅킹 심사 통과 후 활성화 (신청: https://open.fss.or.kr)
// 심사 소요기간: 약 2~4주

const db = require('../db');

let lastChecked = new Date(Date.now() - 10 * 60 * 1000);

async function pollTransactions() {
  if (!process.env.OPENBANK_CLIENT_ID) return 0;

  // TODO Phase 2 구현 — 오픈뱅킹 API 호출 후 입금자명+금액 매칭
  //
  // const token  = await getAccessToken();
  // const txList = await fetchTransactions(token, lastChecked);
  // let matched  = 0;
  //
  // txList.forEach(tx => {
  //   if (tx.type !== 'CREDIT') return;
  //   const order = db.prepare(
  //     "SELECT * FROM orders WHERE status='pending' AND name=? AND amount=?"
  //   ).get(tx.name, tx.amount);
  //   if (order) {
  //     db.prepare(
  //       "UPDATE orders SET status='paid', paid_at=?, auto_paid=1 WHERE id=?"
  //     ).run(tx.datetime, order.id);
  //     matched++;
  //   }
  // });
  //
  // lastChecked = new Date();
  // return matched;

  return 0;
}

// 5분마다 자동 폴링 (OPENBANK_CLIENT_ID 설정 시에만 작동)
if (process.env.OPENBANK_CLIENT_ID) {
  setInterval(pollTransactions, 5 * 60 * 1000);
  console.log('오픈뱅킹 폴링 활성화 (5분 간격)');
}

module.exports = { pollTransactions };
