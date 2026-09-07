/*
 * RATE TABLE
 * ----------
 * These are INDICATIVE market-range figures for Indian retail health cover,
 * not any single insurer's filed rate card. Replace the numbers below with
 * your own brochure/API data before publishing under a brand name.
 *
 * baseRatePerLakh = annual premium, in rupees, per Rs 1 lakh of sum insured,
 * measured at a 5 lakh sum insured in a Tier 1 city.
 */

const RATES = {
  // Age band -> annual rupees per lakh of cover
  ageBands: [
    { max: 17, label: "under 18", rate: 620 },
    { max: 25, label: "18–25", rate: 900 },
    { max: 35, label: "26–35", rate: 1100 },
    { max: 45, label: "36–45", rate: 1500 },
    { max: 50, label: "46–50", rate: 2050 },
    { max: 55, label: "51–55", rate: 2800 },
    { max: 60, label: "56–60", rate: 3700 },
    { max: 65, label: "61–65", rate: 4900 },
    { max: 120, label: "66+", rate: 6300 },
  ],

  // Higher cover costs less per lakh
  sumInsuredFactor: {
    300000: 1.15,
    500000: 1.0,
    700000: 0.92,
    1000000: 0.85,
    1500000: 0.72,
    2000000: 0.64,
    2500000: 0.58,
    5000000: 0.4,
    10000000: 0.26,
  },

  cityTier: {
    tier1: { factor: 1.0, label: "Metro (Delhi, Mumbai, Chennai, Bengaluru…)" },
    tier2: { factor: 0.9, label: "Tier 2 city" },
    tier3: { factor: 0.82, label: "Tier 3 / smaller town" },
  },

  // Each extra person is charged the LOWER of: a share of the eldest
  // member's premium, or their own standalone premium. Without the cap,
  // adding an elderly parent would wrongly re-price the young adults too.
  floaterShare: { adult: 0.45, child: 0.25 },

  preExisting: {
    none: { load: 0, label: "None declared" },
    controlled: { load: 0.2, label: "One, medically controlled" },
    multiple: { load: 0.35, label: "Two or more" },
  },

  tobaccoLoad: 0.15,

  tenure: {
    1: { discount: 0, label: "1 year" },
    2: { discount: 0.075, label: "2 years" },
    3: { discount: 0.1, label: "3 years" },
  },

  gst: 0.18,
};
