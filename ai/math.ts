export function meanPooling(
  lastHidden: Float32Array,
  mask: number[],
  seqLen: number,
  dim: number
) {
  const out = new Float32Array(dim);
  let count = 0;

  for (let i = 0; i < seqLen; i++) {
    if (mask[i] === 0) continue;
    count++;

    for (let j = 0; j < dim; j++) {
      out[j] += lastHidden[i * dim + j];
    }
  }

  for (let j = 0; j < dim; j++) out[j] /= count;
  return out;
}

export function normalize(v: Float32Array) {
  let sum = 0;
  for (let i = 0; i < v.length; i++) sum += v[i] * v[i];
  const norm = Math.sqrt(sum);
  for (let i = 0; i < v.length; i++) v[i] /= norm;
  return v;
}
