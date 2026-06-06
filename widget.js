// =============================================================================
//  Kubera Net Worth Widget for Scriptable (iOS / iPadOS / macOS)
// =============================================================================
//
//  A home-screen widget that displays your Kubera portfolio's net worth and
//  investable assets, each with a year-to-date CAGR badge (green = up, red = down).
//  Amounts are shown with M / B / T suffixes (e.g. 1.25M, 3.4B).
//
//  Powered by the Kubera V3 Data API:
//    https://www.kubera.com  (Settings -> Connect -> API / Personal Token)
//
//  ---------------------------------------------------------------------------
//  SETUP
//  ---------------------------------------------------------------------------
//  1. Install the "Scriptable" app from the App Store.
//  2. Create a new script and paste this file in.
//  3. Fill in the three credentials in the CONFIG section below.
//  4. Run once inside the app to confirm it works (check the console output).
//  5. Add a Scriptable widget to your home screen and point it at this script.
//
//  ---------------------------------------------------------------------------
//  /!\  SECURITY -- READ BEFORE PUSHING TO GITHUB
//  ---------------------------------------------------------------------------
//  NEVER commit your real API key, secret, or portfolio ID to a public repo.
//  Leave the placeholders below untouched in the version you commit.
//
//  For a more secure local setup, store credentials in Scriptable's Keychain
//  instead of inlining them, e.g.:
//      const apiKey = Keychain.get("kubera_api_key");
//  (Set them once with Keychain.set("kubera_api_key", "...") from a separate,
//  uncommitted script.)
// =============================================================================


// ===== CONFIG: Kubera V3 Data API credentials ===============================
// Replace these placeholders with your own values (see SECURITY note above).
const apiKey      = "<YOUR_API_KEY>";
const secret      = "<YOUR_API_SECRET>";
const portfolioId = "<YOUR_PORTFOLIO_ID>";

const host = "https://api.kubera.com";

// ===== TEST MODE ============================================================
// Set TEST_DATA to preview the widget with made-up numbers WITHOUT calling the
// API (handy for checking layout across the small / medium / large sizes, big
// values, negative CAGR, etc.). Leave it `null` to use your real portfolio.
//
// const TEST_DATA = { netWorth: 1_234_567_890, investable: 81_750_000,
//                       ytd_networth: 6.8, ytd_investable: -13.0 };
const TEST_DATA = null;

// IMPORTANT: the path used to build the signature must NOT include the host
// or any query string -- only the path itself.
const requestPath = "/api/v3/data/portfolio/" + portfolioId;
const endpoint = host + requestPath;


// =============================================================================
// HMAC-SHA256 (pure JavaScript)
// ---------------------------------------------------------------------------
// Scriptable runs on JavaScriptCore, which has no `crypto.subtle`, so we
// implement SHA-256 and HMAC from scratch. You shouldn't need to touch this.
// =============================================================================

// Core SHA-256 hash. Takes a byte array, returns a 32-byte Uint8Array digest.
function _sha256(msgBytes) {
 // Round constants (first 32 bits of the fractional parts of the cube roots
 // of the first 64 primes).
 const K = [
 0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,
 0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,
 0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,
 0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,
 0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,
 0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,
 0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,
 0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];

 // Initial hash values (fractional parts of the square roots of the first 8 primes).
 let h0=0x6a09e667, h1=0xbb67ae85, h2=0x3c6ef372, h3=0xa54ff53a,
 h4=0x510e527f, h5=0x9b05688c, h6=0x1f83d9ab, h7=0x5be0cd19;

 // --- Pre-processing: pad the message to a multiple of 64 bytes ---
 const l = msgBytes.length, bitLen = l * 8, withOne = l + 1;
 const total = withOne + ((56 - (withOne % 64) + 64) % 64) + 8;
 const m = new Uint8Array(total);
 m.set(msgBytes, 0);
 m[l] = 0x80; // append a single '1' bit followed by zeros

 // Append the original length as a 64-bit big-endian integer.
 const hi = Math.floor(bitLen / 0x100000000), lo = bitLen >>> 0;
 m[total-8] = (hi>>>24)&0xff; m[total-7] = (hi>>>16)&0xff; m[total-6] = (hi>>>8)&0xff; m[total-5] = hi&0xff;
 m[total-4] = (lo>>>24)&0xff; m[total-3] = (lo>>>16)&0xff; m[total-2] = (lo>>>8)&0xff; m[total-1] = lo&0xff;

 // --- Main compression loop, one 64-byte block at a time ---
 const w = new Array(64);
 const rotr = (x, n) => (x >>> n) | (x << (32 - n));
 for (let off = 0; off < total; off += 64) {
 // Build the 64-entry message schedule.
 for (let i = 0; i < 16; i++) {
 w[i] = (m[off+i*4]<<24) | (m[off+i*4+1]<<16) | (m[off+i*4+2]<<8) | (m[off+i*4+3]);
 }
 for (let i = 16; i < 64; i++) {
 const s0 = rotr(w[i-15],7) ^ rotr(w[i-15],18) ^ (w[i-15]>>>3);
 const s1 = rotr(w[i-2],17) ^ rotr(w[i-2],19) ^ (w[i-2]>>>10);
 w[i] = (w[i-16] + s0 + w[i-7] + s1) | 0;
 }

 // Working variables, initialised to the current hash value.
 let a=h0, b=h1, c=h2, d=h3, e=h4, f=h5, g=h6, h=h7;
 for (let i = 0; i < 64; i++) {
 const S1 = rotr(e,6) ^ rotr(e,11) ^ rotr(e,25);
 const ch = (e & f) ^ ((~e) & g);
 const t1 = (h + S1 + ch + K[i] + w[i]) | 0;
 const S0 = rotr(a,2) ^ rotr(a,13) ^ rotr(a,22);
 const maj = (a & b) ^ (a & c) ^ (b & c);
 const t2 = (S0 + maj) | 0;
 h=g; g=f; f=e; e=(d+t1)|0; d=c; c=b; b=a; a=(t1+t2)|0;
 }

 // Add the compressed chunk to the running hash value.
 h0=(h0+a)|0; h1=(h1+b)|0; h2=(h2+c)|0; h3=(h3+d)|0;
 h4=(h4+e)|0; h5=(h5+f)|0; h6=(h6+g)|0; h7=(h7+h)|0;
 }

 // Serialise the eight 32-bit words into a 32-byte big-endian digest.
 const out = new Uint8Array(32), hs = [h0,h1,h2,h3,h4,h5,h6,h7];
 for (let i = 0; i < 8; i++) {
 out[i*4] = (hs[i]>>>24)&0xff;
 out[i*4+1] = (hs[i]>>>16)&0xff;
 out[i*4+2] = (hs[i]>>>8)&0xff;
 out[i*4+3] = hs[i]&0xff;
 }
 return out;
}

// Encode a JS string to UTF-8 bytes (handles surrogate pairs / emoji).
function _utf8(s) {
 const out = [];
 for (let i = 0; i < s.length; i++) {
 let c = s.charCodeAt(i);
 if (c < 0x80) {
 out.push(c);
 } else if (c < 0x800) {
 out.push(0xc0 | (c>>6), 0x80 | (c&0x3f));
 } else if (c >= 0xd800 && c < 0xdc00) {
 // High surrogate: combine with the following low surrogate.
 const c2 = s.charCodeAt(++i);
 const cp = 0x10000 + ((c-0xd800)<<10) + (c2-0xdc00);
 out.push(0xf0 | (cp>>18), 0x80 | ((cp>>12)&0x3f), 0x80 | ((cp>>6)&0x3f), 0x80 | (cp&0x3f));
 } else {
 out.push(0xe0 | (c>>12), 0x80 | ((c>>6)&0x3f), 0x80 | (c&0x3f));
 }
 }
 return new Uint8Array(out);
}

// HMAC-SHA256 over (keyStr, msgStr), returned as a lowercase hex string.
function hmacSha256Hex(keyStr, msgStr) {
 const block = 64; // SHA-256 block size in bytes
 let key = _utf8(keyStr);
 if (key.length > block) key = _sha256(key); // keys longer than a block are hashed first

 // Build the inner (ipad) and outer (opad) padded keys.
 const kpad = new Uint8Array(block); kpad.set(key, 0);
 const ipad = new Uint8Array(block), opad = new Uint8Array(block);
 for (let i = 0; i < block; i++) { ipad[i] = kpad[i]^0x36; opad[i] = kpad[i]^0x5c; }

 // inner = H(ipad || msg)
 const msg = _utf8(msgStr);
 const inner = new Uint8Array(block + msg.length);
 inner.set(ipad, 0); inner.set(msg, block);
 const ih = _sha256(inner);

 // result = H(opad || inner)
 const outer = new Uint8Array(block + 32);
 outer.set(opad, 0); outer.set(ih, block);
 const oh = _sha256(outer);

 let hex = '';
 for (let i = 0; i < oh.length; i++) hex += oh[i].toString(16).padStart(2, '0');
 return hex;
}


// =============================================================================
// API REQUEST
// =============================================================================

// Perform the authenticated GET request against the V3 Data API and return
// the parsed JSON response.
async function loadPortfolio() {
 const method = "GET";
 const timestamp = String(Math.floor(Date.now() / 1000)); // seconds, NOT milliseconds

 // Signature payload = apiKey + timestamp + method + path + body.
 // The body is empty for GET requests.
 const signature = hmacSha256Hex(secret, `${apiKey}${timestamp}${method}${requestPath}`);

 const req = new Request(endpoint);
 req.method = method;
 req.headers = {
 "x-api-token": apiKey,
 "x-timestamp": timestamp,
 "x-signature": signature,
 "Content-Type": "application/json"
 };
 const data = await req.loadJSON();
 console.log(data);
 return data;
}


// =============================================================================
// FORMATTING HELPERS
// =============================================================================

// Format a money amount with M / B / T suffixes and up to 2 decimals.
// Trailing zeros are trimmed: 2.00M -> "2M", 2.50M -> "2.5M", 2.53M -> "2.53M".
// Values under 1M are shown in full with thousands separators (e.g. "523,456").
function fmtMoney(n) {
 if (n === undefined || n === null || isNaN(n)) return "\u2014";
 const sign = n < 0 ? "-" : "";
 const abs = Math.abs(n);

 let value, suffix;
 if (abs >= 1e12) { value = abs / 1e12; suffix = "T"; }
 else if (abs >= 1e9) { value = abs / 1e9; suffix = "B"; }
 else if (abs >= 1e6) { value = abs / 1e6; suffix = "M"; }
 else { value = abs; suffix = ""; }

 // Up to 2 decimals with trailing zeros removed, plus grouping on the integer part.
 const parts = value.toFixed(2).replace(/\.?0+$/, "").split(".");
 parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
 return `${sign}${parts.join(".")}${suffix}`;
}

// Format a percentage value into a signed badge string, e.g. "+5.9%" / "-10.8%".
function fmtPct(v) {
 if (v === undefined || v === null || isNaN(v)) return "\u2014";
 const sign = v > 0 ? "+" : (v < 0 ? "-" : "");
 return `${sign}${Math.abs(v).toFixed(1)}%`;
}

// Pick a colour for a percentage badge: green if positive, red if negative,
// grey if zero / missing.
function pctColor(v) {
 if (v === undefined || v === null || isNaN(v)) return new Color("#c7c7cc");
 if (v > 0) return new Color("#30d158"); // green
 if (v < 0) return new Color("#ff453a"); // red
 return new Color("#c7c7cc");
}


// =============================================================================
// MAIN
// =============================================================================

// In test mode, skip the network call and use the made-up numbers above.
const d = TEST_DATA
  ? { netWorth: TEST_DATA.netWorth,
      investable: TEST_DATA.investable,
      cagr: { ytd_networth: TEST_DATA.ytd_networth,
              ytd_investable: TEST_DATA.ytd_investable } }
  : (await loadPortfolio()).data; // the V3 Data API wraps the payload under `data`

// netWorth / investable are absolute numbers (in the portfolio's base currency).
const netWorth = Math.floor(d.netWorth);
const investable = Math.floor(d.investable ?? 0); // V3 field is `investable` (with an 'a')

// `cagr` is an object of percentages (each value can be negative).
const cagr = d.cagr ?? {};
const ytdNetworth = cagr.ytd_networth; // e.g. 5.87 or -10.75
const ytdInvestable = cagr.ytd_investable; // e.g. 9.39 or -0.44

// Display values use M / B / T suffixes (see fmtMoney above).
const displayTotal = fmtMoney(netWorth);
const displayInvestableTotal = fmtMoney(investable);

console.log(`netWorth/investable: ${netWorth}/${investable}`);
console.log(`display: ${displayTotal} / ${displayInvestableTotal}`,
 `ytd: ${ytdNetworth} / ${ytdInvestable}`);


// =============================================================================
// BRAND LOGO
// =============================================================================
// The Kubera mark (white "K" on a dark disc), rendered from icon.svg and
// embedded as a base64 PNG so the widget stays a single self-contained file
// with no external image dependency. On the dark widget background it reads as
// a crisp white "K". Displayed small (see `L.logo` below).
const LOGO_B64 = "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";

function kuberaLogo() {
  return Image.fromData(Data.fromBase64String(LOGO_B64));
}


// =============================================================================
// TIME-OF-DAY BACKGROUND
// =============================================================================
// Pick a background gradient based on the local clock. Each palette fades to a
// near-black bottom so the white text and coloured badges stay readable, while
// the top colour shifts clearly by period: indigo night, amber morning, teal
// day, purple evening. Edit the hour cut-offs or the colour pairs to taste.
function timeOfDayGradient() {
  const hour = new Date().getHours();

  let top, bottom;
  if (hour < 5 || hour >= 21) { top = "#1e3a8a"; bottom = "#070b1a"; }      // night   — deep indigo
  else if (hour < 11)         { top = "#b5531b"; bottom = "#1c1008"; }      // morning — sunrise amber
  else if (hour < 17)         { top = "#2f6f8f"; bottom = "#101b22"; }      // day     — sky teal
  else                        { top = "#6d2a7a"; bottom = "#180a1f"; }      // evening — dusk purple

  const g = new LinearGradient();
  g.colors = [new Color(top), new Color(bottom)];
  g.locations = [0, 1];
  g.startPoint = new Point(0, 0); // top
  g.endPoint = new Point(0, 1);   // bottom
  return g;
}


// =============================================================================
// WIDGET LAYOUT
// =============================================================================

// Adapt sizing to the widget family so everything stays readable and nothing
// gets clipped on the small size. `config.widgetFamily` is undefined when the
// script is run inside the app -- we preview it as medium in that case.
const family = config.widgetFamily;
const isSmall = family === "small";

const L = isSmall
  ? { logo: 18, title: 12, num: 22, pct: 11, padding: 14, gapHeader: 10, gapRow: 6, badgeGap: 5 }
  : { logo: 26, title: 17, num: 28, pct: 14, padding: 18, gapHeader: 16, gapRow: 10, badgeGap: 6 };

const w = new ListWidget();
w.backgroundColor = new Color("#1c1c1e");      // fallback if gradients are unavailable
w.backgroundGradient = timeOfDayGradient();    // dark gradient that shifts with the time of day
w.setPadding(L.padding, L.padding, L.padding, L.padding);

// Header: logo mark + wordmark.
const header = w.addStack();
header.centerAlignContent();
const logo = header.addImage(kuberaLogo());
logo.imageSize = new Size(L.logo, L.logo);
header.addSpacer(8);
const title = header.addText("KUBERA");
title.font = Font.boldRoundedSystemFont(L.title);
title.textColor = Color.white();
title.lineLimit = 1;
title.minimumScaleFactor = 0.7;

w.addSpacer(L.gapHeader);

// One metric row: big number + a coloured YTD CAGR badge.
// `lineLimit` + `minimumScaleFactor` let the number shrink to fit instead of
// truncating ("31.0..."), and the trailing spacer keeps everything left-aligned
// so the number has room to scale down on the small widget.
function addMetric(amount, pct) {
  const row = w.addStack();
  row.bottomAlignContent();

  const num = row.addText(amount);
  num.font = Font.boldRoundedSystemFont(L.num);
  num.textColor = Color.white();
  num.lineLimit = 1;
  num.minimumScaleFactor = 0.5;

  row.addSpacer(L.badgeGap);

  const badge = row.addText(fmtPct(pct));
  badge.font = Font.boldRoundedSystemFont(L.pct);
  badge.textColor = pctColor(pct);
  badge.lineLimit = 1;
  badge.minimumScaleFactor = 0.7;

  row.addSpacer();
}

addMetric(displayTotal, ytdNetworth);
w.addSpacer(L.gapRow);
addMetric(displayInvestableTotal, ytdInvestable);

// Render the widget. When run inside the app, also show a live preview at the
// matching size so you can see exactly how it will look on the home screen.
Script.setWidget(w);
if (config.runsInApp) {
  if (isSmall) await w.presentSmall();
  else if (family === "large") await w.presentLarge();
  else await w.presentMedium();
}
Script.complete();