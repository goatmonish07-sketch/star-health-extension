/*
 * BMI + PONDERAL INDEX REFERENCE DATA
 * -----------------------------------
 * Categories mirror the tables published on
 * https://www.starhealth.in/bmi-calculator/ — the WHO categorisation for the
 * Asian-Pacific population (which uses lower cut-offs than the general WHO
 * scale) plus the Ponderal Index ranges shown on the same page.
 *
 * All calculation reads from this file; the UI logic in sidepanel.js does not
 * hard-code any threshold. Update the numbers here if the source page changes.
 */

const BMI_DATA = {
  // WHO Asian-Pacific BMI categories (adults, age 20+). `max` is the upper
  // bound of the band (inclusive of everything below the next band's floor).
  bmiCategories: [
    { max: 18.5, label: "Underweight", tone: "low", note: "Below the healthy range" },
    { max: 23.0, label: "Normal range", tone: "good", note: "Healthy weight for your height" },
    { max: 25.0, label: "Overweight", tone: "warn", note: "Slightly above the healthy range" },
    { max: 30.0, label: "Obese (Grade I)", tone: "high", note: "Raised health risk" },
    { max: Infinity, label: "Obese (Grade II)", tone: "high", note: "High health risk" },
  ],

  // Ponderal Index for adults = weight(kg) / height(m)^3
  ponderalCategories: [
    { max: 8, label: "Severe underweight", tone: "low" },
    { max: 11, label: "Underweight", tone: "low" },
    { max: 15, label: "Normal", tone: "good" },
    { max: 17, label: "Overweight", tone: "warn" },
    { max: Infinity, label: "Obese", tone: "high" },
  ],

  // The healthy BMI band used to work out an ideal weight range for a height.
  healthyBmi: { min: 18.5, max: 22.9 },

  // Scale drawn on the visual meter.
  meter: { min: 12, max: 40 },

  // Unit conversions.
  convert: {
    lbToKg: 0.45359237,
    inToM: 0.0254,
    inToCm: 2.54,
  },
};
