// CORE — what everything in this project shares.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   params    every scalar
//
// `scale.members` and `history.startYear` are read by the ENGINE, not by this project's
// generators: cfg.n defaults to scale.members when --n is not passed, and yearsOf(cfg) walks
// history.startYear → releaseYear. They are the engine's two required ruleset keys.

export default {
  scale: {
    members: 50, // tiny on purpose: this project exists to prove the engine, not to look real
  },
  history: {
    startYear: 2022,
  },
};
