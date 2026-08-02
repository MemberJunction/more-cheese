// DEFECTS — deliberate data-quality problems, planted on purpose.
//
// Every one is labelled with ground truth, so a demo can show FINDING them. This is the only
// data in the system that is meant to be wrong.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   params    how many of each kind to plant
//
// Counts are exact where the eligible pool allows it. Heroes carrying an authored defect are
// additional to these numbers, not part of them.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  defects: {
    params: {
      // Near-duplicate person records — the same human, entered twice.
      duplicatePersonCount: 24,
      // Employment records left behind after the person moved on.
      staleEmployerCount: 10,
      // Mistyped email addresses.
      typoEmailCount: 12
    }
  },
};
