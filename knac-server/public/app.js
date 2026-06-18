let orders = [];
let tab    = 'pending';

// ── Fetch ─────────────────────────────────────────────────────────────────────
async function load() {
  try {
    const res = await fetch('/api/orders');
    if (!res.ok) return;
    orders = await res.json();
    render();
  } catch {}
}

// ── Render ────────────────────────────────────────────────────────────────────
function render() {
  renderSummary();
  renderBadges();
  renderList();
}

function renderSummary() {
  const pending  = orders.filter(o => o.status === 'pending');
  const paid     = orders.filter(o => o.status === 'paid');
  const sumPend  = pending.reduce((s, o) => s + o.amount, 0);
  const sumPaid  = paid.reduce((s, o) => s + o.amount, 0);

  document.getElementById('summary-bar').innerHTML = `
    <div class="sc yellow">
      <div class="sc-label">입금 대기</div>
      <div class="sc-num">${pending.length}건</div>
      <div class="sc-amt">${won(sumPend)}</div>
    </div>
    <div class="sc green">
      <div class="sc-label">입금 완료</div>
      <div class="sc-num">${paid.length}건</div>
      <div class="sc-amt">${won(sumPaid)}</div>
    </div>
    <div class="sc">
      <div class="sc-label">전체 주문</div>
      <div class="sc-num">${orders.length}건</div>
      <div class="sc-amt">${won(orders.reduce((s,o)=>s+o.amount,0))}</div>
    </div>
  `;
}

function renderBadges() {
  const c = { pending:0, paid:0, shipped:0 };
  orders.forEach(o => { if (c[o.status] !== undefined) c[o.status]++; });
  document.getElementById('badge-pending').textContent  = c.pending;
  document.getElementById('badge-paid').textContent     = c.paid;
  document.getElementById('badge-shipped').textContent  = c.shipped;
}

function renderList() {
  const el   = document.getElementById('order-list');
  const list = orders.filter(o => o.status === tab);
  if (!list.length) {
    el.innerHTML = `<div class="empty">${tabLabel(tab)} 주문이 없습니다.</div>`;
    return;
  }
  el.innerHTML = list.map(card).join('');
}

function card(o) {
  const items = Array.isArray(o.items) ? o.items : [];
  const tags  = items.map(i =>
    `<span class="itag">${esc(i.weight)} · ${esc(i.bunch)} · ${esc(i.box)} · ${esc(i.wrap)}${i.qty > 1 ? ` × ${i.qty}` : ''}</span>`
  ).join('');

  const paidLine = o.paid_at
    ? `<div class="card-paid-info">✓ ${fmt(o.paid_at)} 입금 확인${o.auto_paid ? ' (자동)' : ''}</div>`
    : '';

  const btns = {
    pending: `
      <button class="btn btn-paid" onclick="markPaid(${o.id})">✓ 입금 확인</button>
      <a class="btn btn-call" href="tel:${esc(o.phone)}">📞 전화</a>
      <button class="btn btn-del"  onclick="del(${o.id})">삭제</button>
    `,
    paid: `
      <button class="btn btn-ship" onclick="markShipped(${o.id})">📦 발송 완료</button>
      <a class="btn btn-call" href="tel:${esc(o.phone)}">📞 전화</a>
      <button class="btn btn-del"  onclick="del(${o.id})">삭제</button>
    `,
    shipped: `
      <a class="btn btn-call" href="tel:${esc(o.phone)}">📞 전화</a>
      <button class="btn btn-del" onclick="del(${o.id})">삭제</button>
    `,
  }[o.status] || '';

  return `
    <div class="order-card ${o.status}" id="c${o.id}">
      <div class="card-top">
        <div>
          <div class="card-name">${esc(o.name)}</div>
          <div class="card-phone">${esc(o.phone)}</div>
        </div>
        <div class="card-amount">${won(o.amount)}</div>
        <div class="card-date">${fmt(o.ordered_at)}</div>
      </div>
      <div class="card-items">${tags}</div>
      ${o.address ? `<div class="card-addr">📦 ${esc(o.address)}</div>` : ''}
      ${o.memo    ? `<div class="card-memo">"${esc(o.memo)}"</div>`     : ''}
      ${paidLine}
      <div class="card-actions">${btns}</div>
    </div>
  `;
}

// ── Tab ───────────────────────────────────────────────────────────────────────
function setTab(t) {
  tab = t;
  document.querySelectorAll('.tab').forEach(el => {
    el.classList.toggle('active', el.dataset.tab === t);
  });
  renderList();
}

// ── Actions ───────────────────────────────────────────────────────────────────
async function markPaid(id) {
  const res = await fetch(`/api/orders/${id}/paid`, { method: 'PATCH' });
  if (!res.ok) return toast('오류가 발생했습니다.', 'error');
  const o = await res.json();
  upsert(o);
  render();
  toast(`${o.name}님 입금 확인 완료`);
}

async function markShipped(id) {
  const res = await fetch(`/api/orders/${id}/shipped`, { method: 'PATCH' });
  if (!res.ok) return toast('오류가 발생했습니다.', 'error');
  const o = await res.json();
  upsert(o);
  render();
  toast(`${o.name}님 발송 완료 처리`);
}

async function del(id) {
  const o = orders.find(x => x.id === id);
  if (!o || !confirm(`${o.name}님 주문을 삭제하시겠습니까?`)) return;
  const res = await fetch(`/api/orders/${id}`, { method: 'DELETE' });
  if (!res.ok) return toast('오류가 발생했습니다.', 'error');
  orders = orders.filter(x => x.id !== id);
  render();
  toast('삭제되었습니다.');
}

function upsert(o) {
  const i = orders.findIndex(x => x.id === o.id);
  if (i !== -1) orders[i] = o; else orders.unshift(o);
}

// ── New order modal ───────────────────────────────────────────────────────────
function openNewModal()  { document.getElementById('new-modal').style.display = 'flex'; }
function closeNewModal() {
  document.getElementById('new-modal').style.display = 'none';
  document.getElementById('new-form').reset();
}
function closeBg(e) { if (e.target === e.currentTarget) closeNewModal(); }

async function submitNew(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const body = {
    name:    fd.get('name'),
    phone:   fd.get('phone'),
    items:   [{ weight: fd.get('weight'), bunch: fd.get('bunch'),
                box: fd.get('box'), wrap: fd.get('wrap'),
                qty: parseInt(fd.get('qty')) || 1 }],
    amount:  parseInt(fd.get('amount')),
    address: fd.get('address'),
    memo:    fd.get('memo'),
  };

  const res = await fetch('/api/orders', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) return toast('등록에 실패했습니다.', 'error');

  const o = await res.json();
  orders.unshift(o);
  closeNewModal();
  setTab('pending');
  render();
  toast(`${o.name}님 주문 등록 완료`);
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function won(n)  { return Number(n).toLocaleString('ko-KR') + '원'; }
function fmt(dt) { return dt ? String(dt).slice(0, 16).replace('T', ' ') : ''; }
function esc(s)  {
  return String(s ?? '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function tabLabel(t) {
  return { pending:'입금 대기', paid:'입금 완료', shipped:'발송 완료' }[t] || t;
}

let _toast;
function toast(msg, type = '') {
  document.querySelector('.toast')?.remove();
  clearTimeout(_toast);
  const el = Object.assign(document.createElement('div'), {
    className: `toast${type ? ' ' + type : ''}`,
    textContent: msg,
  });
  document.body.appendChild(el);
  _toast = setTimeout(() => el.remove(), 3000);
}

// ── Init ──────────────────────────────────────────────────────────────────────
load();
setInterval(load, 30_000);
