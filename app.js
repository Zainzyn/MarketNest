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
    { sym: 'PAXG-USD', name: 'PAX Gold (Crypto)' },
    { sym: 'FNV',  name: 'Franco-Nevada Corp.' },
    { sym: 'WPM',  name: 'Wheaton Precious Metals' },
    { sym: 'AEM',  name: 'Agnico Eagle Mines' },
    { sym: 'KGC',  name: 'Kinross Gold Corp.' },
    { sym: 'GFI',  name: 'Gold Fields Ltd.' },
    { sym: 'RGLD', name: 'Royal Gold Inc.' },
    { sym: 'SLV',  name: 'iShares Silver Trust' },
  ],
  oil: [
    { sym: 'USO',  name: 'United States Oil Fund' },
    { sym: 'XLE',  name: 'Energy Select Sector ETF' },
    { sym: 'OXY',  name: 'Occidental Petroleum' },
    { sym: 'XOM',  name: 'Exxon Mobil Corp.' },
    { sym: 'CVX',  name: 'Chevron Corp.' },
    { sym: 'COP',  name: 'ConocoPhillips' },
    { sym: 'SLB',  name: 'Schlumberger Ltd.' },
    { sym: 'EOG',  name: 'EOG Resources' },
    { sym: 'MPC',  name: 'Marathon Petroleum' },
    { sym: 'VLO',  name: 'Valero Energy' },
    { sym: 'PSX',  name: 'Phillips 66' },
    { sym: 'HAL',  name: 'Halliburton Company' },
    { sym: 'DVN',  name: 'Devon Energy' },
    { sym: 'FANG', name: 'Diamondback Energy' },
    { sym: 'BKR',  name: 'Baker Hughes' },
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
    // Use Yahoo Finance v8 chart API with a reliable proxy
    const url = `https://query2.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(ticker)}?interval=1d&range=3mo`;
    const proxy = `https://corsproxy.io/?url=${encodeURIComponent(url)}`;
    const res = await fetch(proxy, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) throw new Error('fetch failed');
    const data = await res.json();
    if (!data || !data.chart || !data.chart.result) throw new Error('no data');
    const result  = data.chart.result[0];
    const closes  = result.indicators.quote[0].close.filter(v => v !== null && v !== undefined);
    if (closes.length < 2) throw new Error('not enough data');
    const price   = closes[closes.length - 1];
    const prev    = closes[closes.length - 2] || price;
    const change  = ((price - prev) / prev * 100).toFixed(2);
    const cached  = { price, change, history: closes, ts: Date.now() };
    priceCache[ticker] = cached;
    return cached;
  } catch (e) {
    // Fallback: use hardcoded recent prices so the site always shows something
    return getFallbackPrice(ticker);
  }
}

// ─── Fallback Prices (always shows data even if API fails) ────
function getFallbackPrice(ticker) {
  const fallback = {
    'AAPL':    { price: 312.06, change: '-0.14' },
    'MSFT':    { price: 450.24, change: '+4.19' },
    'GOOGL':   { price: 387.66, change: '+0.06' },
    'TSLA':    { price: 391.00, change: '+6.43' },
    'NVDA':    { price: 228.00, change: '+1.32' },
    'GLD':     { price: 411.26, change: '-3.65' },
    'IAU':     { price: 83.70, change: '-2.13' },
    'GOLD':    { price: 39.62, change: '+0.34' },
    'NEM':     { price: 99.71, change: '-0.62' },
    'PAXG-USD':{ price: 4312.20, change: '+0.42' },
    'FNV':     { price: 168.30, change: '+0.85' },
    'WPM':     { price: 72.45, change: '+1.12' },
    'AEM':     { price: 89.20, change: '+0.67' },
    'KGC':     { price: 11.85, change: '+1.34' },
    'GFI':     { price: 19.40, change: '+0.92' },
    'RGLD':    { price: 155.60, change: '+0.55' },
    'SLV':     { price: 28.75, change: '-0.38' },
    'USO':     { price: 71.85, change: '+2.72' },
    'XLE':     { price: 82.40, change: '+1.15' },
    'OXY':     { price: 58.68, change: '+0.02' },
    'XOM':     { price: 148.40, change: '-0.94' },
    'CVX':     { price: 151.15, change: '-0.98' },
    'COP':     { price: 98.45, change: '+2.10' },
    'SLB':     { price: 42.80, change: '+1.55' },
    'EOG':     { price: 118.30, change: '+1.82' },
    'MPC':     { price: 145.20, change: '+2.35' },
    'VLO':     { price: 128.90, change: '+2.15' },
    'PSX':     { price: 122.40, change: '+1.90' },
    'HAL':     { price: 28.60, change: '+1.45' },
    'DVN':     { price: 38.75, change: '+2.25' },
    'FANG':    { price: 155.80, change: '+1.78' },
    'BKR':     { price: 38.20, change: '+1.30' },
    'BTC-USD': { price: 64000.00, change: '+3.69' },
    'ETH-USD': { price: 1701.20, change: '+7.22' },
    'SOL-USD': { price: 66.75, change: '+5.20' },
    'DOGE-USD':{ price: 0.0870, change: '+2.15' },
    'XRP-USD': { price: 1.1259, change: '-0.87' },
    'ADA-USD': { price: 0.1587, change: '-1.23' },
    'AVAX-USD':{ price: 6.54, change: '-2.10' },
    '^GSPC':   { price: 7383.74, change: '-2.25' },
    '^IXIC':   { price: 25709.43, change: '-4.18' },
  };
  const fb = fallback[ticker];
  if (!fb) return null;
  // Generate a fake history for chart rendering
  const history = [];
  const base = fb.price * 0.9;
  for (let i = 0; i < 60; i++) {
    history.push(base + (fb.price - base) * (i / 60) + (Math.random() - 0.5) * fb.price * 0.02);
  }
  history.push(fb.price);
  return { price: fb.price, change: fb.change, history, ts: Date.now() };
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

  // Fetch prices with staggered delay
  for (let i = 0; i < entries.length; i++) {
    const { sym } = entries[i];
    (async (symbol, index) => {
      await new Promise(r => setTimeout(r, index * 300)); // 300ms between each
      const id   = symbol.replace(/[^a-zA-Z0-9]/g, '-');
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
    })(sym, i);
  }
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
// Finch AI CHATBOT
// ═══════════════════════════════════════════════════════════════

function toggleFinchChat() {
  const box = document.getElementById('finch-chatbox');
  box.classList.toggle('hidden');
}

const Finch_FREE_LIMIT = 3; // Free users get 3 messages per day

function getFinchUsage() {
  const key = `mn_Finch_usage_${currentUser ? currentUser.name : 'guest'}`;
  try {
    const data = JSON.parse(localStorage.getItem(key) || '{}');
    const today = new Date().toDateString();
    if (data.date !== today) return { date: today, count: 0 };
    return data;
  } catch(e) { return { date: new Date().toDateString(), count: 0 }; }
}

function saveFinchUsage(usage) {
  const key = `mn_Finch_usage_${currentUser ? currentUser.name : 'guest'}`;
  localStorage.setItem(key, JSON.stringify(usage));
}

function sendFinchMsg() {
  const input = document.getElementById('finch-input');
  const text  = input.value.trim();
  if (!text) return;

  // Check daily limit for free users
  if (!isPro()) {
    const usage = getFinchUsage();
    if (usage.count >= Finch_FREE_LIMIT) {
      const container = document.getElementById('finch-messages');
      container.innerHTML += `<div class="finch-msg bot">
        <span class="finch-msg-avatar">🤖</span>
        <div class="finch-msg-bubble">Hey! You've used your <strong>3 free messages</strong> for today. Upgrade to <strong>PRO</strong> for unlimited Finch AI access — just $6.99/mo, cancel anytime.<br><br><a href="#pricing" onclick="toggleFinchChat()" style="color:var(--gold);font-weight:700;text-decoration:none;">Upgrade to PRO →</a></div>
      </div>`;
      container.scrollTop = container.scrollHeight;
      input.value = '';
      return;
    }
    usage.count++;
    saveFinchUsage(usage);
    // Show remaining messages
    const remaining = Finch_FREE_LIMIT - usage.count;
    setTimeout(() => {
      const container = document.getElementById('finch-messages');
      if (remaining > 0) {
        container.innerHTML += `<div class="finch-msg bot" style="opacity:0.6">
          <span class="finch-msg-avatar">💬</span>
          <div class="finch-msg-bubble" style="font-size:12px;padding:8px 12px;">${remaining} free message${remaining===1?'':'s'} remaining today. <a href="#pricing" onclick="toggleFinchChat()" style="color:var(--gold);text-decoration:none;">Upgrade for unlimited →</a></div>
        </div>`;
      }
      container.scrollTop = container.scrollHeight;
    }, 3000);
  }

  input.value = '';

  const container = document.getElementById('finch-messages');

  // Add user message
  container.innerHTML += `<div class="finch-msg user">
    <span class="finch-msg-avatar">👤</span>
    <div class="finch-msg-bubble">${escapeHtml(text)}</div>
  </div>`;
  container.scrollTop = container.scrollHeight;

  // Show typing indicator
  const typingId = 'typing-' + Date.now();
  container.innerHTML += `<div class="finch-msg bot" id="${typingId}">
    <span class="finch-msg-avatar">🤖</span>
    <div class="finch-msg-bubble finch-typing"><span></span><span></span><span></span></div>
  </div>`;
  container.scrollTop = container.scrollHeight;

  // Generate AI response
  const response = FinchThink(text.toLowerCase());

  // Remove typing indicator and show real response with typewriter effect
  const delay = 800 + Math.random() * 600;
  setTimeout(() => {
    const typingEl = document.getElementById(typingId);
    if (typingEl) typingEl.remove();

    const msgDiv = document.createElement('div');
    msgDiv.className = 'finch-msg bot';
    msgDiv.innerHTML = `<span class="finch-msg-avatar">🤖</span><div class="finch-msg-bubble" id="finch-typewriter"></div>`;
    container.appendChild(msgDiv);

    typewriterEffect(response, document.getElementById('finch-typewriter'), container);
  }, delay);
}

function typewriterEffect(html, el, container) {
  // Split into chunks for smooth word-by-word reveal
  const words = html.split(' ');
  let i = 0;
  el.innerHTML = '';
  const interval = setInterval(() => {
    if (i < words.length) {
      el.innerHTML += (i === 0 ? '' : ' ') + words[i];
      container.scrollTop = container.scrollHeight;
      i++;
    } else {
      clearInterval(interval);
      container.scrollTop = container.scrollHeight;
    }
  }, 40);
}

function escapeHtml(t) {
  return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function fuzzyFix(q) {
  // Common misspellings and shorthand → correct terms
  const fixes = {
    // RSI
    'ris': 'rsi', 'rsi indicator': 'rsi', 'relative strength': 'rsi',
    'rsi index': 'rsi', 'r.s.i': 'rsi', 'rsl': 'rsi', 'rai': 'rsi',
    // SMA
    'sma10': 'sma', 'sma30': 'sma', 'sma 10': 'sma', 'sma 30': 'sma',
    'moving avg': 'moving average', 'movng average': 'moving average',
    'moving avarage': 'moving average', 'ma': 'moving average',
    // Golden/Death cross
    'golden cros': 'golden cross', 'gold cross': 'golden cross',
    'goldan cross': 'golden cross', 'goden cross': 'golden cross',
    'death cros': 'death cross', 'deth cross': 'death cross',
    // Buy/Sell
    'wen to buy': 'when buy', 'when to by': 'when buy',
    'wen should i buy': 'when buy', 'shoud i buy': 'should i buy',
    'shoudl i buy': 'should i buy', 'when do i buy': 'when buy',
    'wen to sell': 'when sell', 'when to sel': 'when sell',
    'shoud i sell': 'should i sell', 'shoudl i sell': 'should i sell',
    // Stocks
    'stok': 'stock', 'stonk': 'stock', 'stonks': 'stock',
    'stocks': 'stock', 'wat is a stock': 'stock what',
    'whats a stock': 'stock what', 'what is stock': 'stock what',
    // Crypto
    'crypo': 'crypto', 'crytpo': 'crypto', 'cyrpto': 'crypto',
    'crypro': 'crypto', 'bitcon': 'bitcoin', 'bitcoins': 'bitcoin',
    'etherium': 'ethereum', 'etherum': 'ethereum', 'eth': 'ethereum',
    'btc': 'bitcoin',
    // Gold
    'gol': 'gold', 'glod': 'gold',
    // Oil
    'oild': 'oil', 'oill': 'oil', 'crude': 'oil', 'petroleum': 'oil',
    // Stop loss
    'stop los': 'stop loss', 'stoploss': 'stop loss', 'stop-loss': 'stop loss',
    'stopp loss': 'stop loss', 'stop lss': 'stop loss',
    // Risk
    'rsk management': 'risk', 'risk managment': 'risk',
    'risk managemnt': 'risk', 'diversify': 'risk',
    'diversification': 'risk',
    // ETF
    'etfs': 'etf', 'ef': 'etf', 'eft': 'etf',
    // General typos
    'wat': 'what', 'wut': 'what', 'waht': 'what',
    'wen': 'when', 'whne': 'when',
    'hw': 'how', 'hwo': 'how',
    'shoud': 'should', 'shoudl': 'should',
    'explan': 'explain', 'expain': 'explain', 'explian': 'explain',
    'pls': 'please', 'plz': 'please',
    'dont': "don't", 'doesnt': "doesn't", 'cant': "can't",
    'idk': "i don't know", 'idc': "i don't care",
    'tbh': 'honestly', 'ngl': 'honestly',
    'prfit': 'profit', 'proffit': 'profit', 'proffits': 'profit',
    'los': 'loss', 'losss': 'loss', 'losses': 'loss',
    'mony': 'money', 'monee': 'money', 'muney': 'money',
    'begginer': 'beginner', 'beginer': 'beginner', 'newbie': 'beginner',
    'noob': 'beginner',
    'market nest': 'marketnest',
    'thnks': 'thanks', 'thx': 'thanks', 'ty': 'thanks',
  };

  // Apply fixes
  let fixed = q;
  for (const [typo, correct] of Object.entries(fixes)) {
    if (fixed.includes(typo)) {
      fixed = fixed.replace(typo, correct);
    }
  }

  return fixed;
}

function FinchThink(q) {
  // ─── Fuzzy matching layer — understand typos and mistakes ───────
  q = fuzzyFix(q);

  // RSI questions
  if (q.includes('rsi')) {
    if (q.includes('what') || q.includes('explain') || q.includes('mean'))
      return `Alright so RSI stands for Relative Strength Index. Think of it like a speedometer for a stock — it tells you how fast the price is moving on a scale from 0 to 100.<br><br>If it drops <strong>below 30</strong>, the stock has been beaten down hard and might bounce back — that's a potential buy zone. If it shoots <strong>above 70</strong>, it's been running too hot and might cool off — that's when you think about selling.<br><br>Around 50 is just neutral, nothing exciting happening.<br><br>Do you want me to explain it easier?`;
    if (q.includes('buy') || q.includes('oversold'))
      return `So when RSI drops below 30, it basically means the stock got sold off way too hard — like people panicked. Usually that means it's about to bounce back up. That's your window to buy in at a discount.<br><br>But don't just blindly buy every time RSI is low — make sure other things confirm it too, like the price starting to trend up. Does that make sense?`;
    if (q.includes('sell') || q.includes('overbought'))
      return `When RSI goes above 70, it means the stock has been on a crazy run and might be running out of steam. Think of it like a car redlining — it can't keep going that fast forever.<br><br>That's usually a signal to take your profits or at least set a tight stop-loss so you don't give back your gains. Make sense? Do you want me to explain it easier?`;
  }

  // SMA / Moving average questions
  if (q.includes('sma') || q.includes('moving average') || q.includes('golden cross') || q.includes('death cross')) {
    if (q.includes('golden'))
      return `A Golden Cross is basically the market telling you "hey, momentum is shifting up." It happens when the short-term average (SMA 10) crosses above the long-term average (SMA 30).<br><br>Think of it like a fast car overtaking a slow one — the speed is picking up. It's one of the most reliable buy signals out there. Do you want me to explain it easier?`;
    if (q.includes('death'))
      return `A Death Cross sounds scary and honestly it kinda is. It's the opposite of a Golden Cross — the short-term average drops below the long-term one. Basically the stock is losing momentum and heading down.<br><br>When you see this, it's usually time to sell or at least set a tight stop-loss to protect yourself. Do you want me to explain it easier?`;
    return `Okay so SMA stands for Simple Moving Average. It smooths out all the daily noise and shows you the actual trend.<br><br>Think of it like this — if you look at a stock's price every day it looks like crazy zigzags. But SMA averages the last few days so you can see "is this thing generally going up or down?"<br><br><strong>SMA 10</strong> = average of last 10 days (reacts fast)<br><strong>SMA 30</strong> = average of last 30 days (slower, more reliable)<br><br>When the fast one crosses above the slow one = <strong>Golden Cross = bullish</strong><br>When the fast one drops below = <strong>Death Cross = bearish</strong><br><br>Do you want me to explain it easier?`;
  }

  // Buy/when to buy
  if ((q.includes('when') && q.includes('buy')) || q.includes('good time to buy') || q.includes('should i buy')) {
    return `Great question. Here's what I look for before buying anything:<br><br>1. RSI is low (under 40) — the stock is on sale<br>2. The price is trending up or starting to turn around<br>3. SMA 10 is above SMA 30 or about to cross over it<br>4. I'm not putting more than 5% of my cash into one trade<br><br>The biggest mistake beginners make is buying because something "looks cool" or is trending on social media. Don't do that. Wait for the numbers to tell you it's time.<br><br>Do you want me to explain it easier?`;
  }

  // Sell/when to sell
  if ((q.includes('when') && q.includes('sell')) || q.includes('should i sell') || q.includes('take profit')) {
    return `Knowing when to sell is honestly harder than knowing when to buy. Here's my approach:<br><br>1. Hit your profit target? Sell. Don't get greedy waiting for more.<br>2. RSI above 70? The stock is running too hot — take profits<br>3. Your stop-loss triggers? Sell immediately, no questions asked<br>4. Death Cross forms? Momentum is dying, time to exit<br><br>The number one rule: decide BEFORE you buy when you'll sell. Write it down. Then stick to it no matter what.<br><br>Do you want me to explain it easier?`;
  }

  // Stocks
  if (q.includes('stock') && (q.includes('what') || q.includes('explain'))) {
    return `Okay so a stock is literally a tiny piece of a company. When you buy Apple stock, you own a fraction of Apple — like a slice of a really big pizza.<br><br>If Apple makes money and grows, your slice becomes worth more. If they mess up, it's worth less.<br><br>You make money by buying when the price is low and selling when it's higher. That's literally it. The hard part is knowing WHEN to buy and sell — that's what all the signals and indicators are for.<br><br>Do you want me to explain it easier?`;
  }

  // Oil
  if (q.includes('oil') || q.includes('uso') || q.includes('xle') || q.includes('exxon') || q.includes('chevron') || q.includes('oxy')) {
    return `Oil is one of my favorites honestly. It moves a LOT and is really reactive to world news — wars, OPEC meetings, supply cuts, all of that makes oil swing hard.<br><br>Here are the tickers you wanna watch:<br>• <strong>USO</strong> — tracks the actual oil price directly<br>• <strong>XLE</strong> — basket of all the big energy companies<br>• <strong>XOM</strong> — Exxon Mobil (biggest oil company)<br>• <strong>CVX</strong> — Chevron<br>• <strong>OXY</strong> — Occidental Petroleum<br><br>Same signals work great on oil — RSI, SMA crossovers, all of it. The swings are just bigger so you can make more per trade.<br><br>Do you want me to explain it easier?`;
  }

  // Gold
  if (q.includes('gold') || q.includes('gld')) {
    return `Gold is like the safe room of investing. When everything else is crashing — stocks falling, crypto dumping — gold usually goes UP. It's where scared money hides.<br><br>People buy gold when:<br>• The economy looks shaky<br>• Inflation is high (your dollars are worth less so gold holds value)<br>• There's war or global uncertainty<br><br>It moves slower than stocks but it's extremely reliable over time. The ticker to watch is <strong>GLD</strong> — it tracks the actual gold price.<br><br>Do you want me to explain it easier?`;
  }

  // Crypto
  if (q.includes('crypto') || q.includes('bitcoin') || q.includes('btc') || q.includes('ethereum') || q.includes('eth')) {
    return `Crypto is the wild west of investing. Prices can move 10-20% in a single day — both up AND down. It's high risk, high reward.<br><br>The big ones:<br>• <strong>Bitcoin (BTC)</strong> — the original, like digital gold<br>• <strong>Ethereum (ETH)</strong> — powers most of the crypto ecosystem<br>• <strong>Solana (SOL)</strong> — super fast transactions<br><br>One advantage: crypto trades <strong>24/7</strong> — no market hours, no weekends off. So you can always trade it.<br><br>My honest advice: never put in more than you're okay completely losing. Crypto can make you rich or wreck you. Respect it.<br><br>Do you want me to explain it easier?`;
  }

  // Stop loss
  if (q.includes('stop loss') || q.includes('stop-loss') || q.includes('stoploss')) {
    return `A stop-loss is your safety net. It's a price you set in advance where you say "if it drops to here, sell automatically — no questions asked."<br><br>Example: you buy a stock at $100 and set a stop-loss at $95. If it drops to $95, it sells. You lose $5 instead of potentially $20 or $30 if you held and hoped.<br><br>Most traders use a 3-7% stop-loss. The key rule: <strong>never remove your stop-loss</strong>. I know it's tempting when you "believe" it'll come back — but discipline is what separates people who make money from people who don't.<br><br>Do you want me to explain it easier?`;
  }

  // Risk management
  if (q.includes('risk') || q.includes('how much') || q.includes('diversif')) {
    return `This is honestly the most important thing in trading — more important than knowing when to buy or sell.<br><br>Here's the deal:<br>• Never put more than 5% of your total money into one single trade<br>• Always use a stop-loss — always, no exceptions<br>• Spread your money across different things (stocks, gold, crypto, oil)<br>• Only trade with money you can literally afford to lose<br>• If you lose 3 trades in a row, take a break — don't chase losses<br><br>The goal isn't to win every trade. It's to make your winners bigger than your losers over time. That's it.<br><br>Do you want me to explain it easier?`;
  }

  // What is MarketNest
  if (q.includes('marketnest') || q.includes('this app') || q.includes('this site')) {
    return `MarketNest is basically your training ground. You get $10,000 in fake money and real market prices — practice buying and selling without any real risk.<br><br>The idea is: learn here first, then when you're consistently profitable with fake money, go do it for real on apps like Robinhood or Coinbase.<br><br>Think of it like a flight simulator before flying a real plane. Same skills, zero risk.<br><br>Anything specific you wanna know about how to use it?`;
  }

  // Beginner / how to start
  if (q.includes('beginner') || q.includes('start') || q.includes('new to') || q.includes('learn')) {
    return `Welcome to the game! Here's what I'd do if I was starting fresh:<br><br>1. First just learn what RSI and SMA mean — ask me about either one<br>2. Start by paper trading only stocks (they're less crazy than crypto)<br>3. Make small trades — don't bet it all on one thing<br>4. Always set a stop-loss so you limit how much you can lose<br>5. Track your trades and see what works<br><br>Don't rush. The people who lose money are the ones who jump in without learning first. You're already ahead by being here.<br><br>What do you wanna learn about first?`;
  }

  // P&L / profit and loss
  if (q.includes('p&l') || q.includes('profit') || q.includes('loss') || q.includes('p and l')) {
    return `P&L just means Profit and Loss — it's how much money you made or lost on a trade.<br><br>Simple math: (Price now - Price you bought at) × How many shares you own<br><br>If it's positive (green +) you're making money. If it's negative (red -) you're losing. Check your Portfolio tab here to see your P&L on each position.<br><br>The goal is for your total P&L to be green at the end of the week. Some individual trades will be red — that's normal. Just make sure the green ones are bigger.<br><br>Do you want me to explain it easier?`;
  }

  // ETF
  if (q.includes('etf')) {
    return `An ETF is basically a bundle of stocks wrapped into one thing you can buy.<br><br>Like <strong>SPY</strong> — instead of buying 500 individual companies, you buy ONE share of SPY and you instantly own a tiny piece of all 500. Instant diversification.<br><br>Some popular ones:<br>• <strong>SPY</strong> = top 500 US companies<br>• <strong>GLD</strong> = tracks gold price<br>• <strong>XLE</strong> = energy/oil companies<br>• <strong>USO</strong> = oil price directly<br><br>ETFs are great for beginners because one trade gives you exposure to a whole sector. Less risk than betting on a single stock.<br><br>Do you want me to explain it easier?`;
  }

  // Easier explanation request
  if (q.includes('easier') || q.includes('simpler') || q.includes('dumb it down') || q.includes("don't understand") || q.includes('confused')) {
    return `No worries at all! Tell me which topic you want me to break down simpler — RSI, SMA, when to buy, when to sell, stop-loss, or something else? I'll explain it like I'm talking to a friend with zero trading experience.`;
  }

  // Thanks / greeting
  if (q.includes('thank') || q.includes('thanks') || q.includes('thx')) {
    return `Anytime! That's what I'm here for. If anything else comes up while you're trading, just ask. Good luck out there 💪`;
  }
  if (q.includes('hey') || q.includes('hi') || q.includes('hello') || q.includes('sup') || q.includes('yo')) {
    return `Hey! What's up? Ask me anything about stocks, crypto, gold, oil, signals, or trading strategy. I'm here to help you make smarter moves.`;
  }

  // Default / catch-all — try to guess what they mean
  // Check for partial matches to suggest corrections
  if (q.includes('buy') || q.includes('purchase') || q.includes('get'))
    return `It sounds like you're asking about buying. Do you mean "when should I buy a stock?" or are you asking about a specific ticker? Just let me know and I'll help you out.`;
  if (q.includes('sell') || q.includes('exit') || q.includes('get out'))
    return `Sounds like you're asking about selling. Do you mean "when should I sell?" or do you want to know about stop-losses and taking profits? I got you either way.`;
  if (q.includes('money') || q.includes('cash') || q.includes('invest'))
    return `Are you asking about how much money to invest per trade? Or how to manage your risk? If so, just ask me about "risk management" and I'll break it down for you.`;
  if (q.includes('how') || q.includes('what') || q.includes('why'))
    return `I think I know what you're getting at but I want to make sure I give you the right answer. Could you rephrase that a bit? For example you can ask me:<br><br>• "What is RSI?"<br>• "How do I know when to buy?"<br>• "Why did my stock go down?"<br><br>I'll do my best to help no matter how you ask it.`;

  return `I'm not totally sure what you're asking but no worries — I'm here to help. Try asking me something like:<br><br>• "What is RSI?"<br>• "When should I buy?"<br>• "When should I sell?"<br>• "What is a stop-loss?"<br>• "Tell me about crypto" or "oil" or "gold"<br>• "I'm new to this"<br><br>You can type however you want — I'll figure it out. And if I don't get it, just rephrase and I'll try again. No judgment here.`;
}


// ═══════════════════════════════════════════════════════════════
// PULSE BAR + GREETING + QUICK SCAN
// ═══════════════════════════════════════════════════════════════

async function loadPulseBar() {
  const tickers = [
    { sym: '^GSPC', el: 'pb-sp500' },
    { sym: '^IXIC', el: 'pb-nasdaq' },
    { sym: 'BTC-USD', el: 'pb-btc' },
    { sym: 'GLD', el: 'pb-gold' },
    { sym: 'USO', el: 'pb-oil' },
  ];
  for (const t of tickers) {
    const data = await fetchPrice(t.sym);
    const el = document.getElementById(t.el);
    if (data && el) {
      const up = parseFloat(data.change) >= 0;
      el.textContent = `${up?'▲':'▼'} ${Math.abs(data.change)}%`;
      el.className = `pb-val ${up?'up':'down'}`;
    }
  }
}

function loadGreeting() {
  if (!currentUser) return;
  const hour = new Date().getHours();
  let greet = 'What\'s up';
  if (hour < 12) greet = 'Good morning';
  else if (hour < 17) greet = 'Good afternoon';
  else greet = 'Good evening';

  const el = document.getElementById('gb-hello');
  if (el) el.textContent = `${greet}, ${currentUser.name} 👋`;

  // Market status
  const day = new Date().getDay();
  const subEl = document.getElementById('gb-sub');
  if (day === 0 || day === 6) {
    subEl.textContent = 'Markets are closed this weekend. Crypto is still trading 24/7.';
  } else if (hour < 9 || (hour === 9 && new Date().getMinutes() < 30)) {
    subEl.textContent = 'Pre-market. US stocks open at 9:30 AM ET.';
  } else if (hour >= 16) {
    subEl.textContent = 'After hours. US market is closed. Crypto still active.';
  } else {
    subEl.textContent = 'Markets are OPEN. Good time to trade.';
  }
}

async function runQuickScan() {
  const input = document.getElementById('qs-input');
  const ticker = input.value.trim().toUpperCase();
  if (!ticker) return;

  const result = document.getElementById('qs-result');
  result.classList.add('hidden');

  const data = await fetchPrice(ticker);
  if (!data) {
    alert('Could not fetch data for that ticker. Check the symbol and try again.');
    return;
  }

  const sig = getSignal(data.history);

  document.getElementById('qs-sym').textContent = ticker;
  document.getElementById('qs-price').textContent = `$${data.price.toFixed(2)}`;

  const sigEl = document.getElementById('qs-signal');
  sigEl.textContent = sig.signal;
  sigEl.style.color = sig.signal === 'BUY' ? 'var(--green)' : sig.signal === 'SELL' ? 'var(--red)' : 'var(--gold)';

  const rsiEl = document.getElementById('qs-rsi');
  rsiEl.textContent = sig.rsi ? sig.rsi.toFixed(1) : '—';
  rsiEl.style.color = sig.rsi < 30 ? 'var(--green)' : sig.rsi > 70 ? 'var(--red)' : 'var(--text)';

  document.getElementById('qs-sma10').textContent = sig.sma10 ? `$${sig.sma10.toFixed(2)}` : '—';
  document.getElementById('qs-sma30').textContent = sig.sma30 ? `$${sig.sma30.toFixed(2)}` : '—';
  document.getElementById('qs-reason').textContent = sig.reason;

  result.classList.remove('hidden');
}

// Patch the launchApp to also load new features
const _originalLaunchApp = launchApp;
launchApp = function(user) {
  _originalLaunchApp(user);
  loadGreeting();
  loadPulseBar();
};
