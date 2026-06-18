/* ============================================================
   소정리 샤인머스켓 농원 — app.js  (수정 불필요)
   ============================================================ */
(() => {
  "use strict";

  /* ---------- 유틸 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const won = (n) => n.toLocaleString("ko-KR") + "원";
  const digits = (s) => (s || "").replace(/[^0-9]/g, "");
  const reduceMotion = () => matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* 문자(SMS) 양식 자동완성 */
  const smsHref = (body) => `sms:${digits(FARM.phone)}?&body=${encodeURIComponent(body)}`;
  const inquiryBody = () => `[${FARM.name} 문의]\n성함: \n연락처: \n문의 내용: `;
  const bulkBody = () =>
    `[${FARM.name} 대량주문 문의]\n성함: \n연락처: \n희망 구성/수량(상자): \n받는 주소: \n요청사항: `;

  /* 장바구니 영속화 (localStorage 불가 환경에서도 동작) */
  const store = {
    read() {
      try { return JSON.parse(localStorage.getItem("smc_cart") || "[]"); }
      catch { return mem; }
    },
    write(v) {
      mem = v;
      try { localStorage.setItem("smc_cart", JSON.stringify(v)); } catch {}
    },
  };
  let mem = [];
  let cart = store.read();
  // 구버전(상품ID 기반) 장바구니 데이터는 옵션형과 호환되지 않으므로 정리
  if (!Array.isArray(cart)) cart = [];
  cart = cart.filter((c) => c && typeof c.key === "string" && typeof c.price === "number" && c.opt);

  /* ---------- 1. 콘텐츠 바인딩 ---------- */
  const ICONS = {
    badge: '<path d="M9 12l2 2 4-4"/><circle cx="12" cy="12" r="9"/>',
    leaf: '<path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"/><path d="M2 21c0-3 1.85-5.36 5.08-6"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    drop: '<path d="M12 22a7 7 0 0 0 7-7c0-2-1-3.9-3-5.5S12.5 5.5 12 3c-.5 2.5-2 4.9-4 6.5S5 13 5 15a7 7 0 0 0 7 7Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M6.3 17.7l-1.4 1.4M19.1 4.9l-1.4 1.4"/>',
    spark: '<path d="m12 3 1.9 5.8a2 2 0 0 0 1.3 1.3L21 12l-5.8 1.9a2 2 0 0 0-1.3 1.3L12 21l-1.9-5.8a2 2 0 0 0-1.3-1.3L3 12l5.8-1.9a2 2 0 0 0 1.3-1.3Z"/>',
  };
  const svg = (name, size) =>
    `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${ICONS[name]}</svg>`;

  /* 컨테이너에 이미지를 얹는다. 로드 성공 시에만 표시(페이드인), 실패 시 일러스트 유지.
     zoom=true 면 클릭 시 라이트박스로 확대 가능. */
  function mountImage(container, src, alt, zoom) {
    if (!container || !src) return;
    const img = document.createElement("img");
    img.className = "ph-img";
    img.loading = "lazy";
    img.decoding = "async";
    img.alt = alt || "";
    img.addEventListener("load", () => {
      container.querySelectorAll(".photo-placeholder").forEach((n) => n.remove());
      img.classList.add("loaded");
      if (zoom) { img.dataset.zoom = src; img.classList.add("zoomable"); }
    });
    img.addEventListener("error", () => img.remove());
    container.appendChild(img);
    img.src = src;
  }

  function hydrate() {
    $("#announce-bar").textContent = CONFIG.announce || "";
    $$("[data-farm-name]").forEach((e) => (e.textContent = FARM.name));
    $$("[data-farm-tagline]").forEach((e) => (e.textContent = FARM.tagline));
    $$("[data-farm-brix]").forEach((e) => (e.textContent = FARM.brix));
    $("[data-farm-address]").textContent = FARM.address;
    $("[data-farm-hours]").textContent = FARM.businessHours;
    const pl = $("[data-farm-phone-link]");
    pl.textContent = FARM.phone;
    pl.href = "tel:" + digits(FARM.phone);
    document.title = FARM.name + " · 산지직송";

    $("[data-farmer-name]").textContent = FARMER.name;
    $("[data-farmer-years]").textContent = FARMER.years ? `· 경력 ${FARMER.years}년` : "";
    $("[data-farmer-letter]").textContent = FARMER.letter;
    mountImage($('[data-photo="farmer"]'), FARMER.photo, FARMER.name + " 농부", true);

    const hasCoord = FARM.lat && FARM.lng;
    const coord = hasCoord ? `${FARM.lat},${FARM.lng}` : null;

    $("#map-link").href = hasCoord
      ? `https://map.kakao.com/link/map/${encodeURIComponent(FARM.name)},${FARM.lat},${FARM.lng}`
      : "https://map.naver.com/v5/search/" + encodeURIComponent(FARM.mapQuery);

    const mapEl = $("#visit-map");
    if (mapEl) {
      const iframeSrc = hasCoord
        ? `https://map.naver.com/v5/embed?type=place&lat=${FARM.lat}&lng=${FARM.lng}&zoom=16&title=${encodeURIComponent(FARM.name)}`
        : `https://map.naver.com/v5/search/${encodeURIComponent(FARM.mapQuery || FARM.address)}`;
      mapEl.innerHTML = `<iframe title="${FARM.name} 위치" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="${iframeSrc}"></iframe>`;
      mapEl.removeAttribute("aria-hidden");
    }
    $("#ship-note").textContent = CONFIG.shipping;
    $("#bank-acc").textContent = CONFIG.bankAccount;

    const b = CONFIG.business;
    if (b) {
      const parts = [
        `상호 ${b.name}`,
        `대표 ${b.owner}`,
        `사업자등록번호 ${b.regNo}`,
        b.mailOrderNo ? `통신판매업 ${b.mailOrderNo}` : null,
        FARM.address,
        FARM.phone,
        b.type,
      ].filter(Boolean);
      $("#biz-info").textContent = parts.join("  ·  ");
    }

    const ld = document.createElement("script");
    ld.type = "application/ld+json";
    ld.textContent = JSON.stringify([
      {
        "@context": "https://schema.org",
        "@type": "Product",
        name: PRODUCT.name,
        description: PRODUCT.desc,
        brand: { "@type": "Brand", name: FARM.name },
        offers: {
          "@type": "AggregateOffer",
          priceCurrency: "KRW",
          lowPrice: Math.min(...OPTIONS.weight.map((w) => w.price)),
          highPrice: Math.max(...OPTIONS.weight.map((w) => w.price)),
          availability: PRODUCT.soldout ? "https://schema.org/OutOfStock" : "https://schema.org/InStock",
        },
      },
      {
        "@context": "https://schema.org",
        "@type": "LocalBusiness",
        name: FARM.name,
        description: `경북 상주 소정리, 해발 ${FARM.elevation}m 백화산 자락에서 손수확한 샤인머스켓.`,
        address: { "@type": "PostalAddress", streetAddress: FARM.address, addressCountry: "KR" },
        telephone: FARM.phone,
        geo: { "@type": "GeoCoordinates", latitude: FARM.lat, longitude: FARM.lng },
      },
    ]);
    document.head.appendChild(ld);
  }

  /* ---------- 신뢰 배지 / 가치 렌더 ---------- */
  function renderTrust() {
    const icons = ["badge", "leaf", "clock"];
    $("#trust-strip").innerHTML = TRUST.map((t, i) => `
      <div class="trust-item">
        <span class="trust-ic">${svg(icons[i % 3], 28)}</span>
        <div><div class="trust-tt">${t.title}</div><div class="trust-ds">${t.desc}</div></div>
      </div>`).join("");
  }
  function renderValues() {
    const icons = ["leaf", "sun", "drop", "spark"];
    $("#values-grid").innerHTML = VALUES.map((v, i) => `
      <article class="value-card">
        <span class="value-ic">${svg(icons[i % 4], 30)}</span>
        <h3 class="value-title">${v.title}</h3>
        <p class="value-desc">${v.desc}</p>
      </article>`).join("");
  }

  /* ---------- 통계 띠 (카운트업) ---------- */
  function renderStats() {
    const box = $("#stats-inner");
    if (!box) return;
    const stats = [
      { to: FARM.elevation, suffix: "m", label: "밭 해발고도" },
      { to: FARM.brixMax, suffix: " Brix", label: "최고 당도" },
      { to: FARMER.years, suffix: "년", label: "농부의 손길" },
    ].filter((s) => s.to);
    box.innerHTML = stats.map((s) =>
      `<div class="stat"><span class="stat-num" data-to="${s.to}" data-suffix="${s.suffix}">0</span><span class="stat-label">${s.label}</span></div>`
    ).join("");
  }
  function animateCount(el) {
    const to = Number(el.dataset.to) || 0;
    const suf = el.dataset.suffix || "";
    if (reduceMotion() || !to) { el.textContent = to + suf; return; }
    const dur = 1200, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      el.textContent = Math.round((1 - Math.pow(1 - p, 3)) * to) + suf;
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  /* ---------- 2. 제품 렌더링 ---------- */
  const grapeSVG = `<svg viewBox="0 0 40 48" width="64" height="76"><g fill="currentColor">
    <circle cx="20" cy="14" r="6"/><circle cx="11" cy="22" r="6"/><circle cx="29" cy="22" r="6"/>
    <circle cx="20" cy="29" r="6"/><circle cx="13" cy="35" r="5.5"/><circle cx="27" cy="35" r="5.5"/><circle cx="20" cy="41" r="5"/>
  </g></svg>`;

  /* ---------- 2. 제품 (옵션 선택형) ---------- */
  let sel = { weightIdx: 0, bunchIdx: 0, boxIdx: 0, wrapIdx: 0 };
  let pdpQty = 1;
  let addCartLocked = false;

  const curWeight = () => OPTIONS.weight[sel.weightIdx];
  const unitPrice = () =>
    curWeight().price + OPTIONS.box[sel.boxIdx].add + OPTIONS.wrap[sel.wrapIdx].add;

  function renderPDP() {
    const pdp = $("#pdp");
    if (!pdp) return;
    pdp.innerHTML = `
      <div class="pdp-media">
        <div class="card-img" id="pdp-img">
          <span class="grade-tag">${PRODUCT.grade}</span>
          ${grapeSVG}
        </div>
      </div>
      <div class="pdp-info">
        <h3 class="pdp-name">${PRODUCT.name}</h3>
        <p class="pdp-brix">${PRODUCT.brixNote || ""}</p>
        <p class="pdp-desc" style="white-space:pre-line">${PRODUCT.desc || ""}</p>
        <div id="opt-groups"></div>
        ${CONFIG.saleOpen ? `
        <div class="pdp-buy">
          <div class="pdp-price"><span class="pdp-price-label">가격 (배송비 별도)</span><span id="pdp-price"></span></div>
          <div class="pdp-qty" role="group" aria-label="수량(상자)">
            <button type="button" data-pq="-1" aria-label="수량 줄이기">−</button>
            <span id="pdp-qty">1</span>
            <button type="button" data-pq="1" aria-label="수량 늘리기">+</button>
            <span class="pdp-qty-unit">상자</span>
          </div>
        </div>
        <button class="btn btn-primary full" id="pdp-add" ${PRODUCT.soldout ? "disabled" : ""}>
          ${PRODUCT.soldout ? "품절" : "이 옵션 장바구니에 담기"}
        </button>
        <p class="bulk-link"><a href="${smsHref(bulkBody())}">10상자 이상 대량주문은 별도 문의 →</a></p>
        <div class="pdp-selected" id="pdp-selected"></div>` : `
        <div class="preharvest">
          <span class="ph-ic">${svg("leaf", 26)}</span>
          <p class="ph-title">올해 수확은 10월이에요</p>
          <p class="ph-desc">수확 후 판매를 시작합니다. 미리 주문·문의는 아래로 연락 주세요. (문자를 누르면 양식이 자동으로 채워집니다.)</p>
          <div class="ph-actions">
            <a class="btn btn-primary full" href="${smsHref(inquiryBody())}">문자로 문의하기</a>
            <a class="btn btn-ghost full" href="tel:${digits(FARM.phone)}">전화 ${FARM.phone}</a>
          </div>
        </div>`}
      </div>`;
    mountImage($("#pdp-img"), PRODUCT.image, PRODUCT.name, true);
    renderOptions();
    updatePrice();
    renderPdpSelected();
  }

  /* 선택한 옵션 인라인 목록 (네이버 쇼핑 방식) */
  function renderPdpSelected() {
    const box = $("#pdp-selected");
    if (!box) return;
    if (!cart.length) { box.innerHTML = ""; return; }
    const rows = cart.map((c) => `
      <div class="sel-row" data-key="${c.key}">
        <div class="sel-info">
          <div class="sel-name">${c.name}</div>
          <div class="sel-opt">${c.opt.weight} · ${c.opt.bunch} · ${c.opt.box} · ${c.opt.wrap}</div>
        </div>
        <div class="sel-qty">
          <button data-dec="${c.key}" aria-label="수량 줄이기">−</button>
          <span>${c.qty}</span>
          <button data-inc="${c.key}" aria-label="수량 늘리기">+</button>
          <span class="sel-unit">상자</span>
        </div>
        <div class="sel-line">${won(c.price * c.qty)}<button class="sel-rm" data-rm="${c.key}" aria-label="삭제">✕</button></div>
      </div>`).join("");
    const boxes = itemCount();
    const bulk = boxes >= 10
      ? `<div class="bulk-note on">10상자 이상 대량주문은 전화·문자로 문의하시면 더 좋은 조건으로 도와드려요. <a href="${smsHref(bulkBody())}">대량주문 문의 →</a></div>`
      : "";
    box.innerHTML = `
      <div class="sel-head">선택한 옵션 <span>${boxes}상자</span></div>
      ${rows}
      <div class="sel-total"><span>합계</span><strong>${won(itemTotal())}</strong></div>
      ${bulk}
      <button class="btn btn-primary full" id="pdp-order">주문서 작성하기</button>`;
  }

  function optGroup(title, grp, items, activeIdx) {
    const pills = items.map((it, i) =>
      `<button type="button" class="opt-pill${i === activeIdx ? " on" : ""}" data-grp="${grp}" data-i="${i}">${it}</button>`
    ).join("");
    return `<div class="opt-group"><span class="opt-label">${title}</span><div class="opt-pills">${pills}</div></div>`;
  }

  function renderOptions() {
    const box = $("#opt-groups");
    if (!box) return;
    box.innerHTML =
      optGroup("무게", "weight", OPTIONS.weight.map((w) => w.label), sel.weightIdx) +
      optGroup("송이 수", "bunch", curWeight().bunches, sel.bunchIdx) +
      optGroup("상자", "box", OPTIONS.box.map((b) => b.label), sel.boxIdx) +
      optGroup("포장", "wrap", OPTIONS.wrap.map((w) => w.label), sel.wrapIdx);
  }

  function selectOption(grp, i) {
    if (grp === "weight") { sel.weightIdx = i; sel.bunchIdx = 0; }
    else if (grp === "bunch") sel.bunchIdx = i;
    else if (grp === "box") sel.boxIdx = i;
    else if (grp === "wrap") sel.wrapIdx = i;
    renderOptions();
    updatePrice();
  }

  function setPdpQty(d) {
    pdpQty = Math.max(1, pdpQty + d);
    $("#pdp-qty").textContent = pdpQty;
    updatePrice();
  }

  function updatePrice() {
    const el = $("#pdp-price");
    if (!el) return;
    el.textContent = won(unitPrice() * pdpQty);
    el.classList.remove("price-flash");
    void el.offsetWidth;
    el.classList.add("price-flash");
  }

  function addCurrentToCart() {
    if (PRODUCT.soldout || addCartLocked) return;
    showCartConfirm();
  }

  function showCartConfirm() {
    const w = curWeight();
    const bunch = w.bunches[sel.bunchIdx];
    const box = OPTIONS.box[sel.boxIdx];
    const wrap = OPTIONS.wrap[sel.wrapIdx];
    const total = unitPrice() * pdpQty;
    const modal = $("#cart-confirm-modal");
    if (!modal) return;
    const rows = [
      ["무게",   w.label],
      ["송이수", bunch],
      ["상자",   box.label],
      ["포장",   wrap.label],
      ["수량",   `${pdpQty}상자`],
    ].map(([k, v]) => `<tr><th>${k}</th><td>${v}</td></tr>`).join("");
    modal.querySelector(".cc-opts").innerHTML = `<table class="cc-table">${rows}</table>`;
    modal.querySelector(".cc-price").textContent = won(total);
    modal.hidden = false;
    document.body.style.overflow = "hidden";
    modal.querySelector("#cc-confirm").focus();
  }

  function closeCartConfirm() {
    const modal = $("#cart-confirm-modal");
    if (modal) modal.hidden = true;
    document.body.style.overflow = "";
  }

  function doAddCurrentToCart() {
    addCartLocked = true;
    setTimeout(() => { addCartLocked = false; }, 300);
    const w = curWeight();
    const bunch = w.bunches[sel.bunchIdx];
    const box = OPTIONS.box[sel.boxIdx];
    const wrap = OPTIONS.wrap[sel.wrapIdx];
    const opt = { weight: w.label, bunch, box: box.label, wrap: wrap.label };
    const line = {
      key: [w.id, bunch, box.id, wrap.id].join("|"),
      name: PRODUCT.name,
      opt,
      price: unitPrice(),
      qty: pdpQty,
    };
    addLine(line);
    showAdded(line);
    pdpQty = 1;
    $("#pdp-qty").textContent = 1;
    updatePrice();
  }


  /* ---------- 성장 일지 렌더 ---------- */
  function renderGrowth() {
    const dots = $("#growth-dots");
    const track = $("#growth-track");
    if (!dots || !track) return;
    dots.innerHTML = GROWTH.map((g, i) =>
      `<button class="g-dot${i === 0 ? " on" : ""}" data-go="${i}" role="tab" aria-selected="${i === 0 ? "true" : "false"}" aria-label="${g.date} ${g.title}">${g.date}</button>`
    ).join("");
    track.innerHTML = GROWTH.map((g, i) => `
      <article class="g-card" data-idx="${i}">
        <div class="g-img">
          <span class="g-step">${i + 1} / ${GROWTH.length}</span>
          ${g.brix ? `<span class="g-brix">${g.brix} Brix</span>` : ""}
          <svg viewBox="0 0 40 48" width="56" height="68"><g fill="currentColor" opacity=".7">
            <circle cx="20" cy="14" r="6"/><circle cx="11" cy="22" r="6"/><circle cx="29" cy="22" r="6"/>
            <circle cx="20" cy="29" r="6"/><circle cx="13" cy="35" r="5.5"/><circle cx="27" cy="35" r="5.5"/><circle cx="20" cy="41" r="5"/>
          </g></svg>
        </div>
        <div class="g-body">
          <span class="g-date">${g.date}</span>
          <h3 class="g-title">${g.title}</h3>
          <p class="g-desc">${g.desc}</p>
        </div>
      </article>`).join("");

    GROWTH.forEach((g, i) => {
      const box = track.querySelector(`.g-card[data-idx="${i}"] .g-img`);
      mountImage(box, g.image, `${g.date} ${g.title}`, true);
    });
  }

  /* ---------- 3. 장바구니 (옵션 조합 단위) ---------- */
  const itemTotal = () => cart.reduce((s, c) => s + c.price * c.qty, 0);
  const itemCount = () => cart.reduce((s, c) => s + c.qty, 0);

  function addLine(line) {
    const row = cart.find((c) => c.key === line.key);
    row ? (row.qty += line.qty) : cart.push(line);
    persist();
  }
  function setQty(key, d) {
    const row = cart.find((c) => c.key === key);
    if (!row) return;
    row.qty += d;
    if (row.qty <= 0) cart = cart.filter((c) => c.key !== key);
    persist();
  }
  function removeItem(key) {
    cart = cart.filter((c) => c.key !== key);
    persist();
  }
  function persist() {
    store.write(cart);
    renderCart();
    renderPdpSelected();
    updateBadges();
  }

  function renderCart() {
    const ul = $("#cart-items");
    const empty = $("#cart-empty");
    ul.innerHTML = cart.map((c) => `
      <li class="cart-row" data-key="${c.key}">
        <div>
          <div class="ci-name">${c.name}</div>
          <div class="ci-meta">${c.opt.weight} · ${c.opt.bunch} · ${c.opt.box} · ${c.opt.wrap}</div>
          <div class="qty">
            <button data-dec="${c.key}" aria-label="수량 줄이기">−</button>
            <span>${c.qty}</span>
            <button data-inc="${c.key}" aria-label="수량 늘리기">+</button>
            <button class="ci-remove" data-rm="${c.key}">삭제</button>
          </div>
        </div>
        <span class="ci-price">${won(c.price * c.qty)}</span>
      </li>`).join("");
    const has = cart.length > 0;
    empty.style.display = has ? "none" : "block";
    $("#cart-total").textContent = won(itemTotal());
    $("#go-checkout").disabled = !has;
  }

  function updateBadges() {
    const n = itemCount();
    $("#cart-count").textContent = n;
    const fc = $("#floating-cart");
    fc.hidden = n === 0;
    $("#floating-count").textContent = n + "개";
    $("#floating-total").textContent = won(itemTotal());
  }

  /* ---------- 4. 드로어 ---------- */
  const drawer = $("#cart-drawer");
  const backdrop = $("#backdrop");
  function openDrawer() {
    showView("cart");
    drawer.classList.add("open");
    drawer.setAttribute("aria-hidden", "false");
    backdrop.hidden = false;
    document.body.style.overflow = "hidden";
  }
  function closeDrawer() {
    drawer.classList.remove("open");
    drawer.setAttribute("aria-hidden", "true");
    backdrop.hidden = true;
    document.body.style.overflow = "";
  }
  let orderMethod = "sms";

  function showView(v) {
    $("#cart-view").hidden     = v !== "cart";
    $("#method-view").hidden   = v !== "method";
    $("#checkout-view").hidden = v !== "checkout";
    $("#done-view").hidden     = v !== "done";
    const stepMap = { cart: 0, method: 1, checkout: 2, done: 3 };
    const idx = stepMap[v] ?? 0;
    $$(".drawer-step").forEach((s, i) => {
      s.classList.toggle("active", i === idx);
      s.classList.toggle("done", i < idx);
    });
  }

  /* ---------- 5. 주문 처리 ---------- */
  function buildSummary(form) {
    const f = new FormData(form);
    const method = f.get("method");
    const lines = cart.map((c) =>
      `· ${c.name} ${c.opt.weight}/${c.opt.bunch}/${c.opt.box}/${c.opt.wrap} ${c.qty}개 — ${won(c.price * c.qty)}`
    );
    return [
      `[${FARM.name} 주문]`,
      `성함: ${f.get("name")}`,
      `연락처: ${f.get("phone")}`,
      `수령: ${method}`,
      method === "택배" ? `주소: ${f.get("address")}` : null,
      f.get("memo") ? `요청: ${f.get("memo")}` : null,
      `──────────`,
      ...lines,
      `상품합계: ${won(itemTotal())}`,
      `(배송비 별도: ${CONFIG.shipping})`,
    ].filter(Boolean).join("\n");
  }

  async function submitOrder(e) {
    e.preventDefault();
    if (!cart.length) { toast("장바구니가 비어 있습니다"); showView("cart"); return; }
    const form = e.target;
    const fd = new FormData(form);
    const phone = fd.get("phone") || "";
    if (digits(phone).length < 10) {
      toast("연락처를 올바르게 입력해 주세요 (10자리 이상)");
      form.elements.namedItem("phone").focus();
      return;
    }
    const method = fd.get("method");
    if (method === "택배" && !(fd.get("address") || "").trim()) {
      toast("주소를 입력해 주세요");
      form.elements.namedItem("address").focus();
      return;
    }
    const submitBtn = form.querySelector('[type="submit"]');
    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = "처리 중…"; }
    const summary = buildSummary(form);

    // SMS 자동 열기 — form submit(사용자 제스처) 체인 안에서 동기적으로 실행
    const smsA = document.createElement("a");
    smsA.href = smsHref(summary);
    document.body.appendChild(smsA);
    smsA.click();
    document.body.removeChild(smsA);

    // (A) 폼 엔드포인트가 있으면 이메일 자동 전송 시도
    if (CONFIG.formEndpoint) {
      try {
        await fetch(CONFIG.formEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify({ order: summary }),
        });
      } catch { /* 실패해도 아래 수동 전송으로 안내 */ }
    }
    showDone(summary);
  }

  function showDone(summary) {
    $("#order-summary").textContent = summary;
    $("#done-desc").textContent = "문자 앱이 열렸습니다. 내용을 확인하고 전송해 주세요. 앱이 열리지 않았다면 아래 버튼을 눌러주세요.";

    const tel = digits(FARM.phone);
    const body = encodeURIComponent(summary);
    const actions = [
      `<a class="btn btn-primary full" href="sms:${tel}?&body=${body}">📱 문자 다시 열기</a>`,
      CONFIG.kakaoUrl ? `<a class="btn btn-ghost full" target="_blank" rel="noopener" href="${CONFIG.kakaoUrl}">카카오톡 상담</a>` : "",
      `<a class="btn btn-ghost full" href="tel:${tel}">📞 전화 주문 (${FARM.phone})</a>`,
      `<button class="btn btn-ghost full" id="copy-order" type="button">주문 내용 복사</button>`,
    ].filter(Boolean).join("");
    $("#done-actions").innerHTML = actions;

    $("#copy-order")?.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(summary); toast("복사되었습니다"); }
      catch { toast("복사 실패 — 길게 눌러 복사하세요"); }
    });

    cart = [];
    persist();
    showView("done");
  }

  /* ---------- 장바구니 담김 확인 ---------- */
  function showAdded(line) {
    const am = $("#added-modal");
    $("#added-line").textContent =
      `${line.name} · ${line.opt.weight}/${line.opt.bunch}/${line.opt.box}/${line.opt.wrap} · ${line.qty}개`;
    am.hidden = false;
  }

  /* ---------- 6. 토스트 ---------- */
  let toastT;
  function toast(msg) {
    const t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastT);
    toastT = setTimeout(() => t.classList.remove("show"), 1800);
  }

  /* ---------- 7. 스크롤 등장 ---------- */
  function setupReveal() {
    const targets = $$(".trust-item, .story, .section-head, .g-card, .value-card, .card, .visit-info");
    targets.forEach((t) => t.classList.add("reveal"));
    if (!("IntersectionObserver" in window)) {
      targets.forEach((t) => t.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => en.isIntersecting && (en.target.classList.add("in"), io.unobserve(en.target)));
    }, { threshold: 0.12 });
    targets.forEach((t) => io.observe(t));
  }

  /* ---------- 7.5 인터랙션 (전환·스크롤스파이·라이트박스 등) ---------- */
  function mountHeroBg() {
    if (!FARM.heroImage) return;
    const el = $("#hero-bg");
    const im = new Image();
    im.onload = () => {
      el.style.backgroundImage = `url("${FARM.heroImage}")`;
      $(".hero").classList.add("has-bg");
    };
    im.src = FARM.heroImage;
  }

  function countUpBrix() {
    const el = $(".brix-num[data-farm-brix]");
    if (!el) return;
    const target = Number(FARM.brix) || 0;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !target) {
      el.textContent = target; return;
    }
    const dur = 1100, t0 = performance.now();
    const tick = (t) => {
      const p = Math.min((t - t0) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target);
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  function setupIntro() {
    const el = $("#intro");
    if (!el) return;
    if (reduceMotion()) { el.remove(); return; }
    setTimeout(() => {
      el.classList.add("gone");
      setTimeout(() => el.remove(), 750);
    }, 620);
  }

  function setupHeroParallax() {
    if (reduceMotion()) return;
    const bg = $("#hero-bg"), decor = $(".hero-decor");
    addEventListener("scroll", () => {
      const y = Math.min(window.scrollY, 820);
      if (bg) bg.style.transform = `translateY(${y * 0.14}px)`;
      if (decor) decor.style.transform = `translateY(${y * 0.26}px)`;
    }, { passive: true });
  }

  function setupStats() {
    const sec = $("#stats");
    if (!sec) return;
    const nums = $$(".stat-num", sec);
    if (!("IntersectionObserver" in window)) { nums.forEach(animateCount); return; }
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        nums.forEach(animateCount);
        io.disconnect();
      });
    }, { threshold: 0.4 });
    io.observe(sec);
  }

  function setupGrowthProgress() {
    const track = $("#growth-track"), bar = $("#growth-bar");
    if (!track || !bar) return;
    const upd = () => {
      const max = track.scrollWidth - track.clientWidth;
      bar.style.width = (max > 0 ? (track.scrollLeft / max) * 100 : 0) + "%";
    };
    upd();
    track.addEventListener("scroll", upd, { passive: true });
    addEventListener("resize", upd);
  }

  function setupHeader() {
    const bar = $(".topbar");
    const onScroll = () => bar.classList.toggle("scrolled", window.scrollY > 8);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
  }

  function setupScrollSpy() {
    const links = $$(".nav a[data-nav]");
    if (!links.length || !("IntersectionObserver" in window)) return;
    const map = {};
    links.forEach((l) => (map[l.dataset.nav] = l));
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((l) => l.classList.remove("active"));
        map[en.target.id]?.classList.add("active");
      });
    }, { rootMargin: "-45% 0px -50% 0px", threshold: 0 });
    ["story", "growth", "products", "visit"].forEach((id) => {
      const s = document.getElementById(id);
      if (s) io.observe(s);
    });
  }

  function setupGrowth() {
    const track = $("#growth-track");
    const dots = $$(".g-dot");
    if (!track || !dots.length) return;
    dots.forEach((d, idx) => {
      d.addEventListener("click", () => {
        const card = track.querySelector(`.g-card[data-idx="${d.dataset.go}"]`);
        card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      });
      d.addEventListener("keydown", (e) => {
        if (e.key === "ArrowRight") { e.preventDefault(); const n = dots[Math.min(idx + 1, dots.length - 1)]; n?.focus(); n?.click(); }
        if (e.key === "ArrowLeft")  { e.preventDefault(); const n = dots[Math.max(idx - 1, 0)]; n?.focus(); n?.click(); }
      });
    });
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        const i = en.target.dataset.idx;
        dots.forEach((d) => {
          d.classList.toggle("on", d.dataset.go === i);
          d.setAttribute("aria-selected", d.dataset.go === i ? "true" : "false");
        });
      });
    }, { root: track, threshold: 0.75 });
    $$(".g-card", track).forEach((c) => io.observe(c));
  }

  function setupToTop() {
    const btn = $("#to-top");
    if (!btn) return;
    const onScroll = () => (btn.hidden = window.scrollY < 600);
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    btn.addEventListener("click", () =>
      window.scrollTo({ top: 0, behavior: "smooth" })
    );
  }

  function setupLightbox() {
    const lb = $("#lightbox"), img = $("#lb-img");
    if (!lb) return;
    const open = (src) => { img.src = src; lb.hidden = false; document.body.style.overflow = "hidden"; };
    const close = () => { lb.hidden = true; img.removeAttribute("src"); document.body.style.overflow = ""; };
    document.addEventListener("click", (e) => {
      const z = e.target.closest("img.zoomable");
      if (z) { open(z.dataset.zoom); return; }
      if (e.target.closest(".lb-close") || e.target === lb) close();
    });
    document.addEventListener("keydown", (e) => e.key === "Escape" && !lb.hidden && close());
  }

  /* ---------- 8. 이벤트 바인딩 ---------- */
  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-inc],[data-dec],[data-rm],[data-grp],[data-pq],#pdp-add,#pdp-order");
      if (!t) return;
      if (t.id === "pdp-add") addCurrentToCart();
      else if (t.id === "pdp-order") { openDrawer(); showView("checkout"); }
      else if (t.dataset.grp) selectOption(t.dataset.grp, Number(t.dataset.i));
      else if (t.dataset.pq) setPdpQty(Number(t.dataset.pq));
      else if (t.dataset.inc) setQty(t.dataset.inc, 1);
      else if (t.dataset.dec) setQty(t.dataset.dec, -1);
      else if (t.dataset.rm) removeItem(t.dataset.rm);
    });

    // 담기 전 옵션 확인 모달
    const cm = $("#cart-confirm-modal");
    $("#cc-cancel").addEventListener("click", closeCartConfirm);
    $("#cc-confirm").addEventListener("click", () => { closeCartConfirm(); doAddCurrentToCart(); });
    cm.addEventListener("click", (e) => e.target === cm && closeCartConfirm());
    document.addEventListener("keydown", (e) => e.key === "Escape" && !cm.hidden && closeCartConfirm());

    // 장바구니 담김 확인 모달
    const am = $("#added-modal");
    const closeAdded = () => { am.hidden = true; };
    $("#added-continue").addEventListener("click", closeAdded);
    $("#added-view").addEventListener("click", () => { closeAdded(); openDrawer(); });
    am.addEventListener("click", (e) => e.target === am && closeAdded());
    document.addEventListener("keydown", (e) => e.key === "Escape" && !am.hidden && closeAdded());

    $("#open-cart").addEventListener("click", openDrawer);
    $("#floating-cart").addEventListener("click", openDrawer);
    $("#close-cart").addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

    // 주문하기 → 방법 선택 화면
    $("#go-checkout").addEventListener("click", () => showView("method"));

    // 방법 선택
    $("#go-sms").addEventListener("click", () => { orderMethod = "sms"; showView("checkout"); });
    $("#go-call").addEventListener("click", () => {
      window.location.href = `tel:${digits(FARM.phone)}`;
      closeDrawer();
    });
    $("#back-method").addEventListener("click", () => showView("cart"));

    // 정보 입력 폼
    $("#back-cart").addEventListener("click", () => showView("method"));
    $("#new-order").addEventListener("click", () => { showView("cart"); closeDrawer(); });
    $("#checkout-view").addEventListener("submit", submitOrder);

    // 수령 방법에 따라 주소칸 토글
    $$('input[name="method"]').forEach((r) =>
      r.addEventListener("change", () => {
        $("#addr-field").style.display = r.value === "농장 직접수령" ? "none" : "flex";
      })
    );
  }

  /* ---------- 부트 ---------- */
  // 판매 전이면 장바구니 진입점 숨기고 히어로 CTA 문구 변경
  if (!CONFIG.saleOpen) {
    const oc = document.getElementById("open-cart");
    if (oc) oc.style.display = "none";
    const hb = document.querySelector(".hero-actions .btn-primary");
    if (hb) { hb.textContent = "사전 문의하기"; hb.href = smsHref(inquiryBody()); }
  }

  hydrate();
  renderTrust();
  renderStats();
  renderValues();
  renderGrowth();
  renderPDP();
  renderCart();
  updateBadges();
  bind();
  setupIntro();
  setupReveal();
  mountHeroBg();
  countUpBrix();
  setupStats();
  setupHeader();
  setupScrollSpy();
  setupGrowth();
  setupGrowthProgress();
  setupHeroParallax();
  setupToTop();
  setupLightbox();
})();
