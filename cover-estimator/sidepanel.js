const SUM_STEPS = [
  300000, 500000, 700000, 1000000, 1500000, 2000000, 2500000, 5000000, 10000000,
];

const state = {
  plan: "individual",
  members: [{ role: "self", age: 32 }],
  sumIndex: 3,
  city: "tier1",
  ped: "none",
  tobacco: false,
  term: 1,
};

const el = (id) => document.getElementById(id);

/* ---------- formatting ---------- */

function rupees(n) {
  return "\u20B9" + Math.round(n).toLocaleString("en-IN");
}

function lakhs(v) {
  if (v >= 10000000) return "\u20B9" + v / 10000000 + " crore";
  return "\u20B9" + v / 100000 + " lakh";
}

/* ---------- premium engine ---------- */

function rateForAge(age) {
  const band = RATES.ageBands.find((b) => age <= b.max);
  return band ? band.rate : RATES.ageBands[RATES.ageBands.length - 1].rate;
}

function bandLabel(age) {
  const band = RATES.ageBands.find((b) => age <= b.max);
  return band ? band.label : "66+";
}

// Annual premium for one person at full rate, before loadings.
function basePremium(age, sumInsured) {
  const perLakh = rateForAge(age);
  const siFactor = RATES.sumInsuredFactor[sumInsured] ?? 1;
  const cityFactor = RATES.cityTier[state.city].factor;
  return perLakh * (sumInsured / 100000) * siFactor * cityFactor;
}

function calculate() {
  const sumInsured = SUM_STEPS[state.sumIndex];
  const people = state.plan === "individual" ? state.members.slice(0, 1) : state.members;

  let core = 0;
  const lines = [];

  if (state.plan === "floater") {
    // Floater is priced off the eldest life; everyone else adds a share.
    const sorted = [...people].sort((a, b) => b.age - a.age);
    const eldest = sorted[0];
    const anchor = basePremium(eldest.age, sumInsured);
    core += anchor;
    lines.push({
      label: `Eldest covered, age ${eldest.age} (${bandLabel(eldest.age)})`,
      value: anchor,
    });

    sorted.slice(1).forEach((m) => {
      const share = m.age < 18 ? RATES.floaterShare.child : RATES.floaterShare.adult;
      // Never charge more for an extra person than their own cover would cost.
      const add = Math.min(anchor * share, basePremium(m.age, sumInsured));
      core += add;
      lines.push({
        label: `${m.age < 18 ? "Child" : "Adult"}, age ${m.age}`,
        value: add,
      });
    });
  } else {
    const only = people[0];
    const p = basePremium(only.age, sumInsured);
    core += p;
    lines.push({ label: `Age ${only.age} (${bandLabel(only.age)}) at ${lakhs(sumInsured)}`, value: p });
  }

  const pedLoad = RATES.preExisting[state.ped].load;
  if (pedLoad > 0) {
    const amt = core * pedLoad;
    lines.push({ label: `Pre-existing conditions loading (${pedLoad * 100}%)`, value: amt });
    core += amt;
  }

  if (state.tobacco) {
    const amt = core * RATES.tobaccoLoad;
    lines.push({ label: `Tobacco use loading (${RATES.tobaccoLoad * 100}%)`, value: amt });
    core += amt;
  }

  const termYears = Number(state.term);
  let multiYear = core * termYears;
  const discount = RATES.tenure[termYears].discount;
  if (discount > 0) {
    const cut = multiYear * discount;
    lines.push({
      label: `${termYears}-year term discount (${discount * 100}%)`,
      value: -cut,
      credit: true,
    });
    multiYear -= cut;
  }

  const gst = multiYear * RATES.gst;
  lines.push({ label: "GST at 18%", value: gst });

  const payable = multiYear + gst;
  lines.push({
    label: termYears > 1 ? `Payable now, covers ${termYears} years` : "Payable now",
    value: payable,
    total: true,
  });

  return { payable, perYear: payable / termYears, lines, termYears, sumInsured };
}

/* ---------- rendering ---------- */

function renderMembers() {
  const list = el("members");
  list.innerHTML = "";

  const visible = state.plan === "individual" ? state.members.slice(0, 1) : state.members;

  visible.forEach((m, i) => {
    const li = document.createElement("li");
    li.className = "member";

    const role = document.createElement("select");
    [
      ["self", "Myself"],
      ["spouse", "Spouse"],
      ["parent", "Parent"],
      ["child", "Child"],
    ].forEach(([v, label]) => {
      const o = document.createElement("option");
      o.value = v;
      o.textContent = label;
      if (m.role === v) o.selected = true;
      role.appendChild(o);
    });
    role.disabled = state.plan === "individual";
    role.addEventListener("change", (e) => {
      state.members[i].role = e.target.value;
      update();
    });

    const age = document.createElement("input");
    age.type = "number";
    age.min = "0";
    age.max = "99";
    age.value = m.age;
    age.setAttribute("aria-label", "Age");
    age.addEventListener("input", (e) => {
      const v = parseInt(e.target.value, 10);
      state.members[i].age = Number.isNaN(v) ? 0 : Math.min(99, Math.max(0, v));
      update();
    });

    li.append(role, age);

    if (state.plan === "floater" && state.members.length > 1) {
      const rm = document.createElement("button");
      rm.type = "button";
      rm.className = "remove";
      rm.textContent = "\u00D7";
      rm.title = "Remove this person";
      rm.addEventListener("click", () => {
        state.members.splice(i, 1);
        update();
      });
      li.appendChild(rm);
    }

    list.appendChild(li);
  });

  const addBtn = el("addMember");
  addBtn.hidden = state.plan === "individual";
  addBtn.disabled = state.members.length >= 6;
  addBtn.textContent =
    state.members.length >= 6 ? "Six people is the practical limit" : "Add a family member";
}

function renderBreakdown(lines) {
  const dl = el("breakdown");
  dl.innerHTML = "";
  lines.forEach((line) => {
    const row = document.createElement("div");
    row.className = "row" + (line.credit ? " is-credit" : "");
    const dt = document.createElement("dt");
    dt.textContent = line.label;
    const dd = document.createElement("dd");
    dd.textContent = (line.value < 0 ? "\u2212" : "") + rupees(Math.abs(line.value));
    row.append(dt, dd);
    dl.appendChild(row);
  });
}

const SITE_URL = "https://www.starhealth.in/";
let lastResult = null;

function update() {
  renderMembers();

  const result = calculate();
  lastResult = result;

  el("figure").textContent = rupees(result.payable);
  el("caption").textContent =
    result.termYears > 1
      ? `for ${result.termYears} years of cover, including 18% GST`
      : "a year, including 18% GST";
  el("monthly").textContent =
    "About " + rupees(result.perYear / 12) + " a month";

  el("sumLabel").textContent = lakhs(result.sumInsured) + " of cover";
  el("planHint").textContent =
    state.plan === "individual"
      ? "One policy, one person. Premium is priced on your age alone."
      : "One shared pot of cover. Priced on the eldest person, so adding a parent moves it most.";

  renderBreakdown(result.lines);
  renderAdvice(result);
  save();
}

// The single most useful thing this tool can tell someone.
function renderAdvice(result) {
  const box = el("advice");
  const ages = state.members.map((m) => m.age);
  const eldest = Math.max(...ages);
  const youngest = Math.min(...ages.filter((a) => a >= 18), 99);

  if (state.plan === "floater" && eldest >= 60 && eldest - youngest >= 20) {
    const split = basePremium(eldest, result.sumInsured) * (1 + RATES.gst);
    box.hidden = false;
    box.textContent =
      `A floater is priced on your eldest member, so everyone here is paying at age ${eldest} rates. ` +
      `Covering them separately costs about ${rupees(split)} on its own and usually works out cheaper overall. Worth quoting both ways.`;
  } else {
    box.hidden = true;
  }
}

/* ---------- persistence ---------- */

function save() {
  chrome.storage?.local.set({ estimatorState: state });
}

function restore() {
  chrome.storage?.local.get("estimatorState", (out) => {
    if (out?.estimatorState) Object.assign(state, out.estimatorState);
    syncControls();
    update();
  });
}

function syncControls() {
  el("sumInsured").value = state.sumIndex;
  el("city").value = state.city;
  el("ped").value = state.ped;
  el("tobacco").checked = state.tobacco;
  document.querySelectorAll("[data-plan]").forEach((b) => {
    const on = b.dataset.plan === state.plan;
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-checked", String(on));
  });
  document.querySelectorAll("[data-term]").forEach((b) => {
    const on = Number(b.dataset.term) === Number(state.term);
    b.classList.toggle("is-on", on);
    b.setAttribute("aria-checked", String(on));
  });
}

/* ---------- wiring ---------- */

document.querySelectorAll("[data-plan]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.plan = btn.dataset.plan;
    if (state.plan === "floater" && state.members.length === 1) {
      state.members.push({ role: "spouse", age: 30 });
    }
    syncControls();
    update();
  });
});

document.querySelectorAll("[data-term]").forEach((btn) => {
  btn.addEventListener("click", () => {
    state.term = Number(btn.dataset.term);
    syncControls();
    update();
  });
});

el("addMember").addEventListener("click", () => {
  state.members.push({ role: "child", age: 8 });
  update();
});

el("sumInsured").addEventListener("input", (e) => {
  state.sumIndex = Number(e.target.value);
  update();
});

el("city").addEventListener("change", (e) => {
  state.city = e.target.value;
  update();
});

el("ped").addEventListener("change", (e) => {
  state.ped = e.target.value;
  update();
});

el("tobacco").addEventListener("change", (e) => {
  state.tobacco = e.target.checked;
  update();
});

el("reset").addEventListener("click", () => {
  Object.assign(state, {
    plan: "individual",
    members: [{ role: "self", age: 32 }],
    sumIndex: 3,
    city: "tier1",
    ped: "none",
    tobacco: false,
    term: 1,
  });
  syncControls();
  update();
});

/* ---------- shareable estimate ---------- */

// Plain text people paste into forum replies — where organic links come from.
// Keeps the inputs, the breakdown and a link back, so the estimate is
// reproducible and attributed.
function buildShareText() {
  const r = lastResult || calculate();
  const people =
    state.plan === "individual" ? state.members.slice(0, 1) : state.members;
  const who =
    state.plan === "individual"
      ? `Individual, age ${people[0].age}`
      : `Family floater (${people.map((m) => m.age).join(", ")})`;

  const lines = [
    "Health insurance premium estimate",
    "----------------------------------",
    `Cover: ${who}`,
    `Sum insured: ${lakhs(r.sumInsured)}`,
    `City tier: ${RATES.cityTier[state.city].label}`,
    `Pre-existing: ${RATES.preExisting[state.ped].label}`,
    `Tobacco use: ${state.tobacco ? "Yes" : "No"}`,
    `Term: ${RATES.tenure[state.term].label}`,
    "",
    "Breakdown:",
    ...r.lines.map(
      (l) => `  ${l.label}: ${(l.value < 0 ? "-" : "") + rupees(Math.abs(l.value))}`
    ),
    "",
    `Total payable: ${rupees(r.payable)}` +
      (r.termYears > 1 ? ` for ${r.termYears} years` : " a year") +
      " (incl. 18% GST)",
    "",
    "Estimate only, not a quote. Built with the Health Cover Estimator.",
    `Methodology and real plan comparison: ${SITE_URL}`,
  ];
  return lines.join("\n");
}

el("copyEstimate").addEventListener("click", async () => {
  const note = el("copyNote");
  const text = buildShareText();
  try {
    await navigator.clipboard.writeText(text);
    note.textContent = "Copied — paste it anywhere.";
  } catch (err) {
    // Fallback for contexts where the async clipboard API is unavailable.
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
