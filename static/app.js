/* sedekah.je — client-side interactions */
(function () {
  "use strict";

  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.prototype.slice.call((root || document).querySelectorAll(sel)); }
  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  // ---------- footer year ----------
  var yr = qs("#year");
  if (yr) yr.textContent = new Date().getFullYear();

  // ---------- institution expansion modal ----------
  document.addEventListener("click", function (e) {
    var tile = e.target.closest(".qr-tile");
    var card = e.target.closest(".institution-card");
    if (tile && card) {
      e.preventDefault();
      var modal = document.createElement("div");
      modal.className = "modal-backdrop";
      modal.innerHTML =
        '<div class="modal-card">' +
        '<button class="modal-close" aria-label="Tutup">×</button>' +
        tile.outerHTML +
        "<h3>" + esc(card.querySelector(".card-title") ? card.querySelector(".card-title").textContent : "") + "</h3>" +
        "<p class='subtext'>" + esc(card.querySelector(".card-location") ? card.querySelector(".card-location").textContent : "") + "</p>" +
        '<a class="btn btn-primary" target="_blank" href="' + card.getAttribute("href") + '">Buka halaman</a>' +
        "</div>";
      document.body.appendChild(modal);
      modal.querySelector(".modal-close").addEventListener("click", function () { modal.remove(); });
      modal.addEventListener("click", function (event) { if (event.target === modal) modal.remove(); });
      document.body.style.overflow = "hidden";
      modal.addEventListener("remove", function () { document.body.style.overflow = ""; });
    }
  });

  // ---------- home search + filters (server-rendered initial, JS enhances) ----------
  var grid = qs("#results-grid");
  var countChip = qs("#count-chip");
  var emptyState = qs("#results-empty");
  var qInput = qs("#q");
  var stateSel = qs("#state");
  var catButtons = qsa(".cat-button");
  var page = 1;
  var hasMore = true;
  var loading = false;
  var debounceTimer = null;

  if (qInput && grid) {
    function currentFilters() {
      var cats = catButtons.filter(function (b) { return b.classList.contains("active"); }).map(function (b) { return b.getAttribute("data-cat"); });
      return {
        q: qInput.value,
        cat: cats.join(","),
        state: stateSel ? stateSel.value : ""
      };
    }

    function buildURL(f) {
      var u = "/api/institutions?page=" + page + "&limit=50";
      if (f.q) u += "&search=" + encodeURIComponent(f.q);
      if (f.cat) u += "&category=" + encodeURIComponent(f.cat);
      if (f.state) u += "&state=" + encodeURIComponent(f.state);
      return u;
    }

    function toCard(inst) {
      var brand = brandFor(inst); // {color, label}
      var qr = inst.qrContent
        ? '<div class="qr-tile card-qr" style="background:' + brand.color + '"><div class="qr-inner">' + esc(inst.qrContent) + '</div></div>'
        : (inst.qrImage ? '<div class="qr-tile card-qr qr-img"><img src="' + esc(inst.qrImage) + '" alt="Kod QR" /></div>' : '');
      // NOTE: inlined SVG QR is generated server-side below; this client path is used for append-only pages.
      return qrInjectCard(inst, brand);
    }

    function qrInjectCard(inst, brand) {
      var name = titleCase(inst.name);
      var city = titleCase(inst.city);
      var state = titleCase(inst.state);
      var href = "/" + inst.category + "/" + inst.slug;
      return (
        '<a class="institution-card" href="' + href + '" aria-label="Buka halaman ' + esc(name) + '">' +
        '<div class="card-top"><div class="card-cat-icon">' + catIcon(inst.category) + '</div>' +
        '<div class="card-title-wrap"><h3 class="card-title">' + esc(name) + '</h3>' +
        '<span class="card-location">📍 ' + esc(city) + ", " + esc(state) + "</span></div>" +
        '<span class="category-chip" style="--cat:' + catColor(inst.category) + '">' + esc(catLabel(inst.category)) + "</span></div>" +
        '<div class="card-bottom"><div class="qr-tile card-qr qr-img" style="background:' + brand.color + '"><img src="/qr/" onerror="this.remove()" /><span class="qr-placeholder" style="color:#fff;font-weight:700">QR</span></div></div>' +
        "</a>"
      );
    }

    function fetchPage(f, append) {
      if (loading) return;
      loading = true;
      fetch(buildURL(f))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          loading = false;
          if (!data || !data.institutions) { hasMore = false; return; }
          if (countChip) countChip.textContent = data.pagination.total;
          var html = data.institutions.map(toCard).join("");
          if (append && grid) grid.innerHTML = grid.innerHTML + data.institutions.map(toCard).join("");
          else if (grid) grid.innerHTML = html;
          if (emptyState) emptyState.hidden = data.institutions.length !== 0;
          if (!append) page = 1;
          hasMore = data.pagination.hasMore;
          if (data.institutions.length === 0) { if (grid) grid.innerHTML = ""; }
        })
        .catch(function () { loading = false; });
    }

    function resetAndFetch() {
      page = 1;
      fetchPage(currentFilters(), false);
    }

    qInput.addEventListener("input", function () {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(resetAndFetch, 500);
    });
    if (stateSel) stateSel.addEventListener("change", resetAndFetch);
    catButtons.forEach(function (b) {
      b.addEventListener("click", function () {
        b.classList.toggle("active");
        b.setAttribute("aria-pressed", b.classList.contains("active") ? "true" : "false");
        resetAndFetch();
      });
    });
    var resetBtn = qs("#reset-filters");
    if (resetBtn) resetBtn.addEventListener("click", function () {
      if (qInput) qInput.value = "";
      if (stateSel) stateSel.value = "";
      catButtons.forEach(function (b) { b.classList.remove("active"); });
      resetAndFetch();
    });
    var resetEmpty = qs("#reset-empty");
    if (resetEmpty) resetEmpty.addEventListener("click", function () {
      if (qInput) qInput.value = "";
      if (stateSel) stateSel.value = "";
      catButtons.forEach(function (b) { b.classList.remove("active"); });
      resetAndFetch();
    });

    // infinite scroll
    var sentinel = qs("#results-end");
    if (sentinel && "IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        if (entries[0].isIntersecting && hasMore && !loading) {
          page += 1;
          fetchPage(currentFilters(), true);
        }
      }, { rootMargin: "400px" });
      io.observe(sentinel);
    }

    function catIcon(c) {
      var svgs = {
        masjid: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 3 2 9h20L12 3zm-8 8h16v10h-5v-5a3 3 0 0 0-6 0v5H4V11z"/></svg>',
        surau: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M4 4h16v4H4V4zm0 6h16v4H4v-4zm0 6h7v4H4v-4zm10 0h6v4h-6v-4z"/></svg>',
        tahfiz: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 3 2 6v14l10-3 10 3V6L12 3zm-1 13.3V8.7L5 10.3v7.6l6-1.6zm2 0 6-1.6v-7.6l-6 1.6v7.6z"/></svg>',
        kebajikan: '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/></svg>'
      };
      return svgs[c] || '<svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zM7 9h10v2H7V9zm0 4h8v2H7v-2z"/></svg>';
    }
    function catLabel(c) {
      var m = { masjid: "Masjid", surau: "Surau", tahfiz: "Tahfiz", kebajikan: "Kebajikan" };
      return m[c] || "Lain-lain";
    }
    function catColor(c) {
      var m = { masjid: "#10b981", surau: "#3b82f6", tahfiz: "#f59e0b", kebajikan: "#f97316" };
      return m[c] || "#8b5cf6";
    }
    function brandFor(inst) {
      var b = (inst.supportedPayment && inst.supportedPayment[0]);
      var m = {
        tng: { color: "#015ABF", label: "Touch 'n Go" },
        boost: { color: "#EE2E24", label: "Boost" },
        toyyibpay: { color: "#00847F", label: "ToyyibPay" }
      };
      return m[b] || { color: "#ED2C67", label: "DuitNow" };
    }
    function titleCase(s) {
      return String(s || "").replace(/\w\S*/g, function (t) {
        if (/^[A-Z0-9.]+$/.test(t)) return t;
        return t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
      });
    }
  }

  // ---------- Rawak ----------
  var rawakApp = qs("#rawak-app");
  if (rawakApp) {
    var pool = [];
    try { pool = JSON.parse(rawakApp.getAttribute("data-institutions") || "[]"); } catch (e) { pool = []; }
    var cats = [], st = "";
    var result = qs("#rawak-result");
    var countEl = qs("#rawak-count");
    var genBtn = qs("#rawak-generate");
    var resetBtn = qs("#rawak-reset");

    function filtered() {
      return pool.filter(function (i) {
        var okC = cats.length === 0 || cats.indexOf(i.category) !== -1;
        var okS = !st || i.state === st;
        return okC && okS;
      });
    }
    genBtn.addEventListener("click", function () {
      var list = filtered();
      if (list.length === 0) {
        result.innerHTML = '<div class="empty-card"><p>Tiada institusi sepadan pilihan.</p></div>';
        return;
      }
      var pick = list[Math.floor(Math.random() * list.length)];
      renderRawak(pick);
    });
    qsa("#rawak-cats .cat-button").forEach(function (b) {
      b.addEventListener("click", function () {
        b.classList.toggle("active");
        cats = qsa("#rawak-cats .cat-button.active").map(function (x) { return x.getAttribute("data-cat"); });
        updateCount();
      });
    });
    var stSel = qs("#rawak-state");
    if (stSel) stSel.addEventListener("change", function () { st = stSel.value; updateCount(); });
    function updateCount() {
      var list = filtered();
      if (countEl) countEl.hidden = true;
      if (resetBtn) resetBtn.hidden = !(cats.length || st);
    }
    function renderRawak(pick) {
      var brand = brandFor(pick);
      var qr = pick.qrContent
        ? '<div class="qr-tile" style="background:' + brand.color + '"><div class="qr-inner"></div></div>'
        : (pick.qrImage ? '<div class="qr-tile qr-img"><img src="' + esc(pick.qrImage) + '" alt="QR" /></div>' : "");
      var slug = pick.slug || slugify(pick.name);
      var url = "https://www.sedekah.je/" + pick.category + "/" + slug;
      result.innerHTML =
        '<div class="empty-card">' + qr +
        "<h3>" + esc(titleCase(pick.name)) + "</h3>" +
        "<p class='subtext'>📍 " + esc(titleCase(pick.city)) + ", " + esc(titleCase(pick.state)) + "</p>" +
        '<div class="empty-actions">' +
        '<a class="btn btn-outline" href="' + url + '">Buka halaman</a>' +
        '<button class="btn btn-ghost js-copy">Salin</button>' +
        '<a class="btn btn-ghost" target="_blank" href="https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(pick.name) + '">Peta</a>' +
        "</div></div>";
      var copy = result.querySelector(".js-copy");
      if (copy) {
        copy.addEventListener("click", function () {
          navigator.clipboard.writeText(url).then(function () { copy.textContent = "Disalin!"; });
        });
      }
      result.classList.remove("empty-card");
      result.classList.add("empty-card");
    }
    function slugify(s) {
      return String(s || "").toLowerCase().replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
    }
  }

  // ---------- FAQ ----------
  var faqSearch = qs("#faq-search");
  if (faqSearch) {
    faqSearch.addEventListener("input", function () {
      var q = faqSearch.value.toLowerCase();
      qsa(".faq-item").forEach(function (item) {
        var text = item.textContent.toLowerCase();
        item.hidden = q && text.indexOf(q) === -1;
      });
    });
    // deep link hash
    if (location.hash && location.hash.length > 1) {
      var target = qs(location.hash);
      if (target && target.classList.contains("faq-item")) target.open = true;
    }
  }

  // ---------- Quest ----------
  if (window.__QUEST__) {
    var rows = window.__QUEST__ || [];
    var listEl = qs("#quest-list");
    var detailEl = qs("#quest-detail");
    var statusFilter = "all";
    var searchTxt = "";
    var sortMode = "az";
    var selectedId = null;

    function statusOf(r) {
      if (r.status === "approved") return "unlocked";
      if (r.status === "pending") return "pending";
      return "locked";
    }
    function filteredRows() {
      return rows.filter(function (r) {
        if (statusFilter !== "all" && statusOf(r) !== statusFilter) return false;
        if (searchTxt && (r.name + " " + (r.address || "")).toLowerCase().indexOf(searchTxt) === -1) return false;
        return true;
      }).slice().sort(function (a, b) {
        if (sortMode === "status") {
          var ord = { unlocked: 0, pending: 1, locked: 2 };
          if ((ord[statusOf(a)] || 0) - (ord[statusOf(b)] || 0) !== 0)
            return (ord[statusOf(a)] || 0) - (ord[statusOf(b)] || 0);
        }
        return a.name.localeCompare(b.name, "ms");
      });
    }
    function render() {
      if (!listEl) return;
      var fr = filteredRows();
      listEl.innerHTML = fr.map(function (r) {
        var st = statusOf(r);
        var icon = st === "unlocked" ? "✅" : st === "pending" ? "⏳" : "🔒";
        return '<li class="quest-item' + (selectedId === r.id ? ' active' : '') + '" data-id="' + r.id + '">' +
          '<span class="qicon ' + st + '">' + icon + "</span>" +
          "<span><b>" + esc(titleCase(r.name)) + "</b><div class='subtext'>" + esc(r.district) + "</div></span></li>";
      }).join("");
      var cnt = qs("#quest-count");
      if (cnt) cnt.textContent = fr.length + "/" + rows.length + " masjid";
      qsa(".quest-item").forEach(function (li) {
        li.addEventListener("click", function () {
          selectedId = +li.getAttribute("data-id");
          renderDetail(selectedId);
          render();
        });
      });
    }
    qsa("#quest-filter .cat-button").forEach(function (b) {
      b.addEventListener("click", function () {
        qsa("#quest-filter .cat-button").forEach(function (x) { x.classList.remove("active"); });
        b.classList.add("active");
        statusFilter = b.getAttribute("data-q");
        render();
      });
    });
    var qSearch = qs("#quest-search");
    if (qSearch) qSearch.addEventListener("input", function () { searchTxt = qSearch.value.toLowerCase(); render(); });
    var qSort = qs("#quest-sort");
    if (qSort) qSort.addEventListener("change", function () { sortMode = qSort.value; render(); });
    render();

    function renderDetail(id) {
      var r = rows.find(function (x) { return x.id === id; });
      if (!r || !detailEl) return;
      var st = statusOf(r);
      var html = '<div class="card stack quest-detail">';
      html += "<h3>" + esc(titleCase(r.name)) + "</h3>";
      html += "<p class='subtext'>" + esc(r.district || "") + (r.address ? "<br>" + esc(r.address) : "") + "</p>";
      if (st === "unlocked") {
        html += '<span class="status-chip status-approved">Tersedia</span>';
        if (r.category && r.slug) {
          html += '<a class="btn btn-outline" href="/' + esc(r.category) + "/" + esc(r.slug) + '">Buka halaman</a>';
        }
        if (r.qrContent) {
          html += '<div class="qr-tile" style="background:' + brandFor(r).color + '"></div>';
        }
      } else if (st === "pending") {
        html += '<span class="status-chip status-pending">Dalam semakan</span>';
      } else {
        html += '<span class="status-chip" style="background:#e2e8f0;color:var(--muted)">Belum tersedia</span>';
        if (window.__QUEST_LOGGED__) {
          html +=
            '<form method="post" action="/quest/submit" enctype="multipart/form-data" class="stack quest-contribute">' +
            '<input type="hidden" name="questMosqueId" value="' + r.id + '" />' +
            '<div class="field"><label for="quest-qr">Gambar Kod QR *</label>' +
            '<input type="file" id="quest-qr" name="qrImage" accept="image/*" capture="environment" required /></div>' +
            '<input type="hidden" name="qrContent" />' +
            '<div class="field"><label for="quest-source">Sumber (URL, opsional)</label><input id="quest-source" name="sourceUrl" class="search-input" /></div>' +
            '<button class="btn btn-primary" type="submit">Hantar QR</button></form>';
        } else {
          html += '<a class="btn btn-primary" href="/auth?next=%2Fquest&reason=submit_qr">Log Masuk dengan Google</a>';
        }
      }
      html += "</div>";
      detailEl.innerHTML = html;
    }

    // Leaflet map
    if (window.L && qs("#quest-map")) {
      var map = L.map("quest-map", { zoomControl: true }).setView([3.1, 101.62], 12);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19
      }).addTo(map);
      var bounds = [];
      rows.forEach(function (r) {
        if (!r.coords || r.coords.length < 2) return;
        var lat = r.coords[0], lng = r.coords[1];
        bounds.push([lat, lng]);
        var st = statusOf(r);
        var color = st === "unlocked" ? "#10b981" : st === "pending" ? "#f59e0b" : "#94a3b8";
        var icon = L.divIcon({ className: "", html: '<div style="background:' + color + ';width:26px;height:26px;border-radius:50%;border:2px solid #fff;display:flex;align-items:center;justify-content:center;color:#fff;font-size:13px">' + (st === "unlocked" ? "✓" : "🔒") + "</div>" });
        L.marker([lat, lng], { icon: icon }).addTo(map).bindTooltip(titleCase(r.name));
      });
      if (bounds.length) map.fitBounds(L.latLngBounds(bounds).pad(0.12));
    }
  }

  // ---------- Ramadhan calendar ----------
  if (window.__RAMADHAN__) {
    var camp = window.__RAMADHAN__ || [];
    var panel = qs("#ramadhan-detail");
    qsa(".ramadhan-day").forEach(function (day) {
      day.addEventListener("click", function () {
        var dn = +day.getAttribute("data-day");
        var item = camp.find(function (c) { return c.day === dn; });
        if (!item || !panel) {
          if (panel) panel.innerHTML = '<p class="placeholder">Hari ini belum diisi.</p>';
          return;
        }
        var brand = brandFor(item);
        var qr = item.qrContent
          ? '<div class="qr-tile" style="background:' + brand.color + '"></div>'
          : (item.qrImage ? '<div class="qr-tile qr-img"><img src="' + esc(item.qrImage) + '" alt="QR" /></div>' : "");
        panel.innerHTML =
          '<div class="card stack" style="align-items:center;text-align:center">' +
          '<div class="banner-eyebrow">Hari ' + dn + "/30 · " + esc(item.date) + "</div>" +
          "<h3>" + esc(item.name) + "</h3>" +
          "<p class='subtext'>" + esc(item.city) + ", " + esc(item.state) + "</p>" + qr +
          (item.caption ? "<p>" + esc(item.caption) + "</p>" : "") +
          '<a class="btn btn-primary" href="/' + item.category + "/" + item.slug + '">Lihat institusi & derma</a>' +
          "</div>";
      });
    });
  }
})();
