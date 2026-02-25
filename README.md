# 🔬 Bunpou Lens — Japanese Sentence Structure Analyzer

**Bunpou Lens** is a client-side Japanese sentence analyzer that breaks down any sentence into its grammatical components — particles, verb conjugations, adjectives, and more — right in your browser. No server required.

> **文法 (bunpou)** = grammar &nbsp;|&nbsp; **Lens** = see through the structure

## ✨ Features

- **Morphological Analysis** — Tokenizes Japanese text into individual words with part-of-speech tagging
- **Conjugation Detection** — Shows base forms and conjugation types for verbs and adjectives
- **Reading Display** — Provides katakana readings for all tokens
- **Kanji Extraction** — Lists unique kanji characters found in the input
- **Text-to-Speech** — Listen to the sentence with browser-native Japanese TTS
- **100% Client-Side** — No API calls, no server, no data leaves your browser
- **Offline-Capable** — Includes bundled dictionary files for local use

## 🚀 Quick Start

### Option 1: Open Directly

Simply open `index.html` in your browser. The app will load the bundled dictionary files.

> ⚠️ Some browsers block local file loading (CORS). If the tokenizer fails to load, use Option 2.

### Option 2: Local Server (Recommended)

```bash
# Python
python3 -m http.server 8080

# Node.js
npx serve .

# PHP
php -S localhost:8080
```

Then open `http://localhost:8080` in your browser.

## 🏗️ How It Works

Bunpou Lens uses [kuromoji.js](https://github.com/takuyaa/kuromoji.js) — a JavaScript port of the [Kuromoji](https://www.atilika.com/en/kuromoji/) morphological analyzer for Japanese. It uses the MeCab-IPADIC dictionary to tokenize and tag Japanese text.

```
Input:  "昨日はとても寒かったので、家にいました。"

Output: 昨日 → Kata Benda (Noun)
        は   → Partikel (Particle)
        とても → Kata Keterangan (Adverb)
        寒かっ → Kata Sifat (Adjective) [conjugated]
        た   → Kata Bantu (Auxiliary)
        ので  → Partikel (Particle)
        、   → Simbol (Symbol)
        家   → Kata Benda (Noun)
        に   → Partikel (Particle)
        い   → Kata Kerja (Verb)
        まし  → Kata Bantu (Auxiliary)
        た   → Kata Bantu (Auxiliary)
        。   → Simbol (Symbol)
```

## 📁 Project Structure

```
bunpou-lens/
├── index.html          # Main application (single-page)
├── main.js             # Application logic & rendering
├── dict/               # Kuromoji IPADIC dictionary files (gzipped)
│   ├── base.dat.gz
│   ├── cc.dat.gz
│   ├── check.dat.gz
│   ├── tid.dat.gz
│   ├── tid_map.dat.gz
│   ├── tid_pos.dat.gz
│   ├── unk.dat.gz
│   ├── unk_char.dat.gz
│   ├── unk_compat.dat.gz
│   ├── unk_invoke.dat.gz
│   ├── unk_map.dat.gz
│   └── unk_pos.dat.gz
├── vendor/
│   └── kuromoji.js     # Bundled kuromoji.js library
├── LICENSE             # MIT License
└── README.md           # This file
```

## 🎨 Customization

The UI uses [Tailwind CSS](https://tailwindcss.com/) via CDN and [Lucide Icons](https://lucide.dev/). Part-of-speech types are color-coded:

| Type | Japanese | Color |
|------|----------|-------|
| Particle (助詞) | Partikel | 🔴 Red |
| Verb (動詞) | Kata Kerja | 🔵 Blue |
| Noun (名詞) | Kata Benda | ⚪ Gray |
| Adjective (形容詞) | Kata Sifat | 🟡 Yellow |
| Auxiliary (助動詞) | Kata Bantu | 🟣 Purple |

## 🔧 CDN Fallbacks

The app includes CDN fallback URLs for both the kuromoji library and dictionary files. If local files fail to load, it automatically tries:

1. Local files (bundled)
2. jsDelivr CDN
3. unpkg CDN

## 📝 Credits

- **[kuromoji.js](https://github.com/takuyaa/kuromoji.js)** — JavaScript morphological analyzer by [@takuyaa](https://github.com/takuyaa)
- **[MeCab-IPADIC](https://taku910.github.io/mecab/)** — Dictionary data
- **[Tailwind CSS](https://tailwindcss.com/)** — Utility-first CSS framework
- **[Lucide Icons](https://lucide.dev/)** — Beautiful open-source icons
- Originally built for **[Jepang.org](https://jepang.org)** — Indonesian-language Japanese learning platform

## 📄 License

The main project code is licensed under the [MIT License](LICENSE) — Free to use, modify, and distribute.

### Third-Party Licenses

- **kuromoji.js** and its **bundled dictionaries** (`vendor/kuromoji.js`, `dict/*`) are licensed under the [Apache License, Version 2.0](vendor/LICENSE-2.0.txt).
  *Copyright © 2014 Takuya Asano*

---

**Bunpou Lens** by [sepTN](https://jepang.org/tentang-kami/) · Made with ❤️ for Japanese learners everywhere
