# kubera-glance

A [Scriptable](https://scriptable.app) home-screen widget for your [Kubera](https://www.kubera.com) portfolio — net worth, investable assets, and year-to-date CAGR at a glance.

The widget shows your **net worth** as the top number and your **investable assets** below it, each with a YTD CAGR badge (green when up, red when down). It adapts to the small, medium, and large widget sizes, and its background shifts subtly with the time of day.

<p align="center">
  <img src="https://cdn.kubera.com/r/widget/small.png" alt="Kubera Glance — small widget" height="180">
  &nbsp;&nbsp;
  <img src="https://cdn.kubera.com/r/widget/medium.png" alt="Kubera Glance — medium widget" height="180">
</p>

## Requirements

- The **Scriptable** app ([App Store](https://apps.apple.com/app/scriptable/id1405459188)) on iOS, iPadOS, or macOS.
- A **Kubera** account with **V3 Data API** access (Settings → API).

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
5. Long-press your home screen → add a **Scriptable** widget → choose this script. Pick whichever size you like; the layout adapts automatically.

## Customization

- **Colors** — the green/red/grey badge colors are set in the `pctColor` helper.
- **Background** — `timeOfDayGradient()` returns a dark gradient based on the local hour. Edit the hour cut-offs or color pairs there, or replace the call with a fixed `w.backgroundColor` if you'd rather not have it change.
- **Fonts / sizes** — the `L` preset object in the widget layout section holds the logo, title, number, and badge sizes for each widget family. The small family uses smaller values, and every text shrinks to fit (`minimumScaleFactor`) so nothing gets clipped.

## How it works

The widget makes an authenticated `GET` request to the Kubera V3 Data API. Requests are signed with HMAC-SHA256 over `apiKey + timestamp + method + path` (the body is empty for GET). Because Scriptable runs on JavaScriptCore — which has no `crypto.subtle` — SHA-256 and HMAC are implemented in pure JavaScript within the script.

## License

[MIT](LICENSE)
