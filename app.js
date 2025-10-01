const TSV_URL='reviews_test.tsv';
const HF_URL='https://api-inference.huggingface.co/models/tiiuae/falcon-7b-instruct';
const el=id=>document.getElementById(id);
const tokenEl=el('token'),pickBtn=el('pick'),sentBtn=el('sent'),nounsBtn=el('nouns');
const reviewEl=el('review'),sentimentEl=el('sentiment'),nounLevelEl=el('nounLevel');
const sIcon=el('sIcon'),nIcon=el('nIcon'),metaEl=el('meta'),errEl=el('error'),spinner=el('spinner');
let reviews=[];

function showSpinner(v){spinner.style.display=v?'inline-flex':'none';}
function setErr(t){errEl.textContent=t||'';}
function setReview(t){reviewEl.textContent=t;reviewEl.classList.remove('muted');}
function disable(u){[pickBtn,sentBtn,nounsBtn].forEach(b=>b.disabled=u);}

async function loadTSV(){
  showSpinner(true);setErr('');
  try{
    const r=await fetch(TSV_URL,{cache:'no-store'});
    if(!r.ok)throw new Error('TSV '+r.status);
    const txt=await r.text();
    const parsed=Papa.parse(txt,{header:true,delimiter:'\t',skipEmptyLines:true});
    const arr=(parsed.data||[]).map(x=>(x&&typeof x.text==='string'?x.text.trim():'' )).filter(Boolean);
    reviews=arr;metaEl.textContent='Loaded '+reviews.length+' reviews';
  }catch(e){setErr(e.message||'Load error');}
  finally{showSpinner(false);}
}

function pickRandom(){if(!reviews.length){setErr('No reviews available');return;}setErr('');const t=reviews[Math.floor(Math.random()*reviews.length)];setReview(t);}
function mapSentiment(s){
  if(s.includes('positive')){sIcon.firstElementChild.className='fa-solid fa-thumbs-up';return '👍 Positive';}
  if(s.includes('negative')){sIcon.firstElementChild.className='fa-solid fa-thumbs-down';return '👎 Negative';}
  sIcon.firstElementChild.className='fa-solid fa-question';return '❓ Neutral';
}
function mapNouns(s){
  if(s.includes('high')){nIcon.firstElementChild.className='fa-solid fa-circle';return '🟢 High';}
  if(s.includes('medium')){nIcon.firstElementChild.className='fa-regular fa-circle';return '🟡 Medium';}
  nIcon.firstElementChild.className='fa-regular fa-circle-question';return '🔴 Low';
}

async function callApi(prompt,text){
  const headers={'Content-Type':'application/json'};
  const t=tokenEl.value.trim();if(t)headers.Authorization='Bearer '+t;
  const res=await fetch(HF_URL,{method:'POST',headers,body:JSON.stringify({inputs:prompt+text})});
  let data=null;try{data=await res.json();}catch(_){}
  if(!res.ok){
    if(res.status===402)setErr('Payment required/invalid token (402)');
    else if(res.status===429)setErr('Rate limit (429)');
    else if(data&&data.error)setErr(data.error);
    else setErr('HTTP '+res.status);
    throw new Error('api');
  }
  if(Array.isArray(data)&&data[0]&&typeof data[0].generated_text==='string'){
    const first=data[0].generated_text.split('\n')[0].trim().toLowerCase();
    return first;
  }
  if(data&&data.error){setErr(data.error);throw new Error('api');}
  throw new Error('format');
}

async function analyzeSentiment(){
  const t=reviewEl.textContent||'';
  if(!t.trim()){setErr('Pick a review first');return;}
  setErr('');disable(true);showSpinner(true);
  try{
    const first=await callApi('Classify this review as positive, negative, or neutral: ',t);
    sentimentEl.textContent=mapSentiment(first);
  }catch(_){}
  finally{disable(false);showSpinner(false);}
}

async function countNouns(){
  const t=reviewEl.textContent||'';
  if(!t.trim()){setErr('Pick a review first');return;}
  setErr('');disable(true);showSpinner(true);
  try{
    const first=await callApi('Count the nouns in this review and return only High (>15), Medium (6-15), or Low (<6). ',t);
    nounLevelEl.textContent=mapNouns(first);
  }catch(_){}
  finally{disable(false);showSpinner(false);}
}

pickBtn.addEventListener('click',pickRandom);
sentBtn.addEventListener('click',analyzeSentiment);
nounsBtn.addEventListener('click',countNouns);
loadTSV();
