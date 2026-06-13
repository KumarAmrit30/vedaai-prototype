import { compressMaterial } from "../../src/services/material-compression.service";

function buildLongMaterial(): string {
  const paragraphs = [
    "Photosynthesis is the process by which green plants convert light energy into chemical energy. Chlorophyll absorbs sunlight in the chloroplasts of plant cells.",
    "The light-dependent reactions occur in the thylakoid membranes and produce ATP and NADPH. Water is split during photolysis releasing oxygen as a byproduct.",
    "The Calvin cycle fixes carbon dioxide into glucose using ATP and NADPH. This stage is also called the light-independent reaction and occurs in the stroma.",
    "Cellular respiration breaks down glucose to release energy stored as ATP. Glycolysis, the Krebs cycle, and the electron transport chain are its major stages.",
    "Mitochondria are the powerhouse of the cell where aerobic respiration takes place. The electron transport chain generates the majority of ATP molecules.",
  ];
  // Repeat to create a sizable document.
  return Array.from({ length: 8 }, () => paragraphs.join(" ")).join("\n\n");
}

describe("compressMaterial", () => {
  it("reduces the material representation by at least 70%", () => {
    const material = buildLongMaterial();
    const result = compressMaterial(material);

    expect(result.originalChars).toBeGreaterThan(2000);
    expect(result.reductionRatio).toBeGreaterThanOrEqual(0.7);
    expect(result.summary.length).toBeGreaterThan(0);
  });

  it("extracts syllabus concepts from the material", () => {
    const result = compressMaterial(buildLongMaterial());

    expect(result.concepts.length).toBeGreaterThan(0);
    const joined = result.concepts.join(" ").toLowerCase();
    expect(joined).toMatch(/photosynthesis|calvin|atp|respiration|glucose/);
  });

  it("handles empty material gracefully", () => {
    const result = compressMaterial("");

    expect(result.summary).toBe("");
    expect(result.concepts).toEqual([]);
    expect(result.reductionRatio).toBe(0);
  });
});
