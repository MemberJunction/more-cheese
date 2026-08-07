// MOTIFS — recognisable member arcs, stamped onto the anonymous crowd.
//
// Without these, every member who is not a named hero is statistically average, and no story
// is visible in the data unless a hero happens to be on screen.
//
// ─── THE SHAPE ─────────────────────────────────────────────────────────────────────────────
//   params    how many members get each arc, and how far their keenness moves
//
// Keenness runs about -2 (disengaged) to +2 (very engaged), so a start of -0.9 rising to +1.1
// is a genuine transformation rather than a nudge.
//
// See datagen/CONTRACT.md. Values only — no clock, no randomness, no I/O, no functions.

export default {
  motifs: {
    params: {
      // Members whose employer folded, who then let their membership lapse.
      employerCollapseLapse: {
        count: 6
      },
      // Members who start disengaged and become highly involved.
      risingStar: {
        count: 6,
        startTheta: -0.9,
        endTheta: 1.1
      },
      // The reverse — involved members who drift away without ever complaining.
      quietFade: {
        count: 6,
        startTheta: 0.9,
        endTheta: -1.1
      }
    }
  },
};
