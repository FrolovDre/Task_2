// ---- CONFIG ----
const TSV_URL = 'reviews_test.tsv';

// Сборка URL без «грязи»
const HF_MODEL = 'google/flan-t5-base';
function cleanUrl(u) {
  return u
    .replace(/\u200B|\u200C|\u200D|\uFEFF|\u00AD/g, '') // zero-width/soft hyphen
    .replace(/([^:]\/)\/+/g, '$1')                      // двойные слэши
    .trim();
}
const HF_URL = cleanUrl(['https://api', '-inference.huggingface.co/models/', HF_MODEL].join(''));

// ---- DOM ----
const el = id => document.getElementById(id);
const tokenEl     = el('token'),
      pickBtn     = el('pick'),
      sentBtn     = el('sent'),
      nounsBtn    = el('nouns');
const reviewEl    = el('review'),
      sentimentEl = el('sentiment'),
      nounLevelEl = el('nounLevel');
const sIcon       = el('sIcon'),
      nIcon       = el('nIcon'),
      metaEl      = el('meta'),
      errEl       = el('error'),
      spinner     = el('spinner');

let reviews = [];

// ---- UI helpers ----
function showSpinner(v){ spinner.style.display = v ? 'inline-flex' : 'none'; }
function setErr(t){ errEl.textContent = t || ''; }
function setReview(t){ reviewEl.textContent = t; reviewEl.classList.remove('muted'); }
function disable(u){ [pickBtn, sentBtn, nounsBtn].forEach(b => b.disabled = u); }

// ---- Data ----
async function loadTSV(){
  showSpinner(true); setErr('');
  try{
    const r = await fetch(TSV_URL, { cache: 'no-store' });
    if(!r.ok) throw new Error('TSV '+r.status);
    const txt = await r.text();
    const parsed = Papa.parse(txt, { header:true, delimiter:'\t', skipEmptyLines:true });
    const arr = (parsed.data || [])
      .map(x => (x && typeof x.text === 'string' ? x.text.trim() : ''))
      .filter(Boolean);
    reviews = arr;
    metaEl.textContent = 'Loaded ' + reviews.length + ' reviews';
  }catch(e){
    setErr(e.message || 'Load error');
  }finally{
    showSpinner(false);
  }
}

// ---- Mapping ----
function mapSentiment(s=''){
  const str = String(s).toLowerCase();
  if (str.includes('positive')) { sIcon.firstElementChild.className = 'fa-solid fa-thumbs-up';   return '👍 Positive'; }
  if (str.includes('negative')) { sIcon.firstElementChild.className = 'fa-solid fa-thumbs-down'; return '👎 Negative'; }
  sIcon.firstElementChild.className = 'fa-solid fa-question'; return '
