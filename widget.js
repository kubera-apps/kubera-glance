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
 return await req.loadJSON();
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

const json = await loadPortfolio();

// The V3 Data API wraps the payload under `data`.
const d = json.data;

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
// WIDGET LAYOUT
// =============================================================================

const w = new ListWidget();
w.backgroundColor = Color.gray();

// Title
const title = w.addText("KUBERA");
title.font = Font.boldRoundedSystemFont(20);
title.textColor = Color.white();
w.addSpacer(20);

// Net worth: number + its YTD CAGR badge.
const nwRow = w.addStack();
nwRow.bottomAlignContent();
const nwNum = nwRow.addText(displayTotal);
nwNum.font = Font.boldRoundedSystemFont(24);
nwNum.textColor = Color.white();
nwRow.addSpacer(6);
const nwPct = nwRow.addText(fmtPct(ytdNetworth));
nwPct.font = Font.boldRoundedSystemFont(13);
nwPct.textColor = pctColor(ytdNetworth);

w.addSpacer(10);

// Investable assets: number + its YTD CAGR badge.
const investRow = w.addStack();
investRow.bottomAlignContent();
const invNum = investRow.addText(displayInvestableTotal);
invNum.font = Font.boldRoundedSystemFont(22);
invNum.textColor = Color.white();
investRow.addSpacer(6);
const invPct = investRow.addText(fmtPct(ytdInvestable));
invPct.font = Font.boldRoundedSystemFont(16);
invPct.textColor = pctColor(ytdInvestable);

// Render the widget (works both on the home screen and when run in-app).
Script.setWidget(w);
Script.complete();