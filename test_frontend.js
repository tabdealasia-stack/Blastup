const msg = 'Hello {{customer_name}}, your order {order_id} is ready.';
const regex = /\{\{([^}]+)\}\}/g;
const regex2 = /\{([^}]+)\}/g;
const matches1 = Array.from(msg.matchAll(regex)).map(m => m[1].trim());
const matches2 = Array.from(msg.matchAll(regex2)).map(m => m[1].trim());
console.log(Array.from(new Set([...matches1, ...matches2])));
