const SC = 40n, SCALE = 10n ** SC;
class Dec {
  constructor(v){
    if (v instanceof Dec){ this.n = v.n; return; }
    const s = String(v).trim(); const m = /^(-)?(\d+)(?:\.(\d+))?$/.exec(s);
    if (!m) throw new Error('[DecimalError] Invalid argument: ' + s);
    const frac = (m[3] || '').padEnd(Number(SC), '0').slice(0, Number(SC));
    this.n = (BigInt(m[2]) * SCALE + BigInt(frac || '0')) * (m[1] ? -1n : 1n);
  }
  static set(){} static get ROUND_HALF_UP(){ return 4; }
  static _(n){ const d = Object.create(Dec.prototype); d.n = n; return d; }
  static _rd(num, den){ const q = num / den, r = num % den; if ((r < 0n ? -r : r) * 2n >= (den < 0n ? -den : den)) return q + ((num < 0n) !== (den < 0n) ? -1n : 1n); return q; }
  plus(o){ return Dec._(this.n + new Dec(o).n); }
  mul(o){ return Dec._(Dec._rd(this.n * new Dec(o).n, SCALE)); }
  div(o){ const d = new Dec(o).n; if (d === 0n) throw new Error('div by zero'); return Dec._(Dec._rd(this.n * SCALE, d)); }
  lte(o){ return this.n <= new Dec(o).n; }
  minus(o){ return Dec._(this.n - new Dec(o).n); }
  eq(o){ return this.n === new Dec(o).n; } lt(o){ return this.n < new Dec(o).n; } gt(o){ return this.n > new Dec(o).n; } gte(o){ return this.n >= new Dec(o).n; }
  abs(){ return Dec._(this.n < 0n ? -this.n : this.n); } negated(){ return Dec._(-this.n); }
  toDecimalPlaces(dp){ const f = 10n ** (SC - BigInt(dp)); return Dec._(Dec._rd(this.n, f) * f); }
  toFixed(dp){
    const neg = this.n < 0n, a = neg ? -this.n : this.n;
    let s;
    if (dp === undefined){ const i = a / SCALE, f = (a % SCALE).toString().padStart(Number(SC), '0').replace(/0+$/, ''); s = i + (f ? '.' + f : ''); }
    else { const r = this.toDecimalPlaces(dp).n; const ar = r < 0n ? -r : r; const i = ar / SCALE; const f = (ar % SCALE).toString().padStart(Number(SC), '0').slice(0, dp); s = i + (dp ? '.' + f : ''); }
    return (neg && /[1-9]/.test(s) ? '-' : '') + s;
  }
  toString(){ return this.toFixed(); }
}
window.Decimal = Dec;
