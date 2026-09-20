const fs = require('fs');
const path = require('path');

const BATCH_SIZE = 5;
const DELAY_BETWEEN_POSTS_MS = 2000;

const root = path.join(__dirname, '..');
const productsPath = path.join(root, 'products.json');
const statePath = path.join(root, 'telegram-state.json');

const products = JSON.parse(fs.readFileSync(productsPath, 'utf8'));

let state = { lastIndex: -1 };
if (fs.existsSync(statePath)) {
  state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
}

function brl(n) {
  return Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function buildCaption(p) {
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

  lines.push('');
  lines.push('(Anúncio)');
  return lines.join('\n');
}

const token = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;

if (!token || !chatId) {
  console.error('TELEGRAM_BOT_TOKEN e TELEGRAM_CHAT_ID precisam estar definidos como secrets do repositorio.');
  process.exit(1);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function postProduct(p) {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendPhoto`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, photo: p.image, caption: buildCaption(p) }),
  });
  const data = await res.json();
  if (!data.ok) {
    throw new Error(`Telegram API error: ${JSON.stringify(data)}`);
  }
}

// Produtos novos primeiro: state.postedIds guarda os ids ja postados. Todo produto
// que ainda nao esta nessa lista e "novo" e sai antes da rotacao normal, do mais
// recente (fim de products.json) para o mais antigo. Sem postedIds (estado antigo),
// a fila de novos fica desligada para nao postar o catalogo inteiro de uma vez.
function saveState(extra) {
  const ids = new Set(products.map((x) => x.id));
  const postedIds = Array.isArray(state.postedIds)
    ? state.postedIds.filter((id) => ids.has(id))
    : undefined;
  state = { ...state, ...extra, postedIds, lastPostedAt: new Date().toISOString() };
  if (postedIds === undefined) delete state.postedIds;
  fs.writeFileSync(statePath, JSON.stringify(state, null, 2) + '\n');
}

function nextNewProductIndex() {
  if (!Array.isArray(state.postedIds)) return -1;
  const posted = new Set(state.postedIds);
  for (let i = products.length - 1; i >= 0; i--) {
    if (!posted.has(products[i].id)) return i;
  }
  return -1;
}

async function main() {
  const batchSize = Math.min(BATCH_SIZE, products.length);

  for (let i = 0; i < batchSize; i++) {
    const newIndex = nextNewProductIndex();
    let index;
    let isNew = false;
    if (newIndex >= 0) {
      index = newIndex;
      isNew = true;
    } else {
      index = (Number(state.lastIndex) + 1) % products.length;
    }
    const p = products[index];

    await postProduct(p);

    if (isNew) {
      state.postedIds = [...state.postedIds, p.id];
      saveState({});
    } else {
      if (Array.isArray(state.postedIds) && !state.postedIds.includes(p.id)) {
        state.postedIds = [...state.postedIds, p.id];
      }
      saveState({ lastIndex: index, lastProductId: p.id });
    }
    console.log(`Posted ${isNew ? 'NOVO ' : ''}[${index}/${products.length}]: ${p.name}`);

    if (i < batchSize - 1) await sleep(DELAY_BETWEEN_POSTS_MS);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});