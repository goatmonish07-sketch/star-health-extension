# BMI Calculator — India

A Manifest V3 Chrome side-panel extension that calculates BMI and Ponderal
Index using the **WHO Asian-Pacific** weight categories — the same tables
published at <https://www.starhealth.in/bmi-calculator/>. Runs entirely in the
browser: no APIs, no server, no data collection. Permissions are limited to
`sidePanel` and `storage`.

## Install locally

1. Open `chrome://extensions`
2. Turn on Developer mode
3. Click "Load unpacked" and select this folder
4. Click the extension icon to open the side panel

## What it does

- Metric (cm / kg) or imperial (ft-in / lb) input
- BMI to one decimal, with a colour meter and the Asian-Pacific category
- Healthy weight range for your height (BMI 18.5–22.9)
- Ponderal Index and its category
- For anyone under 20 it shows the BMI value but flags that a BMI-for-age
  percentile applies instead of the adult bands (as the source page notes)
- "Copy this result" → plain text with a link back to the guide, for sharing

## Category tables (from the source page)

**BMI — WHO Asian-Pacific (adults 20+)**

| Category | BMI (kg/m²) |
|---|---|
| Underweight | < 18.5 |
| Normal range | 18.5 – 22.9 |
| Overweight | 23 – 24.9 |
| Obese (Grade I) | 25 – 29.9 |
| Obese (Grade II) | ≥ 30 |

**Ponderal Index (adults) = weight(kg) ÷ height(m)³**

| Category | Range |
|---|---|
| Severe underweight | < 8 |
| Underweight | 8 – 11 |
| Normal | 11 – 15 |
| Overweight | 15 – 17 |
| Obese | ≥ 17 |

## File map

| File | Does what |
|---|---|
| `manifest.json` | MV3 config, side panel registration |
| `background.js` | Opens the panel when the toolbar icon is clicked |
| `bmiData.js` | Category tables, ranges and unit conversions — the whole reference model |
| `sidepanel.html` | Panel markup |
| `sidepanel.css` | Styling (design tokens are the `:root` block) |
| `sidepanel.js` | Calculation, rendering, copy-to-share, state persistence |

All thresholds live in `bmiData.js`; the UI never hard-codes a number. To
change the link target, edit `SITE_URL` at the top of `sidepanel.js` and the
`href` on `#siteLink` in `sidepanel.html`.
