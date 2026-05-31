# kubera-glance

A [Scriptable](https://scriptable.app) home-screen widget for your [Kubera](https://www.kubera.com) portfolio — net worth, investable assets, and year-to-date CAGR at a glance.

The widget shows your **investable assets** as a large number and your **net worth** below it, each with a YTD CAGR badge (green when up, red when down).

<!-- Add a screenshot of the widget on your home screen here — it does a lot of work for a visual project like this.
![Kubera Glance widget](docs/screenshot.png) -->

## Requirements

- The **Scriptable** app ([App Store](https://apps.apple.com/app/scriptable/id1405459188)) on iOS, iPadOS, or macOS.
- A **Kubera** account with **V3 Data API** access (Settings → Connect → API / Personal Token).

## Setup

1. Install Scriptable.
2. Create a new script in Scriptable and paste in the contents of [`widget.js`](widget.js).
3. Fill in the three values in the `CONFIG` section near the top:
   ```js
   const apiKey      = "<YOUR_API_KEY>";
   const secret      = "<YOUR_API_SECRET>";
   const portfolioId = "<YOUR_PORTFOLIO_ID>";
   ```
4. Run the script once inside the app and check the console output to confirm it fetches your data.
5. Long-press your home screen → add a **Scriptable** widget → choose this script.

## Customization

- **Colors** — the green/red/grey badge colors are set in the `pctColor` helper.
- **Fonts / sizes** — adjust the `Font.boldRoundedSystemFont(...)` sizes in the widget layout section.

## How it works

The widget makes an authenticated `GET` request to the Kubera V3 Data API. Requests are signed with HMAC-SHA256 over `apiKey + timestamp + method + path` (the body is empty for GET). Because Scriptable runs on JavaScriptCore — which has no `crypto.subtle` — SHA-256 and HMAC are implemented in pure JavaScript within the script.

## License

[MIT](LICENSE)
