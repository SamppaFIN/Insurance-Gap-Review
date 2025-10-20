// Minimal, dependency-free app. Keeps files in memory only.

const $ = (id) => document.getElementById(id);

// In-memory stores
const memoryFiles = new Map(); // fileId -> { id, name, content, size, uploadedAt }
const policies = []; // array of policy objects

// Finnish basic healthcare baseline (expanded, grouped)
const FINNISH_BASELINE = [
  'Vastaanottopalvelut (yleislääkäri, hoitaja)',
  'Neuvola, koulu- ja opiskeluterveydenhuolto',
  'Suunterveydenhuolto (perus)',
  'Mielenterveys- ja päihdepalvelut (perustaso)',
  'Fysioterapia ja kuntoutus (perus)',
  'Laboratorio (perustaso)',
  'Kuvantaminen (perustaso, röntgen, ultraääni)',
  'Sairaanhoito terveyskeskuksessa / päivystys',
  'Rokotukset (kansallinen ohjelma)',
  'Pitkäaikaissairauksien seuranta (diabetes, astma jne.)',
  'Lääkärin konsultaatiot (erikoislääkäri peruslähete)',
  'Lääkkeet (peruskorvauslogiikka, ei yksityinen vakuutus)',
  'Leikkaus ja toimenpiteet (peruspalveluissa)',
  'Sairaalahoito (perustaso, terveyskeskussairaala)',
  'Äitiys- ja lastenneuvola, raskauden seuranta',
  'Työterveyshuolto perus (työnantajavastuut)',
  'Ehkäisevä terveydenhuolto (tarkastukset, seulonnat perus)',
  'Kotihoito ja kotisairaanhoito (perus)',
  'Ambulanssi ja ensihoito (perusjärjestelmä)',
  'Psykoterapia (perustaso/kela-osuus)',
  'Ravitsemus- ja elintapaohjaus',
  'Syöpähoidot (perusjärjestelmässä)',
  'Tapaturmat (julkinen päivystys)',
  'Harvinaissairaudet (erikoissairaanhoito, perusjärjestelmä)'
];

// Home insurance baseline (typical cover items)
const HOME_BASELINE = [
  'Irtain omaisuus (yleinen kotitavara)',
  'Rakennevahingot (omakotitalossa/rivitalossa)',
  'Vesivahinko/putkivuoto',
  'Tulipalo ja savuvahingot',
  'Varkaus ja murto',
  'Luonnonilmiöt (myrsky, rankkasade, salama)',
  'Sähkölaitteen rikkoontuminen',
  'Lasi- ja ikkunavahingot',
  'Vastuuvakuutus (yksityishenkilö)',
  'Oikeusturvavakuutus',
  'Matkatavaraturva (laajennuksena)',
  'Polkupyörä/urheiluvälineet',
  'Arvotavarat ja elektroniikka',
  'Vuotovahingon lisäkustannukset (kuivaus, purku)',
  'Tilapäismajoitus vahingon jälkeen'
];

function normalize(text){
  return text.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu,'');
}

// Expanded keyword map to baseline categories (synonyms and stems)
const KEYWORDS = [
  { kw:['vastaanotto','yleislaakari','yleislaakaripalvelu','hoitaja vastaanotto','terveysasema'], cat:FINNISH_BASELINE[0] },
  { kw:['neuvola','kouluterveydenhuolto','opiskelijaterveydenhuolto'], cat:FINNISH_BASELINE[1] },
  { kw:['hammas','hammashoito','suunterveys','suuhygienia','paikkaus','iensairaus'], cat:FINNISH_BASELINE[2] },
  { kw:['mielenterveys','psyko','terapia','päihde','paide','addiktio','depressio','masennus','ahdistus'], cat:FINNISH_BASELINE[3] },
  { kw:['fysio','fysioterap','kuntoutus','toimintaterap'], cat:FINNISH_BASELINE[4] },
  { kw:['laboratorio','labra','verikoe','kokeet','crp','hba1c'], cat:FINNISH_BASELINE[5] },
  { kw:['kuvant','rontgen','röntgen','ultraaani','ultraaani','mri','tt-kuva'], cat:FINNISH_BASELINE[6] },
  { kw:['sairaanhoito','paivystys','päivystys','terveyskeskus','hoitoon paasy'], cat:FINNISH_BASELINE[7] },
  { kw:['rokotus','rokote','influenssa','mmr','dtap'], cat:FINNISH_BASELINE[8] },
  { kw:['diabetes','astma','verenpaine','kilpirauhanen','krooninen','seuranta','kontrolli'], cat:FINNISH_BASELINE[9] },
  { kw:['konsultaatio','laakarinlausunto','erikoislääkäri','lähete'], cat:FINNISH_BASELINE[10] },
  { kw:['laakkeet','lääkkeet','resepti','korvausprosentti','kela korvaus'], cat:FINNISH_BASELINE[11] },
  { kw:['leikkaus','paikka toimenpide','kirurg','toimenpidehuone'], cat:FINNISH_BASELINE[12] },
  { kw:['sairaala','vuodeosasto','osastohoito','kuntoutusosasto'], cat:FINNISH_BASELINE[13] },
  { kw:['aitiys','raskauden seuranta','neuvolakaynti','synnytysvalmennus'], cat:FINNISH_BASELINE[14] },
  { kw:['tyoterveys','tyohyvinvointi','tyokyky'], cat:FINNISH_BASELINE[15] },
  { kw:['ehkaiseva','seulonta','tarkastus','vuosikontrolli','terveystarkastus'], cat:FINNISH_BASELINE[16] },
  { kw:['kotihoito','kotisairaanhoito','kotiutus','kotikäynti'], cat:FINNISH_BASELINE[17] },
  { kw:['ambulanssi','ensihoito','hata','112','kuljetus'], cat:FINNISH_BASELINE[18] },
  { kw:['psykoterapia','kelaterapia','lyhytterapia'], cat:FINNISH_BASELINE[19] },
  { kw:['ravitsemus','laakarin ohjaus','elintapa','liikuntaohjaus'], cat:FINNISH_BASELINE[20] },
  { kw:['syopa','onkolog','sytostaatti','sadehoito'], cat:FINNISH_BASELINE[21] },
  { kw:['tapaturma','vamma','murtuma','venahdys','haava'], cat:FINNISH_BASELINE[22] },
  { kw:['harvinaissairaus','erityisosaaminen','erikoissairaanhoito'], cat:FINNISH_BASELINE[23] },
];

// Home keywords
const HOME_KEYWORDS = [
  { kw:['irtain','kotitavara','kodin omaisuus','sisalto'], cat:HOME_BASELINE[0] },
  { kw:['rakenne','runko','kiinteistön osa','rakennusvahinko'], cat:HOME_BASELINE[1] },
  { kw:['vesivahinko','putkivuoto','vuotovahinko','vesi vuotaa'], cat:HOME_BASELINE[2] },
  { kw:['tulipalo','palo','savuvahinko','noe'], cat:HOME_BASELINE[3] },
  { kw:['varkaus','murto','anastus','murtovahinko'], cat:HOME_BASELINE[4] },
  { kw:['myrsky','rankkasade','salama','raesade','tulva'], cat:HOME_BASELINE[5] },
  { kw:['sahkolaite','ylijannite','oikosulku','elektroniikan rikko'], cat:HOME_BASELINE[6] },
  { kw:['lasi','ikkuna','peili','lasivahinko'], cat:HOME_BASELINE[7] },
  { kw:['vastuuvakuutus','vastuu','korvausvastuu'], cat:HOME_BASELINE[8] },
  { kw:['oikeusturva','juristi','lakimieskulut'], cat:HOME_BASELINE[9] },
  { kw:['matkatavara','matkalla','matkaturva'], cat:HOME_BASELINE[10] },
  { kw:['polkupyora','pyora','urheiluväline'], cat:HOME_BASELINE[11] },
  { kw:['arvotavara','koru','kamera','tietokone','televisio'], cat:HOME_BASELINE[12] },
  { kw:['kuivaus','purkutyö','lisäkustannus','saneraus'], cat:HOME_BASELINE[13] },
  { kw:['tilapäismajoitus','majoituskulu','hotelli'], cat:HOME_BASELINE[14] },
];

function extractCoverage(text){
  const t = normalize(text);
  const lines = t.split(/\r?\n|[.!?]+\s/).filter(Boolean);
  const maps = { health:new Map(), home:new Map() };
  for (const line of lines){
    for (const rule of KEYWORDS){
      if (rule.kw.some(k=> line.includes(normalize(k)))){
        if (!maps.health.has(rule.cat)) maps.health.set(rule.cat, {count:0, entries:[]});
        const entry = maps.health.get(rule.cat);
        entry.count += 1;
        entry.entries.push({ company: null, snippet: line.trim() });
      }
    }
    for (const rule of HOME_KEYWORDS){
      if (rule.kw.some(k=> line.includes(normalize(k)))){
        if (!maps.home.has(rule.cat)) maps.home.set(rule.cat, {count:0, entries:[]});
        const entry = maps.home.get(rule.cat);
        entry.count += 1;
        entry.entries.push({ company: null, snippet: line.trim() });
      }
    }
  }
  return maps; // {health: Map, home: Map}
}

function compareWithBaseline(coveredMap){
  const covered = [];
  for (const cat of FINNISH_BASELINE){
    if (coveredMap.has(cat)) covered.push({cat, ...coveredMap.get(cat)});
  }
  const gaps = FINNISH_BASELINE.filter(c => !coveredMap.has(c));
  return {covered, gaps};
}

function renderPolicies() {
  const list = $("list");
  list.innerHTML = '';
  if (policies.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.textContent = 'Ei vakuutuksia vielä';
    list.appendChild(empty);
    return;
  }

  for (const p of policies) {
    const card = document.createElement('div');
    card.className = 'policy';

    const title = document.createElement('div');
    title.innerHTML = `<strong>${p.company}</strong>`;

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <span class="tag">${p.type}</span>
      <span>Alku: ${p.start || '—'}</span>
      <span>Loppu: ${p.end || '—'}</span>
      <span>€ ${p.premium || '—'}</span>
    `;

    const file = document.createElement('div');
    file.className = 'file';
    if (p.fileId && memoryFiles.has(p.fileId)) {
      const f = memoryFiles.get(p.fileId);
      const dl = document.createElement('button');
      dl.textContent = '📥 Lataa tiedosto';
      dl.onclick = () => downloadMemoryFile(f);
      file.textContent = `💾 Muistissa: ${f.name} (${f.size} B)`;
      file.appendChild(document.createTextNode(' '));
      file.appendChild(dl);
    } else {
      file.textContent = 'Ei asiakirjaa';
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    const del = document.createElement('button');
    del.className = 'secondary';
    del.textContent = 'Poista';
    del.onclick = () => {
      const idx = policies.findIndex((x) => x.id === p.id);
      if (idx !== -1) {
        policies.splice(idx, 1);
        renderPolicies();
      }
    };
    actions.appendChild(del);

    card.appendChild(title);
    card.appendChild(meta);
    card.appendChild(file);
    card.appendChild(actions);
    list.appendChild(card);
  }
}

function renderComparison() {
  const coveredEl = document.getElementById('covered');
  const gapsEl = document.getElementById('gaps');
  if (!coveredEl || !gapsEl) return;
  coveredEl.innerHTML = '';
  gapsEl.innerHTML = '';

  const coveredMap = new Map();
  const homeCoveredMap = new Map();
  for (const p of policies){
    if (p.fileId && memoryFiles.has(p.fileId)){
      const text = memoryFiles.get(p.fileId).content || '';
      const maps = extractCoverage(text);
      for (const [cat, data] of maps.health){
        if (!coveredMap.has(cat)) coveredMap.set(cat, {count:0, entries:[]});
        const agg = coveredMap.get(cat);
        agg.count += data.count;
        for (const e of data.entries){
          agg.entries.push({ company: p.company, fileId: p.fileId, snippet: e.snippet });
        }
      }
      for (const [cat, data] of maps.home){
        if (!homeCoveredMap.has(cat)) homeCoveredMap.set(cat, {count:0, entries:[]});
        const agg = homeCoveredMap.get(cat);
        agg.count += data.count;
        for (const e of data.entries){
          agg.entries.push({ company: p.company, fileId: p.fileId, snippet: e.snippet });
        }
      }
    }
  }
  const {covered, gaps} = compareWithBaseline(coveredMap);
  const homeCovered = []; const homeGaps = [];
  for (const cat of HOME_BASELINE){
    if (homeCoveredMap.has(cat)) homeCovered.push({cat, ...homeCoveredMap.get(cat)});
    else homeGaps.push(cat);
  }

  const paint = (el, items, icon) => {
    if (items.length === 0){
      const d = document.createElement('div');
      d.className = 'empty';
      d.textContent = 'Ei tietoja';
      el.appendChild(d);
      return;
    }
    for (const i of items){
      const d = document.createElement('div');
      d.className = 'policy';
      if (typeof i === 'string'){
        d.textContent = `${icon} ${i}`;
      } else {
        const title = document.createElement('div');
        title.innerHTML = `<strong>${icon} ${i.cat}</strong> · osumia: ${i.count}`;
        d.appendChild(title);
        const list = document.createElement('div');
        list.style.display = 'grid';
        list.style.gap = '6px';
        for (const e of i.entries){
          const s = document.createElement('button');
          s.className = 'file';
          s.style.textAlign = 'left';
          s.style.background = 'transparent';
          s.style.border = '1px solid var(--border)';
          s.style.borderRadius = '10px';
          s.style.padding = '8px 10px';
          s.style.cursor = 'pointer';
          const provider = e.company ? ` (${e.company})` : '';
          s.textContent = `•${provider} … ${e.snippet.slice(0,220)} …`;
          s.onclick = () => openReaderForEntry(e);
          list.appendChild(s);
        }
        d.appendChild(list);
      }
      el.appendChild(d);
    }
  };

  paint(coveredEl, covered, '✅');
  paint(gapsEl, gaps, '⚠️');

  const hc = document.getElementById('home-covered');
  const hg = document.getElementById('home-gaps');
  if (hc && hg){
    hc.innerHTML = ''; hg.innerHTML = '';
    paint(hc, homeCovered, '✅');
    paint(hg, homeGaps, '⚠️');
  }
}

async function handleAdd() {
  const fileInput = $('file');
  const file = fileInput.files && fileInput.files[0];
  const type = $('type').value;
  const company = $('company').value.trim();
  const start = $('start').value;
  const end = $('end').value;
  const premium = $('premium').value;

  if (!company) {
    alert('Syötä vakuutusyhtiön nimi');
    return;
  }

  let fileId = null;
  if (file) {
    try {
      let text = '';
      const isPdf = /\.pdf$/i.test(file.name) || file.type === 'application/pdf';
      if (isPdf && window.pdfjsLib) {
        text = await extractTextFromPdf(file);
      } else {
        text = await file.text();
      }

      fileId = `memory-${Date.now()}-${file.name}`;
      memoryFiles.set(fileId, {
        id: fileId,
        name: file.name,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        content: text
      });
    } catch (e) {
      console.warn('Tiedoston lukeminen epäonnistui:', e);
    }
  }

  const policy = {
    id: String(Date.now()),
    type,
    company,
    start: start || null,
    end: end || null,
    premium: premium ? Number(premium) : null,
    fileId
  };
  policies.unshift(policy);
  clearForm();
  renderPolicies();
  renderComparison();
}

function clearForm() {
  $('file').value = '';
  $('type').value = 'terveys';
  $('company').value = '';
  $('start').value = '';
  $('end').value = '';
  $('premium').value = '';
}

function downloadMemoryFile(f) {
  const blob = new Blob([f.content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = f.name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

$('addBtn').onclick = handleAdd;
$('clearBtn').onclick = clearForm;
const analyzeAllBtn = document.getElementById('analyzeAll');
if (analyzeAllBtn) analyzeAllBtn.onclick = renderComparison;

renderPolicies();
renderComparison();

// --- PDF helpers ---
async function extractTextFromPdf(file){
  const arrayBuffer = await file.arrayBuffer();
  const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++){
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const strings = content.items.map((it) => (it.str || ''));
    // attempt to preserve headings by joining with newlines
    fullText += '\n' + strings.join(' ');
  }
  return fullText;
}

// --- Reader Modal ---
function openReaderForEntry(entry){
  const modal = document.getElementById('readerModal');
  const title = document.getElementById('readerTitle');
  const content = document.getElementById('readerContent');
  if (!modal || !content) return;

  const provider = entry.company ? ` – ${entry.company}` : '';
  title.textContent = `Asiakirjan kohta${provider}`;

  // Build a larger excerpt around the hit (we only stored normalized line; try to find original text)
  const file = entry.fileId ? memoryFiles.get(entry.fileId) : null;
  let full = file?.content || entry.snippet;
  // naive highlight: show paragraph containing snippet
  const idx = full.toLowerCase().indexOf(entry.snippet.toLowerCase().slice(0,40));
  if (idx >= 0){
    const start = Math.max(0, idx - 400);
    const end = Math.min(full.length, idx + 800);
    full = full.slice(start, end);
  }
  content.textContent = full;
  modal.classList.add('show');

  const closeBtn = document.getElementById('closeReader');
  const dlBtn = document.getElementById('downloadSelection');
  if (closeBtn){ closeBtn.onclick = () => modal.classList.remove('show'); }
  if (dlBtn){
    dlBtn.onclick = () => {
      const blob = new Blob([content.textContent || ''], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'kohta.txt';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    };
  }
  modal.onclick = (e) => { if (e.target === modal) modal.classList.remove('show'); };
}

// --- Bionic reading toggle ---
const bionicToggle = document.getElementById('bionicToggle');
if (bionicToggle){
  const applyBionic = (enabled) => {
    document.body.classList.toggle('bionic', enabled);
    // Wrap first syllable/segment of each file snippet for emphasis
    const snippets = document.querySelectorAll('.file');
    for (const el of snippets){
      const txt = el.textContent || '';
      const m = txt.match(/^(•\s*\([^)]*\)\s*…\s*)?(.*)$/);
      const prefix = m && m[1] ? m[1] : '';
      const content = m && m[2] ? m[2] : txt;
      const words = content.split(/(\s+)/);
      for (let i=0;i<words.length;i+=2){
        const w = words[i];
        if (!w) continue;
        const cut = Math.ceil(w.length*0.45);
        words[i] = `<span class=\"br\">${w.slice(0,cut)}</span>${w.slice(cut)}`;
      }
      el.innerHTML = prefix + words.join('');
    }
  };
  applyBionic(bionicToggle.checked);
  bionicToggle.addEventListener('change', (e)=> applyBionic(e.target.checked));
}


