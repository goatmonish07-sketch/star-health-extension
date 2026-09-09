const SITE_URL = "https://www.starhealth.in/bmi-calculator/";

const state = {
  units: "metric",
  age: 30,
  // metric
  heightCm: 170,
  weightKg: 70,
  // imperial
  heightFt: 5,
  heightIn: 7,
  weightLb: 154,
};

let lastResult = null;

const el = (id) => document.getElementById(id);

/* ---------- unit helpers ---------- */

// Canonical height in metres and weight in kg, from whichever unit is active.
function canonical() {
  const c = BMI_DATA.convert;
  if (state.units === "metric") {
    return { heightM: state.heightCm / 100, weightKg: state.weightKg };
  }
  const inches = state.heightFt * 12 + state.heightIn;
  return { heightM: inches * c.inToM, weightKg: state.weightLb * c.lbToKg };
}

function round1(n) {
  return Math.round(n * 10) / 10;
}

function weightLabel(kg) {
  if (state.units === "imperial") {
    return round1(kg / BMI_DATA.convert.lbToKg) + " lb";
  }
  return round1(kg) + " kg";
}

/* ---------- category lookup ---------- */

function classify(list, value) {
  return list.find((band) => value < band.max) || list[list.length - 1];
}

/* ---------- engine ---------- */

function calculate() {
  const { heightM, weightKg } = canonical();
  const valid = heightM > 0.3 && weightKg > 0;

  if (!valid) {
    return { valid: false };
  }

  const bmi = weightKg / (heightM * heightM);
  const ponderal = weightKg / (heightM * heightM * heightM);
  const isAdult = state.age >= 20;

  const bmiBand = classify(BMI_DATA.bmiCategories, bmi);
  const pondBand = classify(BMI_DATA.ponderalCategories, ponderal);

  const healthyMinKg = BMI_DATA.healthyBmi.min * heightM * heightM;
  const healthyMaxKg = BMI_DATA.healthyBmi.max * heightM * heightM;

  return {
    valid: true,
    bmi,
    ponderal,
    isAdult,
    bmiBand,
    pondBand,
    healthyMinKg,
    healthyMaxKg,
  };
}

/* ---------- rendering ---------- */

function setMeter(bmi) {
  const { min, max } = BMI_DATA.meter;
  const pct = Math.max(0, Math.min(100, ((bmi - min) / (max - min)) * 100));
  el("marker").style.left = pct + "%";
}

function addRow(dl, label, value, tone) {
  const row = document.createElement("div");
  row.className = "row";
  const dt = document.createElement("dt");
  dt.textContent = label;
  const dd = document.createElement("dd");
  dd.textContent = value;
  if (tone) dd.setAttribute("data-tone", tone);
  row.append(dt, dd);
  dl.appendChild(row);
}

function update() {
  const r = calculate();
  lastResult = r;

  const cat = el("category");
  const dl = el("breakdown");
  dl.innerHTML = "";

  if (!r.valid) {
    el("bmiValue").textContent = "0.0";
    cat.textContent = "Enter your details below";
    cat.removeAttribute("data-tone");
    setMeter(BMI_DATA.meter.min);
    save();
    return;
  }

  el("bmiValue").textContent = round1(r.bmi).toFixed(1);
  setMeter(r.bmi);

  if (r.isAdult) {
    cat.textContent = r.bmiBand.label;
    cat.setAttribute("data-tone", r.bmiBand.tone);
  } else {
    cat.textContent = "Under 20 — see percentile";
    cat.removeAttribute("data-tone");
  }

  addRow(dl, "Your BMI", round1(r.bmi).toFixed(1) + " kg/m²");

  if (r.isAdult) {
    addRow(dl, "Category (Asian-Pacific)", r.bmiBand.label, r.bmiBand.tone);
    addRow(dl, r.bmiBand.note, "", r.bmiBand.tone);
    addRow(
      dl,
      "Healthy weight for your height",
      weightLabel(r.healthyMinKg) + " – " + weightLabel(r.healthyMaxKg),
      "good"
    );
    addRow(dl, "Ponderal index", round1(r.ponderal).toFixed(1) + " — " + r.pondBand.label, r.pondBand.tone);
  } else {
    addRow(
      dl,
      "Note",
      "For ages under 20, BMI is read as a percentile for age and sex, not these adult bands. See the guide."
    );
  }

  save();
}

/* ---------- shareable result ---------- */

function buildShareText() {
  const r = lastResult && lastResult.valid ? lastResult : calculate();
  if (!r.valid) return "Enter height and weight to get a BMI result.";

  const lines = [
    "BMI result",
    "----------",
    `BMI: ${round1(r.bmi).toFixed(1)} kg/m2`,
  ];

  if (r.isAdult) {
    lines.push(
      `Category (WHO Asian-Pacific): ${r.bmiBand.label}`,
      `Healthy weight for this height: ${weightLabel(r.healthyMinKg)} - ${weightLabel(r.healthyMaxKg)}`,
      `Ponderal index: ${round1(r.ponderal).toFixed(1)} (${r.pondBand.label})`
    );
  } else {
    lines.push("Age under 20 - read as a BMI-for-age percentile, not adult bands.");
  }

  lines.push(
    "",
    "BMI is a screening measure, not a diagnosis.",
    `Full BMI guide and category tables: ${SITE_URL}`
  );
  return lines.join("\n");
}

/* ---------- persistence ---------- */

// `chrome.storage` only exists when this runs as an extension. Guard it so the
// page still works if the file is opened directly in a browser.
const hasStorage =
  typeof chrome !== "undefined" && chrome.storage && chrome.storage.local;

function save() {
  if (hasStorage) chrome.storage.local.set({ bmiState: state });
}

function restore() {
  if (hasStorage) {
    chrome.storage.local.get("bmiState", (out) => {
      if (out?.bmiState) Object.assign(state, out.bmiState);
      syncControls();
      update();
    });
  } else {
    syncControls();
    update();
  }
}

function syncControls() {
  el("age").value = state.age;
  el("heightCm").value = state.heightCm;
  el("weightKg").value = state.weightKg;
  el("heightFt").value = state.heightFt;
  el("heightIn").value = state.heightIn;
  el("weightLb").value = state.weightLb;

  el("metricInputs").hidden = state.units !== "metric";
  el("imperialInputs").hidden = state.units !== "imperial";

  document.querySelectorAll("[data-units]").forEach((b) => {
    const on = b.dataset.units === state.units;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-checked", String(on));
  });
}

/* ---------- wiring ---------- */

function num(e, lo, hi) {
  const v = parseFloat(e.target.value);
  if (Number.isNaN(v)) return null;
  return Math.min(hi, Math.max(lo, v));
}

document.querySelectorAll("[data-units]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.units = btn.dataset.units;
    syncControls();
    update();
  });
});

el("age").addEventListener("input", (e) => {
  const v = num(e, 2, 120);
  if (v !== null) state.age = v;
  update();
});

el("heightCm").addEventListener("input", (e) => {
  const v = num(e, 50, 250);
  if (v !== null) state.heightCm = v;
  update();
});
el("weightKg").addEventListener("input", (e) => {
  const v = num(e, 10, 400);
  if (v !== null) state.weightKg = v;
  update();
});
el("heightFt").addEventListener("input", (e) => {
  const v = num(e, 1, 8);
  if (v !== null) state.heightFt = v;
  update();
});
el("heightIn").addEventListener("input", (e) => {
  const v = num(e, 0, 11);
  if (v !== null) state.heightIn = v;
  update();
});
el("weightLb").addEventListener("input", (e) => {
  const v = num(e, 20, 900);
  if (v !== null) state.weightLb = v;
  update();
});

el("reset").addEventListener("click", () => {
  Object.assign(state, {
    units: "metric",
    age: 30,
    heightCm: 170,
    weightKg: 70,
    heightFt: 5,
    heightIn: 7,
    weightLb: 154,
  });
  syncControls();
  update();
});

el("copyResult").addEventListener("click", async () => {
  const note = el("copyNote");
  const text = buildShareText();
  try {
    await navigator.clipboard.writeText(text);
    note.textContent = "Copied — paste it anywhere.";
  } catch (err) {
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.position = "fixed";
    ta.style.opacity = "0";
    document.body.appendChild(ta);
    ta.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (e) {
      ok = false;
    }
    document.body.removeChild(ta);
    note.textContent = ok ? "Copied — paste it anywhere." : "Press Ctrl/Cmd+C to copy.";
  }
  setTimeout(() => {
    note.textContent = "";
  }, 3000);
});

restore();
