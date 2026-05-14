export function cosineSimilarity(a: number[], b: number[]): number {
  // Dimension mismatch or empty vector — treat as no similarity rather than crashing.
  if (a.length === 0 || b.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  const denom = Math.sqrt(na) * Math.sqrt(nb);
  // Zero-norm vector (all zeros) — similarity is undefined; return 0 to avoid
  // false dedup matches against legitimately zero-norm pseudo-embeddings.
  return denom === 0 ? 0 : dot / denom;
}

export function meanVector(vectors: number[][]): number[] {
  if (vectors.length === 0) return [];
  const dim = vectors[0].length;
  const out = new Array(dim).fill(0);
  let counted = 0;
  for (const v of vectors) {
    // Skip vectors with wrong dimension to avoid silently biasing the centroid.
    if (v.length !== dim) {
      console.warn("[similarity] meanVector: skipping vector with mismatched dimension", {
        expected: dim,
        got: v.length,
      });
      continue;
    }
    for (let i = 0; i < dim; i++) out[i] += v[i];
    counted++;
  }
  if (counted === 0) return [];
  for (let i = 0; i < dim; i++) out[i] /= counted;
  return out;
}
