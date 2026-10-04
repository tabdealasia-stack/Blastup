const msg = 'Hello {{customer_name}} and {order_id}';
const regex = /\{+([^}]+?)\}+/g;
console.log(Array.from(msg.matchAll(regex)).map(m => m[1].trim()));
