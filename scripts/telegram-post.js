const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const productsPath = path.join(root, 'products.json');
const statePath = path.join(root, 'telegram-state.json');
const couponPath = path.join(root, 'telegram-coupon.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

let coupon = null;
if (fs.existsSync(couponPath)) {
  const c = JSON.parse(fs.readFileSync(couponPath, 'utf8'));
  const today = new Date().toISOString().slice(0, 10);
  if (!c.validUntil || c.validUntil >= today) coupon = c;
}

let state = { lastIndex: -1 };
if (fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

const nextIndex = (Number(state.lastIndex) + 1) % products.length;
const p = products[nextIndex];

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

let discount = 0;
if (p.oldPrice && Number(p.oldPrice) > Number(p.price)) {
  discount = Math.round((1 - Number(p.price) / Number(p.oldPrice)) * 100);
}

const lines = [];
lines.push(`\u{1F4E2}\u{1F4B0} ${p.name}`);
if (p.oldPrice) {
  let priceLine = `De R$ ${brl(p.oldPrice)} por R$ ${brl(p.price)}`;
  if (discount > 0) priceLine += ` (-${discount}%)`;
  lines.push(priceLine);
} else {
  lines.push(`R$ ${brl(p.price)}`);
}
lines.push('');
lines.push(`\u{1F517} ${p.link}`);

if (coupon && p.store === coupon.store) {
  lines.push('');
  lines.push(`\u{1F4B0} Cupom bônus: ${coupon.code} (${coupon.discountLabel}, até R$ ${brl(coupon.maxDiscount)}, compra mín. R$ ${brl(coupon.minPurchase)})`);
}

lines.push('');
lines.push('(Anúncio)');
const caption = lines.join('\n');

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID precisam estar definidos como secrets do repositorio.');
  process.exit(1);
}

async function main() {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: p.image, caption }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  }

  const newState = {
    lastIndex: nextIndex,
    lastProductId: p.id,
    lastPostedAt: new Date().toISOString(),
  };
  fs.writeFileSync(statePath, JSON.stringify(newState, null, 2) + '\n');
  console.log(`Posted [${nextIndex}/${products.length}]: ${p.name}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
