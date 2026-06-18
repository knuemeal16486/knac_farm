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

  /* ---------- 1. 콘텐츠 바인딩 ---------- */
  function hydrate() {
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
    loadPhoto($('[data-photo="farmer"]'), FARMER.photo);

    $("#map-link").href =
      "https://map.naver.com/v5/search/" + encodeURIComponent(FARM.mapQuery);
    $("#ship-note").textContent = CONFIG.shipping;
    $("#bank-acc").textContent = CONFIG.bankAccount;
  }

  /* 사진이 실제로 존재할 때만 표시 (없으면 일러스트 유지) */
  function loadPhoto(frame, src) {
    if (!frame || !src) return;
    const img = new Image();
    img.onload = () => {
      frame.innerHTML = "";
      img.alt = "";
      frame.appendChild(img);
    };
    img.src = src;
  }

  /* ---------- 2. 제품 렌더링 ---------- */
  const grapeSVG = `<svg viewBox="0 0 40 48" width="64" height="76"><g fill="currentColor">
    <circle cx="20" cy="14" r="6"/><circle cx="11" cy="22" r="6"/><circle cx="29" cy="22" r="6"/>
    <circle cx="20" cy="29" r="6"/><circle cx="13" cy="35" r="5.5"/><circle cx="27" cy="35" r="5.5"/><circle cx="20" cy="41" r="5"/>
  </g></svg>`;

  function renderProducts() {
    const grid = $("#product-grid");
    grid.innerHTML = PRODUCTS.map((p) => `
      <article class="card${p.soldout ? " soldout" : ""}" data-id="${p.id}">
        <div class="card-img">
          <span class="grade-tag">${p.grade}</span>
          ${grapeSVG}
        </div>
        <div class="card-body">
          <h3 class="card-name">${p.name}</h3>
          <div class="card-meta">
            <span class="chip">${p.weight}</span>
            <span class="chip">${p.bunches}</span>
            <span class="chip">당도 ${p.brix} Brix</span>
          </div>
          <p class="card-desc">${p.desc}</p>
          <div class="card-foot">
            <span class="card-price">${p.price.toLocaleString("ko-KR")}<small>원</small></span>
            <button class="add-btn" data-add="${p.id}" ${p.soldout ? "disabled" : ""}>
              ${p.soldout ? "품절" : "담기"}
            </button>
          </div>
        </div>
      </article>`).join("");

    // 사진 있으면 덮어쓰기
    PRODUCTS.forEach((p) => {
      const box = $(`.card[data-id="${p.id}"] .card-img`);
      if (box && p.image) {
        const img = new Image();
        img.onload = () => box.appendChild(img);
        img.src = p.image;
      }
    });
  }

  /* ---------- 3. 장바구니 ---------- */
  const find = (id) => PRODUCTS.find((p) => p.id === id);
  const itemTotal = () => cart.reduce((s, c) => s + (find(c.id)?.price || 0) * c.qty, 0);
  const itemCount = () => cart.reduce((s, c) => s + c.qty, 0);

  function addToCart(id) {
    const row = cart.find((c) => c.id === id);
    row ? (row.qty += 1) : cart.push({ id, qty: 1 });
    persist();
    toast(`${find(id).name} 담음`);
  }
  function setQty(id, d) {
    const row = cart.find((c) => c.id === id);
    if (!row) return;
    row.qty += d;
    if (row.qty <= 0) cart = cart.filter((c) => c.id !== id);
    persist();
  }
  function removeItem(id) {
    cart = cart.filter((c) => c.id !== id);
    persist();
  }
  function persist() {
    store.write(cart);
    renderCart();
    updateBadges();
  }

  function renderCart() {
    const ul = $("#cart-items");
    const empty = $("#cart-empty");
    ul.innerHTML = cart.map((c) => {
      const p = find(c.id);
      if (!p) return "";
      return `<li class="cart-row" data-id="${p.id}">
        <div>
          <div class="ci-name">${p.name}</div>
          <div class="ci-meta">${p.weight} · ${p.bunches}</div>
          <div class="qty">
            <button data-dec="${p.id}" aria-label="수량 줄이기">−</button>
            <span>${c.qty}</span>
            <button data-inc="${p.id}" aria-label="수량 늘리기">+</button>
            <button class="ci-remove" data-rm="${p.id}">삭제</button>
          </div>
        </div>
        <span class="ci-price">${won(p.price * c.qty)}</span>
      </li>`;
    }).join("");
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
  function showView(v) {
    $("#cart-view").hidden = v !== "cart";
    $("#checkout-view").hidden = v !== "checkout";
    $("#done-view").hidden = v !== "done";
  }

  /* ---------- 5. 주문 처리 ---------- */
  function buildSummary(form) {
    const f = new FormData(form);
    const method = f.get("method");
    const lines = cart.map((c) => {
      const p = find(c.id);
      return `· ${p.name} (${p.weight}) ${c.qty}개 — ${won(p.price * c.qty)}`;
    });
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
    const form = e.target;
    const fd = new FormData(form);
    const method = fd.get("method");
    if (method === "택배" && !(fd.get("address") || "").trim()) {
      toast("주소를 입력해 주세요");
      form.elements.namedItem("address").focus();
      return;
    }
    const summary = buildSummary(form);

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
    $("#done-desc").textContent = CONFIG.formEndpoint
      ? "주문이 농장으로 전송되었습니다. 아래 내용을 한 번 더 보내주시면 더 확실합니다."
      : "아래 버튼으로 주문 내용을 농장에 전송해 주세요.";

    const tel = digits(FARM.phone);
    const body = encodeURIComponent(summary);
    const actions = [
      `<a class="btn btn-primary full" href="sms:${tel}?&body=${body}">문자로 주문 보내기</a>`,
      CONFIG.kakaoUrl ? `<a class="btn btn-ghost full" target="_blank" rel="noopener" href="${CONFIG.kakaoUrl}">카카오톡 상담</a>` : "",
      `<a class="btn btn-ghost full" href="tel:${tel}">전화 주문 (${FARM.phone})</a>`,
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
    const targets = $$(".story, .section-head, .card, .visit-info");
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

  /* ---------- 8. 이벤트 바인딩 ---------- */
  function bind() {
    document.addEventListener("click", (e) => {
      const t = e.target.closest("[data-add],[data-inc],[data-dec],[data-rm]");
      if (!t) return;
      if (t.dataset.add) addToCart(t.dataset.add);
      else if (t.dataset.inc) setQty(t.dataset.inc, 1);
      else if (t.dataset.dec) setQty(t.dataset.dec, -1);
      else if (t.dataset.rm) removeItem(t.dataset.rm);
    });

    $("#open-cart").addEventListener("click", openDrawer);
    $("#floating-cart").addEventListener("click", openDrawer);
    $("#close-cart").addEventListener("click", closeDrawer);
    backdrop.addEventListener("click", closeDrawer);
    document.addEventListener("keydown", (e) => e.key === "Escape" && closeDrawer());

    $("#go-checkout").addEventListener("click", () => showView("checkout"));
    $("#back-cart").addEventListener("click", () => showView("cart"));
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
  hydrate();
  renderProducts();
  renderCart();
  updateBadges();
  bind();
  setupReveal();
})();
