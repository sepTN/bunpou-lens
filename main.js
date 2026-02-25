window.addEventListener('error', function (event) {
    document.body.innerHTML = `<div style="padding: 20px; background: red; color: white; font-family: sans-serif; position: absolute; top: 0; left: 0; right: 0; z-index: 9999;">JS ERROR: ${event.message}</div>` + document.body.innerHTML;
});

function refreshIcons() {
    if (window.lucide && typeof window.lucide.createIcons === 'function') {
        window.lucide.createIcons();
    }
}

refreshIcons();

const DIC_PATHS = [
    "./dict/",
    "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/dict/",
    "https://unpkg.com/kuromoji@0.1.2/dict/"
];
const TOKENIZER_TIMEOUT_MS = 15000;
const KUROMOJI_SCRIPT_PATHS = [
    "./vendor/kuromoji.js",
    "https://cdn.jsdelivr.net/npm/kuromoji@0.1.2/build/kuromoji.js",
    "https://unpkg.com/kuromoji@0.1.2/build/kuromoji.js"
];

let tokenizer = null;

const inputEl = document.getElementById('input-text');
const analyzeBtn = document.getElementById('analyze-btn');
const playBtn = document.getElementById('play-btn');
const statusMsg = document.getElementById('status-msg');
const loadingBar = document.getElementById('loading-bar');
const resultsContainer = document.getElementById('results-container');
const tokensGrid = document.getElementById('tokens-grid');
const detailsTable = document.getElementById('details-table');
const sampleBtns = document.querySelectorAll('.sample-btn');
const kanjiSection = document.getElementById('kanji-section');
const kanjiGrid = document.getElementById('kanji-grid');

const SAMPLES = [
    "私は毎日日本語を勉強します。",
    "昨日はとても寒かったので、家で映画を見ていました。",
    "東京駅で新幹線に乗り換えて、京都の有名な神社へ向かいます。"
];

function extractKanji(text) {
    const kanjiRegex = /[\u4E00-\u9FAF]/g;
    const matches = text.match(kanjiRegex);
    return matches ? [...new Set(matches)] : [];
}

const POS_MAP = {
    '名詞': { label: 'Kata Benda', tokenClass: 'type-noun', pillClass: 'pill-noun' },
    '動詞': { label: 'Kata Kerja', tokenClass: 'type-verb', pillClass: 'pill-verb' },
    '助詞': { label: 'Partikel', tokenClass: 'type-particle', pillClass: 'pill-particle' },
    '形容詞': { label: 'Kata Sifat', tokenClass: 'type-adj', pillClass: 'pill-adj' },
    '助動詞': { label: 'Kata Bantu (Aux)', tokenClass: 'type-aux', pillClass: 'pill-aux' },
    '副詞': { label: 'Kata Keterangan', tokenClass: 'type-noun', pillClass: 'pill-noun' },
    '接続詞': { label: 'Kata Sambung', tokenClass: 'type-noun', pillClass: 'pill-noun' },
    '記号': { label: 'Simbol', tokenClass: 'type-noun', pillClass: 'pill-noun' },
    '連体詞': { label: 'Pre-noun', tokenClass: 'type-adj', pillClass: 'pill-adj' }
};

function setStatus(message, isError = false) {
    statusMsg.classList.remove('hidden', 'bg-blue-50', 'text-blue-700', 'bg-red-50', 'text-red-700');
    statusMsg.classList.add(isError ? 'bg-red-50' : 'bg-blue-50');
    statusMsg.classList.add(isError ? 'text-red-700' : 'text-blue-700');
    statusMsg.innerHTML = `
        <i data-lucide="${isError ? 'alert-triangle' : 'loader-2'}" class="w-4 h-4 ${isError ? '' : 'animate-spin'}"></i>
        <span>${message}</span>
    `;
    refreshIcons();
}

function clearStatus() {
    statusMsg.classList.add('hidden');
}

function loadScriptWithTimeout(src, timeoutMs = 8000) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = false;

        const timeoutId = setTimeout(() => {
            script.remove();
            reject(new Error(`Script timeout: ${src}`));
        }, timeoutMs);

        script.onload = () => {
            clearTimeout(timeoutId);
            resolve();
        };
        script.onerror = () => {
            clearTimeout(timeoutId);
            script.remove();
            reject(new Error(`Script load failed: ${src}`));
        };

        document.head.appendChild(script);
    });
}

async function ensureKuromojiLoaded() {
    if (window.kuromoji) return true;

    for (const scriptPath of KUROMOJI_SCRIPT_PATHS) {
        try {
            await loadScriptWithTimeout(scriptPath);
            if (window.kuromoji) {
                return true;
            }
        } catch (err) {
            console.error(err);
        }
    }

    return false;
}

function buildTokenizerWithTimeout(dicPath, timeoutMs) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const timeoutId = setTimeout(() => {
            if (settled) return;
            settled = true;
            reject(new Error(`Tokenizer timeout from ${dicPath}`));
        }, timeoutMs);

        kuromoji.builder({ dicPath }).build((err, builtTokenizer) => {
            if (settled) return;
            settled = true;
            clearTimeout(timeoutId);
            if (err || !builtTokenizer) {
                reject(err || new Error(`Tokenizer build failed from ${dicPath}`));
                return;
            }
            resolve(builtTokenizer);
        });
    });
}

async function initTokenizer() {
    analyzeBtn.disabled = true;
    loadingBar.style.backgroundColor = '#dc2626';

    const kuromojiReady = await ensureKuromojiLoaded();
    if (!kuromojiReady) {
        setStatus('Gagal memuat engine analisis. Coba refresh halaman atau matikan extension pemblokir jaringan.', true);
        loadingBar.style.width = '100%';
        loadingBar.style.backgroundColor = '#b91c1c';
        return;
    }

    for (let i = 0; i < DIC_PATHS.length; i++) {
        const dicPath = DIC_PATHS[i];
        const sourceLabel = i === 0 ? 'lokal' : `cadangan ${i}`;
        const progress = Math.round(((i + 1) / DIC_PATHS.length) * 70) + 20;

        setStatus(`Sedang memuat kamus tokenisasi (${sourceLabel})...`);
        loadingBar.style.width = `${progress}%`;

        try {
            tokenizer = await buildTokenizerWithTimeout(dicPath, TOKENIZER_TIMEOUT_MS);
            clearStatus();
            loadingBar.style.width = '0';
            loadingBar.style.backgroundColor = '#dc2626';
            analyzeBtn.disabled = false;
            return;
        } catch (err) {
            console.error(err);
        }
    }

    setStatus('Gagal memuat kamus dari semua sumber. Coba refresh halaman atau matikan extension pemblokir jaringan.', true);
    loadingBar.style.width = '100%';
    loadingBar.style.backgroundColor = '#b91c1c';
}

function renderTokenCard(token, posData) {
    const card = document.createElement('div');
    card.className = `border-l-4 rounded-r-lg px-4 py-2 shadow-sm border ${posData.tokenClass} flex flex-col justify-center min-w-[80px]`;
    card.innerHTML = `
        <span class="text-xs opacity-60 mb-1 tracking-wider uppercase">${posData.label}</span>
        <span class="text-xl font-bold font-jp leading-none">${token.surface_form}</span>
        <span class="text-xs mt-1 text-stone-500">${token.reading && token.reading !== '*' ? token.reading : '-'}</span>
    `;
    return card;
}

function renderTableRow(token, posData) {
    const tr = document.createElement('tr');
    tr.className = 'hover:bg-stone-50 transition-colors';

    const reading = token.reading && token.reading !== '*' ? token.reading : '-';
    const basicForm = token.basic_form && token.basic_form !== '*' ? token.basic_form : token.surface_form;
    const conjugationInfo = [token.pos_detail_1, token.conjugated_form]
        .filter((part) => part && part !== '*')
        .join(' • ');

    tr.innerHTML = `
        <td class="px-6 py-4 font-jp font-bold text-lg">${token.surface_form}</td>
        <td class="px-6 py-4 text-stone-600">${reading}</td>
        <td class="px-6 py-4 font-jp text-stone-600">${basicForm}</td>
        <td class="px-6 py-4">
            <span class="px-2 py-1 rounded text-xs font-bold ${posData.pillClass}">
                ${posData.label}
            </span>
        </td>
        <td class="px-6 py-4 text-stone-500 text-xs italic">${conjugationInfo || '-'}</td>
    `;

    return tr;
}

function analyze() {
    const text = inputEl.value.trim();
    if (!text || !tokenizer) return;

    const tokens = tokenizer.tokenize(text);

    tokensGrid.innerHTML = '';
    detailsTable.innerHTML = '';
    if (kanjiGrid) kanjiGrid.innerHTML = '';
    resultsContainer.classList.remove('hidden');

    const kanjiList = extractKanji(text);
    if (kanjiList.length > 0) {
        kanjiSection.classList.remove('hidden');
        kanjiList.forEach(k => {
            const a = document.createElement('a');
            a.href = `https://jepang.org/kanji/${k}/`;
            a.target = '_blank';
            a.className = 'w-14 h-14 flex items-center justify-center bg-stone-50 hover:bg-stone-100 hover:text-red-700 text-stone-800 border border-stone-200 hover:border-red-300 rounded-xl transition-all shadow-sm font-jp text-2xl font-bold';
            a.textContent = k;
            kanjiGrid.appendChild(a);
        });
    } else {
        kanjiSection.classList.add('hidden');
    }

    tokens.forEach((token) => {
        if (token.surface_form.trim() === '' && token.pos === '記号') {
            return;
        }

        const posData = POS_MAP[token.pos] || { label: token.pos, tokenClass: 'type-noun', pillClass: 'pill-noun' };

        tokensGrid.appendChild(renderTokenCard(token, posData));
        detailsTable.appendChild(renderTableRow(token, posData));
    });
}

analyzeBtn.addEventListener('click', analyze);

// --- Text-to-Speech (TTS) ---
function playTts() {
    const text = inputEl.value.trim();
    if (!text || !window.speechSynthesis) return;

    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ja-JP';
    utterance.rate = 0.9; // Slightly slower for better clarity

    // Optional: Try to find a good Japanese voice if available
    const voices = window.speechSynthesis.getVoices();
    const jpVoices = voices.filter(v => v.lang.startsWith('ja'));
    if (jpVoices.length > 0) {
        // Prefer natural voices
        const preferred = jpVoices.find(v => v.name.includes('Google') || v.name.includes('Nanami') || v.name.includes('Keiko')) || jpVoices[0];
        utterance.voice = preferred;
    }

    // Visual feedback during playback
    const icon = playBtn.querySelector('i');
    if (icon) {
        icon.setAttribute('data-lucide', 'volume-x');
        icon.classList.add('text-red-500');
        refreshIcons();

        utterance.onend = () => {
            icon.setAttribute('data-lucide', 'volume-2');
            icon.classList.remove('text-red-500');
            refreshIcons();
        };
        utterance.onerror = () => {
            icon.setAttribute('data-lucide', 'volume-2');
            icon.classList.remove('text-red-500');
            refreshIcons();
        };
    }

    window.speechSynthesis.speak(utterance);
}

// Click to play
playBtn?.addEventListener('click', () => {
    if (!window.speechSynthesis) {
        setStatus('Fitur suara tidak didukung di browser ini.', true);
        return;
    }

    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        const icon = playBtn.querySelector('i');
        if (icon) {
            icon.setAttribute('data-lucide', 'volume-2');
            icon.classList.remove('text-red-500');
            refreshIcons();
        }
    } else {
        playTts();
    }
});

// Pre-load voices on some browsers
if (window.speechSynthesis && window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => window.speechSynthesis.getVoices();
}

sampleBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        const index = parseInt(e.currentTarget.dataset.index);
        inputEl.value = SAMPLES[index];
        if (tokenizer && !analyzeBtn.disabled) {
            analyze();
        }
    });
});

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', initTokenizer, { once: true });
} else {
    initTokenizer();
}

// --- Social Sharing ---
function buildBunpouShareText() {
    return `Bingung dengan kalimat bahasa Jepang yang panjang? Saya menggunakan Bunpou Lens di Jepang.org untuk memecah struktur partikel dan konjugasi secara instan! 🔬✨\n\nCoba gratis di sini:\nhttps://jepang.org/labs/bunpou-lens/`;
}

document.getElementById('share-wa-bunpou')?.addEventListener('click', () => {
    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(buildBunpouShareText())}`, '_blank');
});
document.getElementById('share-x-bunpou')?.addEventListener('click', () => {
    window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(buildBunpouShareText())}`, '_blank');
});
document.getElementById('share-fb-bunpou')?.addEventListener('click', () => {
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://jepang.org/labs/bunpou-lens/')}`, '_blank');
});
