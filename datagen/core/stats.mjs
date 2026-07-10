// Statistics the validator needs: a small logistic regression (Newton-Raphson) that
// returns both coefficients AND their standard errors (from the inverse Hessian).
// The SEs matter: pilot-scale gates widen by estimation error so noise at N=500 doesn't
// produce false failures, while production-scale checks stay strict (spec §7 lesson #3).

export function logisticFit(X, y, iters = 50) {
  const k = X[0].length;
  let beta = new Array(k).fill(0);
  let lastHess = null;
  for (let it = 0; it < iters; it++) {
    const grad = new Array(k).fill(0);
    const hess = Array.from({ length: k }, () => new Array(k).fill(0));
    for (let i = 0; i < X.length; i++) {
      let z = 0;
      for (let j = 0; j < k; j++) z += beta[j] * X[i][j];
      const p = 1 / (1 + Math.exp(-z));
      const w = p * (1 - p) + 1e-9;
      for (let j = 0; j < k; j++) {
        grad[j] += (y[i] - p) * X[i][j];
        for (let l = 0; l < k; l++) hess[j][l] += w * X[i][j] * X[i][l];
      }
    }
    lastHess = hess.map((row) => [...row]);
    // solve hess * delta = grad (Gaussian elimination)
    const A = hess.map((row, i) => [...row, grad[i]]);
    for (let c = 0; c < k; c++) {
      let piv = c;
      for (let r2 = c + 1; r2 < k; r2++) if (Math.abs(A[r2][c]) > Math.abs(A[piv][c])) piv = r2;
      [A[c], A[piv]] = [A[piv], A[c]];
      if (Math.abs(A[c][c]) < 1e-12) return { beta, se: new Array(k).fill(Infinity) };
      for (let r2 = 0; r2 < k; r2++) {
        if (r2 === c) continue;
        const f = A[r2][c] / A[c][c];
        for (let c2 = c; c2 <= k; c2++) A[r2][c2] -= f * A[c][c2];
      }
    }
    let move = 0;
    for (let j = 0; j < k; j++) { const d = A[j][k] / A[j][j]; beta[j] += d; move += Math.abs(d); }
    if (move < 1e-8) break;
  }
  // SEs from the inverse Hessian diagonal (Gauss-Jordan)
  const A = lastHess.map((row, i) => [...row, ...row.map((_, j) => (i === j ? 1 : 0))]);
  for (let c = 0; c < k; c++) {
    let piv = c;
    for (let r2 = c + 1; r2 < k; r2++) if (Math.abs(A[r2][c]) > Math.abs(A[piv][c])) piv = r2;
    [A[c], A[piv]] = [A[piv], A[c]];
    const d = A[c][c];
    for (let c2 = 0; c2 < 2 * k; c2++) A[c][c2] /= d;
    for (let r2 = 0; r2 < k; r2++) {
      if (r2 === c) continue;
      const f = A[r2][c];
      for (let c2 = 0; c2 < 2 * k; c2++) A[r2][c2] -= f * A[c][c2];
    }
  }
  const se = beta.map((_, j) => Math.sqrt(Math.max(0, A[j][k + j])));
  return { beta, se };
}
