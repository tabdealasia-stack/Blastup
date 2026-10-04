const str = '{{var}}';
const r1 = /\{\{([^}]+)\}\}/g;
const r2 = /\{([^}]+)\}/g;
console.log('r1', Array.from(str.matchAll(r1)).map(m => m[1]));
console.log('r2', Array.from(str.matchAll(r2)).map(m => m[1]));
