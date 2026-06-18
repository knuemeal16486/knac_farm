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

    $("#map-link").href =
      "https://map.naver.com/v5/search/" + encodeURIComponent(FARM.mapQuery);
    $("#ship-note").textContent = CONFIG.shipping;
    $("#bank-acc").textContent = CONFIG.bankAccount;
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
    const icons = ["drop", "badge", "sun", "spark"];
    $("#values-grid").innerHTML = VALUES.map((v, i) => `
      <article class="value-card">
        <span class="value-ic">${svg(icons[i % 4], 30)}</span>
        <h3 class="value-title">${v.title}</h3>
        <p class="value-desc">${v.desc}</p>
      </article>`).join("");
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

    // 사진 있으면 덮어쓰기 (없으면 일러스트 유지)
    PRODUCTS.forEach((p) => {
      const box = $(`.card[data-id="${p.id}"] .card-img`);
      mountImage(box, p.image, p.name, true);
    });
  }

  /* ---------- 성장 일지 렌더 ---------- */
  function renderGrowth() {
    const dots = $("#growth-dots");
    const track = $("#growth-track");
    if (!dots || !track) return;
    dots.innerHTML = GROWTH.map((g, i) =>
      `<button class="g-dot${i === 0 ? " on" : ""}" data-go="${i}" role="tab" aria-label="${g.date} ${g.title}">${g.date}</button>`
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
    dots.forEach((d) =>
      d.addEventListener("click", () => {
        const card = track.querySelector(`.g-card[data-idx="${d.dataset.go}"]`);
        card?.scrollIntoView({ behavior: "smooth", inline: "center", block: "nearest" });
      })
    );
    if (!("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((es) => {
      es.forEach((en) => {
        if (!en.isIntersecting) return;
        const i = en.target.dataset.idx;
        dots.forEach((d) => d.classList.toggle("on", d.dataset.go === i));
      });
    }, { root: track, threshold: 0.6 });
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
  renderTrust();
  renderValues();
  renderGrowth();
  renderProducts();
  renderCart();
  updateBadges();
  bind();
  setupReveal();
  mountHeroBg();
  countUpBrix();
  setupHeader();
  setupScrollSpy();
  setupGrowth();
  setupToTop();
  setupLightbox();
})();
