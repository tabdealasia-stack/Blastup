const template = "Dear {{customer_name}}, your booking {{bookingId}} is confirmed.";
const mergedVariables = { customer_name: "Alice", bookingId: "123" };
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
let message = template;
for (const [key, value] of Object.entries(mergedVariables)) {
  message = message
    .replace(new RegExp(`\\{\\{\\s*${escapeRegExp(key)}\\s*\\}\\}`, 'g'), value)
    .replace(new RegExp(`\\{${escapeRegExp(key)}\\}`, 'g'), value);
}
console.log("Replaced:", message);
