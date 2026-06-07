/* ═══════════════════════════════════════════════════════════════
   MarketNest — app.js
   Complete trading platform logic
═══════════════════════════════════════════════════════════════ */

// ─── Constants ────────────────────────────────────────────────
const STARTING_CASH = 10000;

const WATCHLISTS = {
  stocks: [
    { sym: 'AAPL',  name: 'Apple Inc.' },
    { sym: 'MSFT',  name: 'Microsoft Corp.' },
    { sym: 'GOOGL', name: 'Alphabet Inc.' },
    { sym: 'TSLA',  name: 'Tesla Inc.' },
    { sym: 'NVDA',  name: 'NVIDIA Corp.' },
  ],
  gold: [
    { sym: 'GLD',  name: 'SPDR Gold Shares' },
    { sym: 'IAU',  name: 'iShares Gold Trust' },
    { sym: 'GOLD', name: 'Barrick Gold Corp.' },
    { sym: 'NEM',  name: 'Newmont Corporation' },
  ],
  oil: [
    { sym: 'USO',  name: 'United States Oil Fund' },
    { sym: 'XLE',  name: 'Energy Select Sector ETF' },
    { sym: 'OXY',  name: 'Occidental Petroleum' },
    { sym: 'XOM',  name: 'Exxon Mobil Corp.' },
    { sym: 'CVX',  name: 'Chevron Corp.' },
  ],
  crypto: [
    { sym: 'BTC-USD',  name: 'Bitcoin' },
    { sym: 'ETH-USD',  name: 'Ethereum' },
    { sym: 'SOL-USD',  name: 'Solana' },
    { sym: 'DOGE-USD', name: 'Dogecoin' },
    { sym: 'XRP-USD',  name: 'Ripple' },
    { sym: 'ADA-USD',  name: 'Cardano' },
    { sym: 'AVAX-USD', name: 'Avalanche' },
  ],
};

const EARNINGS = {
  // key = "YYYY-MM-DD"
  '2026-06-10': [{ sym: 'AAPL',  company: 'Apple Inc.' }],
  '2026-06-12': [{ sym: 'MSFT',  company: 'Microsoft Corp.' }],
  '2026-06-15': [{ sym: 'GOOGL', company: 'Alphabet Inc.' }],
  '2026-06-18': [{ sym: 'TSLA',  company: 'Tesla Inc.' }],
  '2026-06-20': [{ sym: 'NVDA',  company: 'NVIDIA Corp.' }],
  '2026-06-25': [{ sym: 'META',  company: 'Meta Platforms Inc.' }],
};

const MOOD_VALUE = 62; // Hardcoded market mood (Greed)

// ─── State ────────────────────────────────────────────────────
let currentUser    = null; // { name, email }
let currentTab     = 'stocks';
let selectedTicker = null;
let priceChart     = null;
let priceCache     = {};   // { [sym]: { price, change, history, ts } }
let calYear        = 2026;
let calMonth       = 5;    // 0-indexed, 5 = June

// ─── Storage Helpers ──────────────────────────────────────────
function portfolioKey() { return `mn_portfolio_${currentUser.name}`; }
function tierKey()      { return `mn_tier_${currentUser.name}`; }

function loadPortfolio() {
  try {
    const s = localStorage.getItem(portfolioKey());
    if (s) return JSON.parse(s);
  } catch (e) {}
  return { cash: STARTING_CASH, holdings: {}, trades: [] };
}
function savePortfolio(p) {
  localStorage.setItem(portfolioKey(), JSON.stringify(p));
}
function getPortfolio() { return loadPortfolio(); }

function getTier() {
  return localStorage.getItem(tierKey()) || 'free';
}
function setTier(t) {
  localStorage.setItem(tierKey(), t);
}
function isPro() { return getTier() === 'pro'; }

// ─── AUTH ─────────────────────────────────────────────────────
function showAuthTab(tab) {
  document.getElementById('signin-form').classList.toggle('hidden', tab !== 'signin');
  document.getElementById('signup-form').classList.toggle('hidden', tab !== 'signup');
  document.getElementById('tab-signin').classList.toggle('active', tab === 'signin');
  document.getElementById('tab-signup').classList.toggle('active', tab === 'signup');
}

function getUsers() {
  try { return JSON.parse(localStorage.getItem('mn_users') || '[]'); } catch(e) { return []; }
}
function saveUsers(users) {
  localStorage.setItem('mn_users', JSON.stringify(users));
}

function signIn(e) {
  e.preventDefault();
  const email    = document.getElementById('si-email').value.trim();
  const password = document.getElementById('si-password').value;
  const errEl    = document.getElementById('si-error');
  const users    = getUsers();
  const user     = users.find(u => u.email === email && u.password === password);
  if (!user) {
    errEl.textContent = '❌ Incorrect email or password.';
    return;
  }
  errEl.textContent = '';
  launchApp({ name: user.name, email: user.email });
}

function signUp(e) {
  e.preventDefault();
  const name     = document.getElementById('su-name').value.trim();
  const email    = document.getElementById('su-email').value.trim();
  const password = document.getElementById('su-password').value;
  const errEl    = document.getElementById('su-error');
  if (!name || !email || password.length < 6) {
    errEl.textContent = '❌ Please fill all fields. Password min 6 chars.';
    return;
  }
  const users = getUsers();
  if (users.find(u => u.email === email)) {
    errEl.textContent = '❌ Email already registered. Sign in instead.';
    return;
  }
  users.push({ name, email, password });
  saveUsers(users);
  errEl.textContent = '';
  launchApp({ name, email });
}

function continueAsGuest() {
  launchApp({ name: 'Guest', email: 'guest@marketnest.app' });
}

function signOut() {
  currentUser = null;
  // Reset state
  selectedTicker = null;
  priceCache = {};
  if (priceChart) { priceChart.destroy(); priceChart = null; }
  document.getElementById('main-app').classList.add('hidden');
  document.getElementById('auth-screen').classList.remove('hidden');
  // Clear form fields
  document.getElementById('si-email').value    = '';
  document.getElementById('si-password').value = '';
  document.getElementById('su-name').value     = '';
  document.getElementById('su-email').value    = '';
  document.getElementById('su-password').value = '';
  document.getElementById('si-error').textContent = '';
  document.getElementById('su-error').textContent = '';
}

function launchApp(user) {
  currentUser = user;
  document.getElementById('auth-screen').classList.add('hidden');
  document.getElementById('main-app').classList.remove('hidden');
  // Populate navbar user info
  document.getElementById('user-avatar').textContent = user.name.charAt(0).toUpperCase();
  document.getElementById('dd-name').textContent     = user.name;
  document.getElementById('dd-email').textContent    = user.email;
  updateTierUI();
  renderTickerGrid();
  updateStats();
  renderPortfolio();
  renderTradeLog();
  renderCalendar();
  renderMoodMeter();
}

// ─── Tier UI ──────────────────────────────────────────────────
function updateTierUI() {
  const pill = document.getElementById('tier-pill');
  if (isPro()) {
    pill.textContent = 'PRO';
    pill.className   = 'tier-pill pro';
    // Unblur SMA values if panel open
    document.querySelectorAll('.sma-val').forEach(el => el.classList.remove('locked'));
    const t10 = document.getElementById('sma10-pro-tag');
    const t30 = document.getElementById('sma30-pro-tag');
    if (t10) t10.style.display = 'none';
    if (t30) t30.style.display = 'none';
    // Hide econ overlay
    const ov = document.getElementById('econ-overlay');
    if (ov) ov.style.display = 'none';
  } else {
    pill.textContent = 'FREE';
    pill.className   = 'tier-pill';
  }
}

// ─── Price Fetching ───────────────────────────────────────────
async function fetchPrice(ticker) {
  if (priceCache[ticker] && (Date.now() - priceCache[ticker].ts) < 60000) {
    return priceCache[ticker];
  }
  try {
    const url   = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo`;
    const proxy = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    const res   = await fetch(proxy);
    const json  = await res.json();
    const data  = JSON.parse(json.contents);
    const result  = data.chart.result[0];
    const closes  = result.indicators.quote[0].close.filter(v => v !== null && v !== undefined);
    const price   = closes[closes.length - 1];
    const prev    = closes[closes.length - 2] || price;
    const change  = ((price - prev) / prev * 100).toFixed(2);
    const cached  = { price, change, history: closes, ts: Date.now() };
    priceCache[ticker] = cached;
    return cached;
  } catch (e) {
    return null;
  }
}

// ─── Indicators ───────────────────────────────────────────────
function computeSMA(arr, w) {
  return arr.map((_, i) =>
    i < w - 1 ? null : arr.slice(i - w + 1, i + 1).reduce((a, b) => a + b, 0) / w
  );
}

function computeRSI(arr, period = 14) {
  const rsi = new Array(arr.length).fill(null);
  for (let i = period; i < arr.length; i++) {
    let gains = 0, losses = 0;
    for (let j = i - period + 1; j <= i; j++) {
      const d = arr[j] - arr[j - 1];
      if (d > 0) gains += d; else losses -= d;
    }
    const ag = gains / period, al = losses / period;
    rsi[i] = al === 0 ? 100 : 100 - (100 / (1 + ag / al));
  }
  return rsi;
}

function getSignal(history) {
  const sma10 = computeSMA(history, 10);
  const sma30 = computeSMA(history, 30);
  const rsi   = computeRSI(history, 14);
  const n     = history.length - 1;
  const latRSI  = rsi[n];
  const latS10  = sma10[n], latS30 = sma30[n];
  const prevS10 = sma10[n - 1], prevS30 = sma30[n - 1];

  let signal = 'HOLD', reason = 'No strong signal right now. Watch and wait.';

  if (prevS10 !== null && prevS30 !== null && latS10 !== null && latS30 !== null) {
    if (prevS10 <= prevS30 && latS10 > latS30) {
      signal = 'BUY';
      reason = 'Golden Cross: SMA10 crossed above SMA30 — bullish momentum.';
    } else if (prevS10 >= prevS30 && latS10 < latS30) {
      signal = 'SELL';
      reason = 'Death Cross: SMA10 crossed below SMA30 — bearish momentum.';
    }
  }

  if (signal === 'HOLD' && latRSI !== null) {
    if (latRSI < 30) {
      signal = 'BUY';
      reason = `RSI ${latRSI.toFixed(1)} — oversold territory. Potential buying opportunity.`;
    } else if (latRSI > 70) {
      signal = 'SELL';
      reason = `RSI ${latRSI.toFixed(1)} — overbought territory. Consider taking profits.`;
    }
  }

  return { signal, reason, rsi: latRSI, sma10: latS10, sma30: latS30 };
}

// ─── Ticker Grid ──────────────────────────────────────────────
function switchTab(tab) {
  if (!isPro() && tab !== 'stocks') {
    openUpgradeModal();
    return;
  }
  currentTab = tab;
  document.querySelectorAll('.market-tab').forEach(t => t.classList.remove('active'));
  const tabEl = document.getElementById(`mtab-${tab}`);
  if (tabEl) tabEl.classList.add('active');
  const banner = document.getElementById('pro-banner');
  banner.classList.add('hidden');
  closeTradePanel();
  renderTickerGrid();
}

async function renderTickerGrid() {
  const grid    = document.getElementById('ticker-grid');
  const entries = WATCHLISTS[currentTab];
  grid.innerHTML = entries.map(({ sym, name }) => {
    const id = sym.replace(/[^a-zA-Z0-9]/g, '-');
    return `<div class="ticker-card" id="card-${id}" onclick="selectTicker('${sym}')">
      <div class="tc-sym">${sym}</div>
      <div class="tc-price" id="price-${id}"><span class="tc-spinner"></span></div>
      <div class="tc-name">${name}</div>
      <div class="tc-chg" id="chg-${id}"></div>
    </div>`;
  }).join('');

  // Fetch prices in parallel
  entries.forEach(async ({ sym }) => {
    const id   = sym.replace(/[^a-zA-Z0-9]/g, '-');
    const data = await fetchPrice(sym);
    const pe   = document.getElementById(`price-${id}`);
    const ce   = document.getElementById(`chg-${id}`);
    if (!pe) return;
    if (data) {
      pe.textContent = `$${data.price.toFixed(2)}`;
      const up = parseFloat(data.change) >= 0;
      ce.textContent = `${up ? '▲' : '▼'} ${Math.abs(data.change)}%`;
      ce.className   = `tc-chg ${up ? 'up' : 'down'}`;
    } else {
      pe.textContent = 'Unavailable';
      pe.style.color = 'var(--text-dim)';
      pe.style.fontSize = '13px';
    }
  });
}

// ─── Trade Panel ──────────────────────────────────────────────
async function selectTicker(sym) {
  selectedTicker = sym;
  // Highlight active card
  document.querySelectorAll('.ticker-card').forEach(c => c.classList.remove('active-card'));
  const id = sym.replace(/[^a-zA-Z0-9]/g, '-');
  const card = document.getElementById(`card-${id}`);
  if (card) card.classList.add('active-card');

  const panel = document.getElementById('trade-panel');
  panel.classList.remove('hidden');
  document.getElementById('tp-symbol').textContent = sym;
  document.getElementById('tp-name').textContent   = '—';
  document.getElementById('tp-price').textContent  = '…';
  document.getElementById('tp-chg').textContent    = '';
  document.getElementById('ind-signal-val').textContent = '—';
  document.getElementById('ind-signal-val').className   = 'ind-val';
  document.getElementById('ind-signal-hint').textContent = '';
  document.getElementById('ind-rsi-val').textContent    = '—';
  document.getElementById('ind-rsi-hint').textContent   = '';
  document.getElementById('ind-sma10-val').textContent  = '—';
  document.getElementById('ind-sma30-val').textContent  = '—';
  document.getElementById('trade-msg').textContent = '';
  document.getElementById('trade-msg').className   = 'trade-msg-box';

  // Find name from watchlist
  const allEntries = [...WATCHLISTS.stocks, ...WATCHLISTS.gold, ...WATCHLISTS.crypto];
  const entry = allEntries.find(e => e.sym === sym);
  if (entry) document.getElementById('tp-name').textContent = entry.name;

  const data = await fetchPrice(sym);
  if (!data) {
    document.getElementById('tp-price').textContent = 'Unavailable';
    return;
  }

  document.getElementById('tp-price').textContent = `$${data.price.toFixed(2)}`;
  const up = parseFloat(data.change) >= 0;
  const chgEl = document.getElementById('tp-chg');
  chgEl.textContent = `${up ? '▲' : '▼'} ${Math.abs(data.change)}%`;
  chgEl.className   = `tp-chg ${up ? 'up' : 'down'}`;

  const sig = getSignal(data.history);

  // Signal
  const sigEl = document.getElementById('ind-signal-val');
  sigEl.textContent = sig.signal;
  sigEl.className   = `ind-val ${sig.signal.toLowerCase()}`;
  document.getElementById('ind-signal-hint').textContent = sig.reason;

  // RSI
  const rsiEl = document.getElementById('ind-rsi-val');
  rsiEl.textContent = sig.rsi !== null ? sig.rsi.toFixed(1) : '—';
  if (sig.rsi !== null) {
    rsiEl.className = sig.rsi < 30 ? 'ind-val buy' : sig.rsi > 70 ? 'ind-val sell' : 'ind-val hold';
    document.getElementById('ind-rsi-hint').textContent =
      sig.rsi < 30 ? 'Oversold — possible buy zone' :
      sig.rsi > 70 ? 'Overbought — possible sell zone' : 'Neutral zone';
  }

  // SMA
  const sma10El = document.getElementById('ind-sma10-val');
  const sma30El = document.getElementById('ind-sma30-val');
  sma10El.textContent = sig.sma10 !== null ? `$${sig.sma10.toFixed(2)}` : '—';
  sma30El.textContent = sig.sma30 !== null ? `$${sig.sma30.toFixed(2)}` : '—';
  if (isPro()) {
    sma10El.classList.remove('locked');
    sma30El.classList.remove('locked');
    document.getElementById('sma10-pro-tag').style.display = 'none';
    document.getElementById('sma30-pro-tag').style.display = 'none';
  } else {
    sma10El.classList.add('locked');
    sma30El.classList.add('locked');
    document.getElementById('sma10-pro-tag').style.display = '';
    document.getElementById('sma30-pro-tag').style.display = '';
  }

  renderTradeChart(data.history, sig);
  panel.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function closeTradePanel() {
  const panel = document.getElementById('trade-panel');
  panel.classList.add('hidden');
  selectedTicker = null;
  if (priceChart) { priceChart.destroy(); priceChart = null; }
  document.querySelectorAll('.ticker-card').forEach(c => c.classList.remove('active-card'));
}

// ─── Chart ────────────────────────────────────────────────────
function renderTradeChart(history, sig) {
  if (priceChart) priceChart.destroy();
  const labels  = history.map((_, i) => i);
  const color   = sig.signal === 'BUY' ? '#00d4a1' : sig.signal === 'SELL' ? '#ef4444' : '#60a5fa';

  const datasets = [{
    label: 'Price',
    data: history,
    borderColor: color,
    borderWidth: 2,
    pointRadius: 0,
    tension: 0.35,
    fill: true,
    backgroundColor: (ctx) => {
      const g = ctx.chart.ctx.createLinearGradient(0, 0, 0, 220);
      g.addColorStop(0, color + '22');
      g.addColorStop(1, color + '00');
      return g;
    },
  }];

  if (isPro()) {
    datasets.push({
      label: 'SMA 10',
      data: computeSMA(history, 10),
      borderColor: '#f5a623',
      borderWidth: 1.5,
      pointRadius: 0,
      borderDash: [5, 4],
      tension: 0.3,
      fill: false,
    });
    datasets.push({
      label: 'SMA 30',
      data: computeSMA(history, 30),
      borderColor: '#c084fc',
      borderWidth: 1.5,
      pointRadius: 0,
      borderDash: [5, 4],
      tension: 0.3,
      fill: false,
    });
  }

  priceChart = new Chart(document.getElementById('trade-chart').getContext('2d'), {
    type: 'line',
    data: { labels, datasets },
    options: {
      responsive: true,
      animation: { duration: 500 },
      plugins: {
        legend: { labels: { color: '#9ca3af', font: { size: 11, family: 'Outfit' }, boxWidth: 24 } },
        tooltip: { mode: 'index', intersect: false,
          backgroundColor: 'rgba(13,18,32,0.95)', titleColor: '#e8eaf0', bodyColor: '#9ca3af',
          borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1,
          callbacks: { label: ctx => ` $${ctx.parsed.y !== null ? ctx.parsed.y.toFixed(2) : '—'}` }
        },
      },
      scales: {
        x: { display: false },
        y: {
          ticks: { color: '#6b7280', font: { size: 11 }, callback: v => '$' + v.toFixed(0) },
          grid: { color: 'rgba(255,255,255,0.04)' },
        },
      },
    },
  });
}

// ─── Trade Execution ──────────────────────────────────────────
async function executeTrade(action) {
  if (!selectedTicker) return;
  const portfolio = getPortfolio();
  const data = await fetchPrice(selectedTicker);
  if (!data) { showTradeMsg('Could not fetch current price. Try again.', 'error'); return; }

  const price  = data.price;
  const amount = parseFloat(document.getElementById('trade-amount').value);
  if (isNaN(amount) || amount <= 0) {
    showTradeMsg('Please enter a valid USD amount.', 'error');
    return;
  }

  if (action === 'buy') {
    if (amount > portfolio.cash) {
      showTradeMsg(`Insufficient cash. You have $${portfolio.cash.toFixed(2)} available.`, 'error');
      return;
    }
    const units = amount / price;
    portfolio.cash -= amount;
    if (portfolio.holdings[selectedTicker]) {
      const h  = portfolio.holdings[selectedTicker];
      const nu = h.units + units;
      h.avgCost = (h.units * h.avgCost + amount) / nu;
      h.units   = nu;
    } else {
      portfolio.holdings[selectedTicker] = { units, avgCost: price };
    }
    portfolio.trades.unshift({
      time: new Date().toLocaleString(), action: 'BUY',
      ticker: selectedTicker, units: units.toFixed(6),
      price: price.toFixed(4), total: amount.toFixed(2),
    });
    showTradeMsg(`✅ Bought ${units.toFixed(6)} ${selectedTicker} @ $${price.toFixed(2)}`, 'success');

  } else if (action === 'sell') {
    const h = portfolio.holdings[selectedTicker];
    if (!h || h.units <= 0.000001) {
      showTradeMsg(`You don't own any ${selectedTicker}.`, 'error');
      return;
    }
    const maxUnits = h.units;
    const requested = amount / price;
    const units  = Math.min(requested, maxUnits);
    const total  = units * price;
    const profit = (price - h.avgCost) * units;
    portfolio.cash += total;
    h.units -= units;
    if (h.units < 0.000001) delete portfolio.holdings[selectedTicker];
    portfolio.trades.unshift({
      time: new Date().toLocaleString(), action: 'SELL',
      ticker: selectedTicker, units: units.toFixed(6),
      price: price.toFixed(4), total: total.toFixed(2),
    });
    const pnlStr = (profit >= 0 ? '+' : '') + '$' + profit.toFixed(2);
    showTradeMsg(`✅ Sold ${units.toFixed(6)} ${selectedTicker} @ $${price.toFixed(2)} (P&L ${pnlStr})`, 'success');
  }

  savePortfolio(portfolio);
  updateStats();
  renderPortfolio();
  renderTradeLog();
}

function showTradeMsg(text, type) {
  const el = document.getElementById('trade-msg');
  el.textContent = text;
  el.className   = `trade-msg-box ${type}`;
  setTimeout(() => { el.textContent = ''; el.className = 'trade-msg-box'; }, 6000);
}

// ─── Stats ────────────────────────────────────────────────────
async function updateStats() {
  const p = getPortfolio();
  let invested = 0;
  let marketValue = 0;
  for (const [sym, h] of Object.entries(p.holdings)) {
    const d = await fetchPrice(sym);
    const price = d ? d.price : h.avgCost;
    invested   += h.units * h.avgCost;
    marketValue += h.units * price;
  }
  const totalValue = p.cash + marketValue;
  const pnl        = totalValue - STARTING_CASH;

  document.getElementById('nav-cash').textContent   = fmt(p.cash);
  document.getElementById('stat-starting').textContent = fmt(STARTING_CASH);
  document.getElementById('stat-cash').textContent     = fmt(p.cash);
  document.getElementById('stat-portfolio').textContent = fmt(totalValue);

  const pnlEl = document.getElementById('stat-pnl');
  pnlEl.textContent = (pnl >= 0 ? '+' : '') + fmt(pnl);
  pnlEl.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';

  document.getElementById('stat-trades').textContent = p.trades.length;

  // Portfolio section stats
  document.getElementById('ps-total').textContent    = fmt(totalValue);
  document.getElementById('ps-cash').textContent     = fmt(p.cash);
  document.getElementById('ps-invested').textContent = fmt(invested);
  const psPnl = document.getElementById('ps-pnl');
  psPnl.textContent = (pnl >= 0 ? '+' : '') + fmt(pnl);
  psPnl.style.color = pnl >= 0 ? 'var(--green)' : 'var(--red)';
}

function fmt(n) { return '$' + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ','); }

// ─── Portfolio Table ──────────────────────────────────────────
async function renderPortfolio() {
  const p      = getPortfolio();
  const tbody  = document.getElementById('holdings-tbody');
  const empty  = document.getElementById('holdings-empty');
  const entries = Object.entries(p.holdings);

  if (!entries.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    return;
  }
  empty.classList.add('hidden');

  let rows = '';
  for (const [sym, h] of entries) {
    const d     = await fetchPrice(sym);
    const price = d ? d.price : h.avgCost;
    const val   = h.units * price;
    const pnl   = (price - h.avgCost) * h.units;
    const pnlCls = pnl >= 0 ? 'pnl-pos' : 'pnl-neg';
    const pnlStr = (pnl >= 0 ? '+' : '') + fmt(pnl);
    rows += `<tr>
      <td><strong>${sym}</strong></td>
      <td>${h.units.toFixed(6)}</td>
      <td>$${h.avgCost.toFixed(4)}</td>
      <td>$${price.toFixed(4)}</td>
      <td>${fmt(val)}</td>
      <td class="${pnlCls}">${pnlStr}</td>
      <td><button class="sell-all-btn" onclick="sellAll('${sym}')">Sell All</button></td>
    </tr>`;
  }
  tbody.innerHTML = rows;
}

async function sellAll(sym) {
  const p = getPortfolio();
  const h = p.holdings[sym];
  if (!h) return;
  const d = await fetchPrice(sym);
  if (!d) { alert('Could not fetch price. Try again.'); return; }
  const total  = h.units * d.price;
  const profit = (d.price - h.avgCost) * h.units;
  p.cash += total;
  p.trades.unshift({
    time: new Date().toLocaleString(), action: 'SELL',
    ticker: sym, units: h.units.toFixed(6),
    price: d.price.toFixed(4), total: total.toFixed(2),
  });
  delete p.holdings[sym];
  savePortfolio(p);
  updateStats();
  renderPortfolio();
  renderTradeLog();
}

function renderTradeLog() {
  const p     = getPortfolio();
  const tbody = document.getElementById('tradelog-tbody');
  const empty = document.getElementById('tradelog-empty');
  const count = document.getElementById('log-count');

  if (!p.trades.length) {
    tbody.innerHTML = '';
    empty.classList.remove('hidden');
    count.textContent = '';
    return;
  }
  empty.classList.add('hidden');
  count.textContent = `(${Math.min(p.trades.length, 50)} shown)`;

  tbody.innerHTML = p.trades.slice(0, 50).map(t => {
    const isBuy = t.action === 'BUY';
    return `<tr>
      <td style="color:var(--text-dim);font-size:12px">${t.time}</td>
      <td><strong>${t.ticker}</strong></td>
      <td style="color:${isBuy ? 'var(--green)' : 'var(--red)'};font-weight:700">${t.action}</td>
      <td>${t.units}</td>
      <td>$${t.price}</td>
      <td>$${t.total}</td>
    </tr>`;
  }).join('');
}

function resetPortfolio() {
  if (!confirm('Reset your portfolio back to $10,000? All trades will be cleared. This cannot be undone.')) return;
  const fresh = { cash: STARTING_CASH, holdings: {}, trades: [] };
  savePortfolio(fresh);
  closeTradePanel();
  updateStats();
  renderPortfolio();
  renderTradeLog();
}

// ─── Earnings Calendar ────────────────────────────────────────
function renderCalendar() {
  const months = ['January','February','March','April','May','June',
                  'July','August','September','October','November','December'];
  document.getElementById('cal-month-title').textContent = `${months[calMonth]} ${calYear}`;

  const grid = document.getElementById('cal-grid');
  const dows = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const today = new Date();

  let html = dows.map(d => `<div class="cal-dow">${d}</div>`).join('');

  for (let i = 0; i < firstDay; i++) {
    html += `<div class="cal-day empty"></div>`;
  }
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = today.getFullYear() === calYear && today.getMonth() === calMonth && today.getDate() === day;
    const dateKey = `${calYear}-${String(calMonth + 1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
    const events  = EARNINGS[dateKey] || [];
    const dotHtml = events.map(ev =>
      `<span class="cal-dot dot-${ev.sym.toLowerCase().replace(/[^a-z]/g,'')}">${ev.sym}</span>`
    ).join('');
    html += `<div class="cal-day${isToday ? ' today' : ''}">
      <div class="cal-day-num">${day}</div>
      <div class="cal-dots">${dotHtml}</div>
    </div>`;
  }
  grid.innerHTML = html;
  renderUpcomingEarnings();
}

function renderUpcomingEarnings() {
  const upcoming = Object.entries(EARNINGS)
    .sort(([a],[b]) => a.localeCompare(b))
    .slice(0, 5);

  const container = document.getElementById('upcoming-list');
  container.innerHTML = upcoming.map(([date, events]) => {
    const d = new Date(date + 'T00:00:00');
    const dateStr = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
    return events.map(ev => `
      <div class="ue-row">
        <span class="ue-ticker">${ev.sym}</span>
        <span class="ue-company">${ev.company}</span>
        <span class="ue-date">${dateStr}</span>
      </div>`).join('');
  }).join('');
}

function calPrev() {
  calMonth--;
  if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
}
function calNext() {
  calMonth++;
  if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
}

// ─── Market Mood Meter (Canvas Gauge) ─────────────────────────
function renderMoodMeter() {
  const canvas  = document.getElementById('mood-canvas');
  if (!canvas) return;
  const ctx     = canvas.getContext('2d');
  const cx      = canvas.width / 2;
  const cy      = canvas.height - 20;
  const r       = 130;
  const val     = MOOD_VALUE; // 0-100

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw arc segments (5 zones)
  const zones = [
    { start: Math.PI, end: Math.PI * 1.2, color: '#ef4444' }, // Extreme Fear
    { start: Math.PI * 1.2, end: Math.PI * 1.4, color: '#f97316' }, // Fear
    { start: Math.PI * 1.4, end: Math.PI * 1.6, color: '#eab308' }, // Neutral
    { start: Math.PI * 1.6, end: Math.PI * 1.8, color: '#84cc16' }, // Greed
    { start: Math.PI * 1.8, end: Math.PI * 2,   color: '#22c55e' }, // Extreme Greed
  ];

  // Background track
  ctx.beginPath();
  ctx.arc(cx, cy, r, Math.PI, 2 * Math.PI);
  ctx.lineWidth = 22;
  ctx.strokeStyle = 'rgba(255,255,255,0.06)';
  ctx.stroke();

  // Zone arcs
  zones.forEach(z => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, z.start, z.end);
    ctx.lineWidth = 22;
    ctx.strokeStyle = z.color;
    ctx.shadowColor = z.color;
    ctx.shadowBlur  = 8;
    ctx.stroke();
    ctx.shadowBlur  = 0;
  });

  // Needle
  const angle = Math.PI + (val / 100) * Math.PI;
  const nx    = cx + (r - 10) * Math.cos(angle);
  const ny    = cy + (r - 10) * Math.sin(angle);

  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(nx, ny);
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.lineCap     = 'round';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur  = 12;
  ctx.stroke();
  ctx.shadowBlur  = 0;

  // Center dot
  ctx.beginPath();
  ctx.arc(cx, cy, 8, 0, 2 * Math.PI);
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = '#ffffff';
  ctx.shadowBlur  = 12;
  ctx.fill();
  ctx.shadowBlur  = 0;

  // Zone labels
  const labelData = [
    { angle: Math.PI * 1.1,  label: 'Ext. Fear' },
    { angle: Math.PI * 1.3,  label: 'Fear' },
    { angle: Math.PI * 1.5,  label: 'Neutral' },
    { angle: Math.PI * 1.7,  label: 'Greed' },
    { angle: Math.PI * 1.9,  label: 'Ext. Greed' },
  ];
  ctx.font = '9px Outfit, sans-serif';
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.textAlign = 'center';
  labelData.forEach(ld => {
    const lr  = r + 18;
    const lx  = cx + lr * Math.cos(ld.angle);
    const ly  = cy + lr * Math.sin(ld.angle);
    ctx.fillText(ld.label, lx, ly);
  });
}

// ─── Upgrade Modal ────────────────────────────────────────────
function openUpgradeModal() {
  document.getElementById('upgrade-modal').classList.remove('hidden');
}
function closeUpgradeModal() {
  document.getElementById('upgrade-modal').classList.add('hidden');
}
function handleModalOverlayClick(e) {
  if (e.target === document.getElementById('upgrade-modal')) closeUpgradeModal();
}
function stripeCheckout() {
  alert('Stripe payment coming soon!\n\nTo set up real payments, integrate your Stripe payment link here.');
  closeUpgradeModal();
}

// ─── Avatar Dropdown ──────────────────────────────────────────
function toggleDropdown() {
  const dd = document.getElementById('avatar-dropdown');
  dd.classList.toggle('open');
}
document.addEventListener('click', function(e) {
  const wrap = document.getElementById('avatar-wrap');
  const dd   = document.getElementById('avatar-dropdown');
  if (dd && wrap && !wrap.contains(e.target)) {
    dd.classList.remove('open');
  }
}, true);

// ─── INIT ─────────────────────────────────────────────────────
(function init() {
  // Check if there's a returning session hint in URL or leave on auth screen
  // Auth screen is shown by default (main-app is hidden)
  renderMoodMeter();
})();


// ═══════════════════════════════════════════════════════════════
// ZAIN AI CHATBOT
// ═══════════════════════════════════════════════════════════════

function toggleZainChat() {
  const box = document.getElementById('zain-chatbox');
  box.classList.toggle('hidden');
}

function sendZainMsg() {
  const input = document.getElementById('zain-input');
  const text  = input.value.trim();
  if (!text) return;
  input.value = '';

  const container = document.getElementById('zain-messages');

  // Add user message
  container.innerHTML += `<div class="zain-msg user">
    <span class="zain-msg-avatar">👤</span>
    <div class="zain-msg-bubble">${escapeHtml(text)}</div>
  </div>`;

  // Generate AI response
  const response = zainThink(text.toLowerCase());

  // Add bot response with slight delay for realism
  setTimeout(() => {
    container.innerHTML += `<div class="zain-msg bot">
      <span class="zain-msg-avatar">🤖</span>
      <div class="zain-msg-bubble">${response}</div>
    </div>`;
    container.scrollTop = container.scrollHeight;
  }, 600);

  container.scrollTop = container.scrollHeight;
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function zainThink(q) {
  // RSI questions
  if (q.includes('rsi')) {
    if (q.includes('what') || q.includes('explain') || q.includes('mean'))
      return `<strong>RSI (Relative Strength Index)</strong> measures how fast a price is moving on a scale of 0–100.<br><br>• <strong>Below 30</strong> = Oversold → The stock has been selling off hard and may bounce back. Possible buy zone.<br>• <strong>Above 70</strong> = Overbought → The stock has risen fast and may pull back. Possible sell zone.<br>• <strong>Around 50</strong> = Neutral, no strong signal.<br><br>RSI works best when combined with other indicators like SMA crossovers.`;
    if (q.includes('buy') || q.includes('oversold'))
      return `When RSI drops <strong>below 30</strong>, it means the stock is oversold — it may have been pushed down too far and could bounce. This is a potential buying opportunity, but always confirm with other signals (like SMA direction) before buying.`;
    if (q.includes('sell') || q.includes('overbought'))
      return `When RSI goes <strong>above 70</strong>, the stock is overbought — it's risen too fast and may pull back. This can be a signal to sell or tighten your stop-loss. But remember: strong stocks can stay overbought for a while in uptrends.`;
  }

  // SMA / Moving average questions
  if (q.includes('sma') || q.includes('moving average') || q.includes('golden cross') || q.includes('death cross')) {
    if (q.includes('golden'))
      return `A <strong>Golden Cross</strong> happens when the short-term SMA (like SMA 10) crosses ABOVE the long-term SMA (like SMA 30). This signals bullish momentum — the stock is gaining strength. It's considered a BUY signal, but works best when RSI also confirms (not already overbought).`;
    if (q.includes('death'))
      return `A <strong>Death Cross</strong> happens when the short-term SMA crosses BELOW the long-term SMA. This signals bearish momentum — the stock is losing strength. It's a SELL signal. If you're holding, consider selling or setting a tight stop-loss.`;
    return `<strong>SMA (Simple Moving Average)</strong> smooths out price noise by averaging the last N days.<br><br>• <strong>SMA 10</strong> = short-term trend (fast)<br>• <strong>SMA 30</strong> = medium-term trend (slow)<br><br>When SMA 10 crosses above SMA 30 = <strong>Golden Cross (bullish)</strong><br>When SMA 10 crosses below SMA 30 = <strong>Death Cross (bearish)</strong><br><br>These crossovers are one of the most reliable trend signals.`;
  }

  // Buy/when to buy
  if ((q.includes('when') && q.includes('buy')) || q.includes('good time to buy') || q.includes('should i buy')) {
    return `Good times to buy:<br><br>• RSI is below 30 (oversold)<br>• A Golden Cross just formed (SMA10 crossed above SMA30)<br>• The stock is above its SMA30 and trending up<br>• Multiple signals confirm each other<br><br>Avoid buying when RSI is above 70 or when the price is below both SMAs and falling. Patience beats FOMO — wait for strong setups.`;
  }

  // Sell/when to sell
  if ((q.includes('when') && q.includes('sell')) || q.includes('should i sell') || q.includes('take profit')) {
    return `Good times to sell:<br><br>• RSI is above 70 (overbought)<br>• A Death Cross forms<br>• Your take-profit target is hit (e.g. +5-10%)<br>• Your stop-loss triggers (e.g. -3-5%)<br>• The stock drops below SMA30<br><br>Never be greedy. It's better to take a smaller profit than watch it disappear. Set your targets before you enter a trade.`;
  }

  // Stocks
  if (q.includes('stock') && (q.includes('what') || q.includes('explain'))) {
    return `A <strong>stock</strong> is a tiny piece of ownership in a company. When you buy Apple stock, you literally own a fraction of Apple.<br><br>• If the company does well → stock price goes up → you can sell for profit<br>• If it does poorly → price drops → you lose money if you sell<br><br>You make money by <strong>buying low and selling high</strong>. The key is timing your entries and exits using signals like RSI and SMA.`;
  }

  // Oil
  if (q.includes('oil') || q.includes('uso') || q.includes('xle') || q.includes('exxon') || q.includes('chevron') || q.includes('oxy')) {
    return `<strong>Oil</strong> is a great trading opportunity because:<br><br>• It's heavily affected by global events (wars, OPEC decisions, demand)<br>• Very volatile → big price swings = more profit opportunities<br>• Tends to move opposite to tech stocks<br><br>Key oil tickers:<br>• <strong>USO</strong> — directly tracks oil price<br>• <strong>XLE</strong> — energy sector ETF<br>• <strong>XOM</strong> — Exxon Mobil<br>• <strong>CVX</strong> — Chevron<br>• <strong>OXY</strong> — Occidental Petroleum<br><br>Oil is a PRO feature on MarketNest. Use the same RSI and SMA signals — they work great on oil.`;
  }

  // Gold
  if (q.includes('gold') || q.includes('gld')) {
    return `<strong>Gold</strong> is a safe haven asset — it tends to go UP when the stock market goes DOWN.<br><br>Investors buy gold during:<br>• Economic uncertainty<br>• High inflation<br>• Market crashes<br><br>Key tickers: <strong>GLD</strong> (ETF tracking gold price), <strong>IAU</strong>, <strong>GOLD</strong> (Barrick mining).<br><br>Gold moves slower than stocks but is very reliable as a store of value over time.`;
  }

  // Crypto
  if (q.includes('crypto') || q.includes('bitcoin') || q.includes('btc') || q.includes('ethereum') || q.includes('eth')) {
    return `<strong>Crypto</strong> is extremely volatile — prices can swing 10-20% in a single day.<br><br>• <strong>Bitcoin (BTC)</strong> — digital gold, most established<br>• <strong>Ethereum (ETH)</strong> — smart contracts platform<br>• <strong>Solana (SOL)</strong> — fast transactions<br><br>Crypto trades <strong>24/7</strong> (no market hours) and RSI signals fire more often because of the volatility.<br><br>⚠️ Never invest more than you can afford to lose. Crypto is high risk, high reward.`;
  }

  // Stop loss
  if (q.includes('stop loss') || q.includes('stop-loss') || q.includes('stoploss')) {
    return `A <strong>stop-loss</strong> is a preset price where you automatically sell to limit your losses.<br><br>Example: You buy at $100, set stop-loss at $95 (-5%). If the price drops to $95, it sells automatically so you don't lose more.<br><br>Rules:<br>• Always set a stop-loss BEFORE entering a trade<br>• Common levels: 3%, 5%, or 7% below your buy price<br>• Never remove a stop-loss because of hope — discipline saves money`;
  }

  // Risk management
  if (q.includes('risk') || q.includes('how much') || q.includes('diversif')) {
    return `<strong>Risk management</strong> is the #1 thing that separates winners from losers in trading:<br><br>• Never risk more than <strong>2-5%</strong> of your total cash on one trade<br>• Always use a <strong>stop-loss</strong><br>• <strong>Diversify</strong> — spread across stocks, gold, oil, crypto<br>• Never invest money you can't afford to lose<br>• Don't chase losses with bigger bets<br><br>The goal isn't to win every trade — it's to make sure your winners are bigger than your losers.`;
  }

  // What is MarketNest
  if (q.includes('marketnest') || q.includes('this app') || q.includes('this site')) {
    return `<strong>MarketNest</strong> is a paper trading platform where you practice buying and selling stocks, gold, oil, and crypto with <strong>$10,000 in fake money</strong>.<br><br>Use it to learn timing, signals, and strategy without risking real cash. Once you're profitable here, you can apply those skills to real trading apps like Robinhood or Coinbase.`;
  }

  // Beginner / how to start
  if (q.includes('beginner') || q.includes('start') || q.includes('new to') || q.includes('learn')) {
    return `Welcome! Here's how to get started:<br><br>1. <strong>Learn the basics</strong> — check the Learn section on this site<br>2. <strong>Understand RSI and SMA</strong> — these are your main signals<br>3. <strong>Start with stocks</strong> — less volatile, easier to learn<br>4. <strong>Paper trade first</strong> — practice with fake money until profitable<br>5. <strong>Never skip risk management</strong> — use stop-losses always<br><br>Ask me anything specific and I'll explain it in detail!`;
  }

  // P&L / profit and loss
  if (q.includes('p&l') || q.includes('profit') || q.includes('loss') || q.includes('p and l')) {
    return `<strong>P&L (Profit and Loss)</strong> shows how much money you've made or lost.<br><br>• <strong>+$50</strong> means you gained $50 on that position<br>• <strong>-$20</strong> means you lost $20<br><br>Calculate it: (Current Price - Buy Price) × Number of Shares<br><br>In MarketNest, check your Portfolio section to see P&L on each position and your overall performance.`;
  }

  // ETF
  if (q.includes('etf')) {
    return `An <strong>ETF (Exchange-Traded Fund)</strong> is a basket of stocks bundled into one ticker.<br><br>Examples:<br>• <strong>SPY</strong> = top 500 US companies<br>• <strong>GLD</strong> = gold price<br>• <strong>XLE</strong> = energy/oil companies<br>• <strong>USO</strong> = oil price<br><br>ETFs are great for beginners because they give you diversification in one trade — less risk than buying a single stock.`;
  }

  // Default / catch-all
  return `Good question! Here's what I can help you with:<br><br>• <strong>"What is RSI?"</strong> — Learn about signals<br>• <strong>"When should I buy?"</strong> — Entry timing<br>• <strong>"When should I sell?"</strong> — Exit strategies<br>• <strong>"What is a stop-loss?"</strong> — Risk management<br>• <strong>"Tell me about oil"</strong> — Oil trading<br>• <strong>"Tell me about crypto"</strong> — Crypto basics<br>• <strong>"What is an ETF?"</strong> — Fund investing<br>• <strong>"I'm a beginner"</strong> — Getting started guide<br><br>Ask me anything about stocks, trading, or market terms!`;
}
