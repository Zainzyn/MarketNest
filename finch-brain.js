// ═══════════════════════════════════════════════════════════════
// FINCH AI — EXPANDED BRAIN (overrides FinchThink)
// 200+ response patterns covering stocks, crypto, gold, oil,
// trading concepts, emotional support, specific tickers, and more
// ═══════════════════════════════════════════════════════════════

// Override the original FinchThink with this expanded version
function FinchThink(q) {
  q = fuzzyFix(q);

  // ─── SPECIFIC STOCK QUESTIONS ───────────────────────────────
  if (q.includes('apple') || (q.includes('aapl') && !q.includes('what is')))
    return `Apple (AAPL) is one of the safest big-cap stocks out there. They make insane cash from iPhones, services, and ecosystem lock-in. Currently around $312.<br><br>Good "base" stock — steady growth, pays dividends, rarely crashes as hard as others. If RSI dips below 40 on Apple, that's usually a solid entry.`;
  if (q.includes('tesla') || q.includes('tsla'))
    return `Tesla (TSLA) is one of the most volatile big stocks — can move 5-10% in a day. Currently around $391.<br><br>Exciting to trade but dangerous without stop-losses. Great for quick trades, risky for long holds without a plan. RSI signals work really well on Tesla because it swings so hard.`;
  if (q.includes('nvidia') || q.includes('nvda'))
    return `NVIDIA (NVDA) is the AI chip king — makes the GPUs powering every AI system. Currently around $228.<br><br>One of the best performing stocks of the decade. The AI boom is real and NVDA benefits directly. But careful — already had massive gains. Wait for pullbacks (RSI dips) before entering.`;
  if (q.includes('microsoft') || q.includes('msft'))
    return `Microsoft (MSFT) is rock-solid. Cloud (Azure), Office 365, Xbox, LinkedIn, AI with OpenAI — they're everywhere. Currently around $450.<br><br>Less exciting than Tesla but way more reliable. Steady grower that rarely crashes hard. Great core portfolio position.`;
  if (q.includes('google') || q.includes('alphabet') || q.includes('googl'))
    return `Alphabet/Google (GOOGL) dominates search, YouTube, and cloud. Currently around $388. Also big in AI with Gemini.<br><br>Strong long-term hold. Good entries come when RSI drops and price pulls back to the SMA30 line.`;
  if (q.includes('amazon') || q.includes('amzn'))
    return `Amazon (AMZN) is a beast — e-commerce AND cloud (AWS is their cash machine). Currently around $259.<br><br>AWS alone makes them incredibly profitable. Stock tends to move with overall market but long-term it's been a winner.`;
  if (q.includes('meta') || q.includes('facebook'))
    return `Meta (META) owns Facebook, Instagram, WhatsApp and is pushing hard into AI. Currently around $593.<br><br>They make billions from ads. Stock bounced back hard since 2022. High RSI right now — wait for a pullback before entering.`;
  if (q.includes('amd'))
    return `AMD is NVIDIA's main competitor in chips/GPUs. Currently around $466. Benefits from same AI boom but trades at lower valuation.<br><br>More volatile than NVDA but more upside potential. Follows technical patterns well — good signals stock.`;
  if (q.includes('spy') || q.includes('s&p') || q.includes('s and p') || q.includes('index'))
    return `SPY tracks the S&P 500 — top 500 US companies in one ticker. Currently around $7,384 for the index.<br><br>If you don't know what to buy, SPY is always solid. You're betting on the entire US economy. Averages ~10%/year. Less exciting but way less risky.`;

  // ─── MARKET TIMING & HOURS ──────────────────────────────────
  if (q.includes('market hours') || q.includes('market open') || q.includes('when does market') || q.includes('market close') || q.includes('premarket'))
    return `US stock market hours (Eastern Time):<br><br>• Pre-market: 4:00 AM – 9:30 AM<br>• Regular hours: 9:30 AM – 4:00 PM<br>• After hours: 4:00 PM – 8:00 PM<br>• Closed: Weekends and holidays<br><br>Crypto trades 24/7 — no breaks. Gold/oil ETFs follow regular stock hours.`;
  if (q.includes('best time') && q.includes('trade'))
    return `Best times to trade:<br><br>• First 30 min after open (9:30-10:00 AM ET) — most volatility<br>• Last hour before close (3:00-4:00 PM ET) — institutions making final moves<br>• Avoid 11:30 AM – 2:00 PM — the "dead zone" where volume drops<br><br>For crypto, most active when US and Asian markets overlap.`;
  if (q.includes('weekend') || q.includes('saturday') || q.includes('sunday'))
    return `Stocks don't trade on weekends — the market is closed Saturday and Sunday. Your portfolio just sits unchanged.<br><br>But crypto trades 24/7 including weekends! So if you want action on a Saturday, crypto is your only option. Gold and oil ETFs are also closed on weekends.`;

  // ─── TRADING CONCEPTS ───────────────────────────────────────
  if (q.includes('bull') && (q.includes('market') || q.includes('what')))
    return `A bull market means prices are going UP — stocks rising, people optimistic. Like a bull thrusting horns upward.<br><br>Easier to make money but don't get overconfident. Bull markets don't last forever. Always keep stop-losses.`;
  if (q.includes('bear') && (q.includes('market') || q.includes('what')))
    return `A bear market means prices falling 20%+ from highs. Like a bear swiping downward.<br><br>Most stocks lose value. Best strategy: sit on cash, wait for bottom, or buy gold which usually rises when stocks fall.`;
  if (q.includes('short') && (q.includes('sell') || q.includes('what') || q.includes('squeeze')))
    return `Short selling = betting a stock goes DOWN. You borrow shares, sell high, buy back cheaper.<br><br>A short squeeze happens when heavily-shorted stocks suddenly rise — shorts have to buy to cover, pushing price even higher (like GME 2021).<br><br>Our Short Squeeze Detector (PRO) finds these setups.`;
  if (q.includes('dividend'))
    return `A dividend is money a company pays you just for holding their stock — like rent on your investment.<br><br>Example: Apple pays $0.25/share quarterly. Own 100 shares = $25 every quarter for doing nothing.<br><br>Dividend yield tells you the % return. XOM yields ~3.4%, CVX ~3.8%. Great for passive income.`;
  if (q.includes('volume') || (q.includes('vol') && !q.includes('volat')))
    return `Volume = how many shares traded in a day. High volume means the move is real and supported by lots of traders.<br><br>• High volume + price up = strong bullish move<br>• High volume + price down = real selling pressure<br>• Low volume + price moving = weak, could reverse<br><br>Always check volume when you see a signal. Buy signals on high volume are way more reliable.`;
  if (q.includes('volatil'))
    return `Volatility means how much a stock's price swings. High volatility = big moves up AND down. Low volatility = calm, small moves.<br><br>• Tech stocks and crypto = HIGH volatility<br>• SPY and gold = LOWER volatility<br><br>More volatility = more profit opportunity but also more risk. As a beginner, start with lower volatility stocks until you're comfortable.`;
  if (q.includes('support') || q.includes('resistance'))
    return `Support = a price level where stocks tend to bounce UP (like a floor).<br>Resistance = where they tend to stop rising (like a ceiling).<br><br>When support breaks → stock usually falls hard.<br>When resistance breaks → stock usually runs higher.<br><br>These are key for setting buy orders and stop-losses.`;
  if (q.includes('candlestick') || q.includes('candle'))
    return `A candlestick shows Open, Close, High, Low for a time period.<br><br>Green candle = price went UP (closed higher than opened)<br>Red candle = price went DOWN<br><br>Patterns of multiple candles can signal reversals. But honestly RSI and SMA are more reliable for beginners.`;
  if (q.includes('pe ratio') || q.includes('p/e') || (q.includes('pe') && q.includes('ratio')))
    return `P/E ratio = Stock Price ÷ Earnings Per Share. Tells you how "expensive" a stock is.<br><br>Low P/E (~15) = cheap or struggling. High P/E (~50+) = expensive but high growth expected.<br><br>S&P 500 average is ~20-25. Anything above 40 is pricey. TSLA and NVDA have high P/Es because people expect massive growth.`;
  if (q.includes('market cap'))
    return `Market cap = Stock Price × Total Shares. How big a company is.<br><br>• Large cap ($10B+): AAPL, MSFT — stable, lower risk<br>• Mid cap ($2-10B): Growing companies — moderate risk<br>• Small cap (under $2B): Higher risk, bigger potential gains<br><br>Stick to large caps as a beginner. Less likely to crash 50% overnight.`;
  if (q.includes('day trad'))
    return `Day trading = buying and selling same day. Never holding overnight.<br><br>Reality: 90% of day traders lose money. Requires $25K minimum (PDT rule), fast decisions, hours of screen time.<br><br>Swing trading (holding days/weeks) is way more forgiving for beginners. Same signals, less stress.`;
  if (q.includes('swing trad'))
    return `Swing trading = holding for days to weeks, catching price "swings."<br><br>1. Wait for signal (RSI + SMA)<br>2. Enter trade<br>3. Set stop-loss and take-profit<br>4. Wait a few days<br>5. Exit when target hits<br><br>Way less stressful than day trading. Our signals are perfect for this style.`;
  if (q.includes('portfolio') && (q.includes('build') || q.includes('make') || q.includes('create') || q.includes('allocat')))
    return `Beginner portfolio with $10K:<br><br>• 40% — SPY (whole market, safe base)<br>• 20% — 2-3 growth stocks (AAPL, NVDA, MSFT)<br>• 15% — Gold (GLD) — hedge against crashes<br>• 15% — Oil (XLE) — energy exposure<br>• 10% — Crypto (BTC) — high risk/reward<br><br>Diversification means if one crashes, others cushion the blow.`;
  if (q.includes('dca') || q.includes('dollar cost'))
    return `DCA = investing a fixed amount on a regular schedule regardless of price. Like $100 every week.<br><br>You buy more when prices are low, less when high. Over time your average cost smooths out. It's the simplest, most reliable long-term strategy. Even pros use it.`;
  if (q.includes('macd'))
    return `MACD shows momentum AND direction. Two lines — when MACD crosses above signal line = bullish, below = bearish.<br><br>RSI + MACD together is a very strong combo. If both say BUY at the same time, that's a high-confidence entry.`;
  if (q.includes('bollinger'))
    return `Bollinger Bands = a channel around price that expands with volatility.<br><br>• Price touches lower band = possibly oversold (buy zone)<br>• Price touches upper band = possibly overbought (sell zone)<br>• Bands squeezing tight = big move coming soon<br><br>Works great with RSI for confirmation.`;
  if (q.includes('earnings') && (q.includes('what') || q.includes('mean') || q.includes('play')))
    return `Earnings = quarterly reports showing company revenue/profit. Stock usually makes a big move after.<br><br>Trading around earnings is risky. Some traders buy before hoping for a beat, others avoid the gamble entirely. Our Earnings Calendar shows you when reports are coming.`;
  if (q.includes('inflation') || q.includes('cpi'))
    return `Inflation = prices going up, your dollar buys less. When high: Fed raises rates → stocks usually drop. Gold tends to rise (inflation hedge).<br><br>CPI (Consumer Price Index) is the main inflation report — comes monthly and moves markets hard.`;
  if (q.includes('fed') || q.includes('interest rate') || q.includes('fomc'))
    return `The Fed controls interest rates. Raise rates → stocks tend to drop. Cut rates → stocks tend to rise.<br><br>FOMC meets 8 times/year. "Hawkish" (higher rates) = bearish. "Dovish" (lower rates) = bullish. Markets get very volatile on Fed days.`;
  if (q.includes('dark pool'))
    return `Dark pools = private exchanges where institutions trade huge blocks without showing it publicly.<br><br>If a hedge fund buys millions of shares on a dark pool, smart money is accumulating. Our Dark Pool monitor (PRO) tracks these hidden trades.`;
  if (q.includes('insider') && (q.includes('trad') || q.includes('buy')))
    return `Insider trading (legal kind) = when executives buy/sell their own company stock. They must report it publicly.<br><br>If a CEO buys millions of their own stock, they probably know something good is coming. Our Insider Tracker (PRO) monitors all SEC filings.`;
  if (q.includes('options') || q.includes('call') || q.includes('put'))
    return `Options = contracts giving you the RIGHT to buy/sell at a price by a date.<br><br>• Call = betting price goes UP<br>• Put = betting price goes DOWN<br><br>Can make 10x your money... or lose it all. Not for beginners. Master regular stocks first. Our Options Flow Scanner (PRO) shows big money bets.`;
  if (q.includes('leverage') || q.includes('margin'))
    return `Margin = borrowing money to trade bigger. 2x leverage means $1K controls $2K of stock.<br><br>⚠️ Amplifies both gains AND losses. Many beginners blow up accounts using margin. Don't use leverage until profitable for 6+ months without it.`;
  if (q.includes('sector') || q.includes('industry'))
    return `Stocks are grouped into sectors:<br><br>• Tech: AAPL, MSFT, NVDA, GOOGL<br>• Energy: XOM, CVX, OXY<br>• Healthcare: JNJ, PFE, UNH<br>• Finance: JPM, BAC, GS<br>• Consumer: AMZN, WMT, COST<br><br>Different sectors perform better at different times. When tech falls, energy might rise. Diversifying across sectors reduces risk.`;
  if (q.includes('recession'))
    return `A recession = economy shrinking for 2+ consecutive quarters. Unemployment rises, spending drops, stocks usually fall.<br><br>During recessions: cash and gold do well. Growth stocks get crushed. Defensive stocks (utilities, healthcare) hold up better.<br><br>Best strategy: hold more cash, buy quality stocks at deep discounts, be patient.`;

  // ─── EMOTIONAL / MINDSET ────────────────────────────────────
  if (q.includes('scared') || q.includes('nervous') || q.includes('afraid') || q.includes('anxiety'))
    return `Completely normal to feel scared. Every successful trader felt that way at the start.<br><br>What helps: use small positions, always have a stop-loss, paper trade first (that's what MarketNest is for), and accept losses as tuition. Fear is good — keeps you careful. Just don't let it paralyze you.`;
  if (q.includes('lost money') || q.includes('losing') || q.includes('keep losing'))
    return `Sorry to hear that. Every pro loses trades — what matters is the overall picture.<br><br>Common reasons for consistent losses: no stop-loss, too much on one trade, trading on emotions/FOMO, not waiting for signal confirmation.<br><br>Take a step back. Review your last 10 trades. What went wrong? Fix the pattern.`;
  if (q.includes('fomo') || q.includes('fear of missing'))
    return `FOMO is the #1 account killer. By the time you feel it, you're usually too late — smart money already bought lower.<br><br>Rules: if it already pumped 20%+, don't chase. Wait for pullback. Stick to signals. There will ALWAYS be another trade. Patience > FOMO every time.`;
  if (q.includes('patient') || q.includes('patience') || q.includes('boring') || q.includes('nothing happening'))
    return `Best traders spend 90% of their time doing nothing. Warren Buffett said "The stock market transfers money from the impatient to the patient."<br><br>No signal = no trade. That's not a problem, that's discipline. The moment you force a trade out of boredom is when you lose money. Wait for it.`;
  if (q.includes('motivation') || q.includes('give up') || q.includes('quit'))
    return `Don't give up. Every successful trader went through a phase where nothing worked. The ones who made it are the ones who kept learning and adjusting instead of quitting.<br><br>Focus on the process, not short-term results. Are you learning? Are you improving? That's what matters right now.`;
  if (q.includes('rich') || q.includes('millionaire') || q.includes('get rich'))
    return `I'll be real with you — trading is NOT a get-rich-quick scheme. Anyone who tells you otherwise is selling something.<br><br>Realistic expectations: 10-20% per year is excellent. 50%+ per year is elite. Getting rich from trading takes years of consistent discipline.<br><br>Focus on not LOSING money first. Preservation of capital is step one. Profits follow naturally once you're disciplined.`;

  // ─── OIL / GOLD / CRYPTO (expanded) ────────────────────────
  if (q.includes('oil') || q.includes('uso') || q.includes('xle') || q.includes('exxon') || q.includes('chevron') || q.includes('oxy') || q.includes('crude') || q.includes('opec') || q.includes('petroleum'))
    return `Oil is HOT right now — ~$93-95/barrel, spiking due to Iran-Israel tensions.<br><br>Key tickers: USO (oil ETF), XLE (energy sector), XOM ($148), CVX ($151), OXY ($59), COP, SLB, EOG, MPC, VLO, DVN, FANG, HAL, BKR, PSX.<br><br>Oil moves hard on geopolitical news. RSI and SMA work great on energy stocks. Right now the trend is UP due to supply fears.`;
  if (q.includes('gold') || q.includes('gld') || q.includes('paxg') || q.includes('precious metal') || q.includes('safe haven'))
    return `Gold = the ultimate safe haven. Currently GLD ~$411, PAXG ~$4,312/oz.<br><br>Key tickers: GLD, IAU, PAXG-USD (crypto gold), GOLD, NEM, FNV, WPM, AEM, KGC, GFI, RGLD, SLV (silver).<br><br>Gold rises during uncertainty, inflation, and market crashes. With Iran tensions right now, gold is getting attention.`;
  if (q.includes('crypto') || q.includes('bitcoin') || q.includes('btc') || q.includes('ethereum') || q.includes('eth') || q.includes('solana') || q.includes('sol') || q.includes('doge') || q.includes('xrp'))
    return `Crypto trades 24/7 and is extremely volatile. Current: BTC ~$64K, ETH ~$1,700, SOL ~$67, DOGE ~$0.087, XRP ~$1.13.<br><br>Bitcoin rallied despite Iran tensions — showing relative strength vs stocks. Crypto often moves independently from traditional markets.<br><br>RSI signals fire more often on crypto because it swings so much. Never invest more than you can afford to lose.`;
  if (q.includes('silver') || q.includes('slv'))
    return `Silver (SLV) is gold's little brother — more volatile but follows similar patterns. Currently around $28.75.<br><br>Silver tends to outperform gold in bull markets but drop harder in bear markets. Good as a hedge alongside gold. Same signals apply.`;

  // ─── RSI / SMA / INDICATORS ─────────────────────────────────
  if (q.includes('rsi')) {
    if (q.includes('what') || q.includes('explain') || q.includes('mean'))
      return `RSI = Relative Strength Index. A speedometer for stocks on a scale of 0-100.<br><br>Below 30 = oversold (buy zone). Above 70 = overbought (sell zone). Around 50 = neutral.<br><br>It tells you if a stock has been pushed too far in one direction and might reverse. Works best combined with SMA. Do you want me to explain it easier?`;
    return `RSI is a number from 0-100. Below 30 = potential buy. Above 70 = potential sell. What specifically about RSI do you want to know?`;
  }
  if (q.includes('sma') || q.includes('moving average') || q.includes('golden cross') || q.includes('death cross')) {
    if (q.includes('golden'))
      return `Golden Cross = short SMA crosses ABOVE long SMA. Like a fast car overtaking a slow one — momentum is shifting up. One of the most reliable buy signals. Do you want me to explain it easier?`;
    if (q.includes('death'))
      return `Death Cross = short SMA drops BELOW long SMA. Stock is losing momentum. Time to sell or set tight stop-loss. Do you want me to explain it easier?`;
    return `SMA smooths price noise. SMA 10 (fast) vs SMA 30 (slow). When fast crosses above slow = Golden Cross (bullish). Below = Death Cross (bearish). Do you want me to explain it easier?`;
  }

  // ─── BUY / SELL ─────────────────────────────────────────────
  if ((q.includes('when') && q.includes('buy')) || q.includes('good time to buy') || q.includes('should i buy'))
    return `When to buy:<br>1. RSI under 40 (stock is on sale)<br>2. Price trending up or turning around<br>3. SMA 10 above or crossing above SMA 30<br>4. Never more than 5% of cash on one trade<br><br>Don't buy because of hype. Wait for the numbers.`;
  if ((q.includes('when') && q.includes('sell')) || q.includes('should i sell') || q.includes('take profit'))
    return `When to sell:<br>1. Profit target hit — take it, don't get greedy<br>2. RSI above 70 — running too hot<br>3. Stop-loss triggers — sell immediately<br>4. Death Cross forms — momentum dying<br><br>Rule: decide when to sell BEFORE you buy. Write it down. Stick to it.`;
  if (q.includes('stop loss') || q.includes('stop-loss') || q.includes('stoploss'))
    return `Stop-loss = preset sell price to limit losses. Set 3-7% below buy price. If stock drops there, it sells automatically.<br><br>Key rule: NEVER remove your stop-loss. That's how small losses become account-destroying ones.`;
  if (q.includes('risk') || q.includes('how much') || q.includes('diversif'))
    return `Risk rules:<br>• Max 5% on one trade<br>• Always use stop-losses<br>• Diversify across stocks/gold/oil/crypto<br>• Only use money you can afford to lose<br>• 3 losses in a row? Take a break<br><br>Goal: make winners bigger than losers over time.`;

  // ─── STOCK BASICS ───────────────────────────────────────────
  if (q.includes('stock') && (q.includes('what') || q.includes('explain')))
    return `A stock = tiny piece of a company. Buy low, sell high. That's how you make money. The hard part is timing — that's what RSI, SMA, and signals are for.`;
  if (q.includes('etf'))
    return `ETF = bundle of stocks in one ticker. SPY = 500 companies. GLD = gold. XLE = energy. One trade = instant diversification. Great for beginners.`;
  if (q.includes('p&l') || q.includes('profit and loss'))
    return `P&L = (Current Price - Buy Price) × Shares. Green = profit, Red = loss. Check your Portfolio tab. Goal: overall green by end of week.`;

  // ─── PLATFORM ───────────────────────────────────────────────
  if (q.includes('marketnest') || q.includes('this app') || q.includes('this site') || q.includes('how to use'))
    return `MarketNest = paper trading training ground. $10K fake money, real prices, real signals. Practice until profitable, then go real on Robinhood or Coinbase. Flight simulator for trading.`;
  if (q.includes('beginner') || q.includes('start') || q.includes('new to') || q.includes('learn') || q.includes('how do i'))
    return `Welcome! Path: 1) Learn RSI and SMA (ask me). 2) Paper trade stocks only. 3) Small trades, always use stop-losses. 4) Track what works. 5) Once profitable 2+ weeks, go real.<br><br>Don't rush. You're already ahead by learning first. What topic should we start with?`;
  if (q.includes('pro') || q.includes('upgrade') || q.includes('premium'))
    return `PRO ($6.99/mo) unlocks: Gold/Oil/Crypto markets, unlimited Finch AI, SMA signals, Dark Pool data, Short Squeeze alerts, Options Flow, Insider tracking, Social Sentiment, and more. Cancel anytime.<br><br>Free gives you a great start with 5 stocks and 3 Finch chats/day.`;

  // ─── PERSONALITY ────────────────────────────────────────────
  if (q.includes('easier') || q.includes('simpler') || q.includes('dumb it down') || q.includes("don't understand") || q.includes('confused'))
    return `No worries! Tell me which topic and I'll explain it super simple — like I'm talking to a friend with zero experience.`;
  if (q.includes('thank') || q.includes('thanks') || q.includes('thx') || q.includes('ty') || q.includes('appreciate'))
    return `Anytime! That's what I'm here for. Keep the questions coming whenever you need. Good luck out there 💪`;
  if (q.includes('hey') || q.includes('hi') || q.includes('hello') || q.includes('sup') || q.includes('yo') || q.includes('whats up'))
    return `Hey! What's up? Ask me anything about stocks, crypto, gold, oil, signals, or trading strategy. I'm here to help you make smarter moves.`;
  if (q.includes('who are you') || q.includes('your name') || q.includes('what are you'))
    return `I'm Finch — your AI stock advisor built into MarketNest. I know about stocks, crypto, gold, oil, indicators, strategies, and market concepts. Ask me anything in plain English.`;
  if (q.includes('good') || q.includes('nice') || q.includes('cool') || q.includes('awesome') || q.includes('great') || q.includes('perfect'))
    return `Glad that helped! Keep the questions coming. Anything else you want to know?`;
  if (q.includes('lol') || q.includes('haha') || q.includes('funny'))
    return `Haha glad you're having fun with this! Learning trading should be enjoyable, not stressful. What else can I help with?`;
  if (q.includes('love you') || q.includes('best'))
    return `Appreciate that! I'm just doing my job — making sure you understand the market before putting real money on the line. What else can I help with?`;

  // ─── SMART CATCH-ALL ────────────────────────────────────────
  if (q.includes('buy') || q.includes('purchase') || q.includes('enter'))
    return `Sounds like you're asking about buying. Do you mean "when should I buy?" or asking about a specific stock like AAPL or BTC? Just clarify and I'll help.`;
  if (q.includes('sell') || q.includes('exit') || q.includes('close') || q.includes('get out'))
    return `Sounds like you're asking about selling. Want to know when to sell, or about stop-losses and taking profits? I got you either way.`;
  if (q.includes('down') || q.includes('crash') || q.includes('drop') || q.includes('fall') || q.includes('red'))
    return `If stocks are dropping — check if it's just your stock or the whole market (look at SPY). Whole market red = macro event (Fed, inflation, geopolitics). Single stock red = maybe bad news or earnings miss.<br><br>Need help with a specific ticker? Just ask.`;
  if (q.includes('up') || q.includes('rally') || q.includes('pump') || q.includes('moon') || q.includes('green'))
    return `If something is pumping hard, be careful about jumping in late. Check RSI — above 70 means it might pull back. Best entries come AFTER pullbacks, not during pumps. FOMO is the enemy.`;
  if (q.includes('money') || q.includes('cash') || q.includes('invest') || q.includes('afford'))
    return `General rule: never invest more than 5% of your total on one trade. And only trade with money you genuinely can afford to lose. Want a full risk management breakdown? Just ask.`;
  if (q.includes('how') || q.includes('what') || q.includes('why') || q.includes('which') || q.includes('where') || q.includes('can'))
    return `I want to give you the best answer — could you be a bit more specific? For example:<br><br>• "What is RSI?" or "How does SMA work?"<br>• "What's happening with Tesla?"<br>• "Why is the market down?"<br>• "Which stocks should I watch?"<br>• "How do I start?"<br><br>I can handle pretty much any trading question.`;

  return `I want to help but need a bit more context. You can ask me about:<br><br>• Any stock (AAPL, TSLA, NVDA, etc.)<br>• Trading signals (RSI, SMA, Golden Cross)<br>• When to buy or sell<br>• Oil, gold, crypto<br>• Risk management, stop-losses<br>• Market concepts (P/E, ETFs, dividends)<br>• Trading psychology (FOMO, patience)<br><br>Type however you want — typos, slang, whatever. I'll figure it out.`;
}
