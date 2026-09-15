# 🇯🇵 NihonDictate (日本語ディクテーション)
### Smart Japanese-Vietnamese YouTube Dictation & Flashcard Learning Application

[🇻🇳 Tiếng Việt](README.md) • [🇬🇧 English](README.en.md)

[![React](https://img.shields.io/badge/React-19-61dafb.svg?style=flat-square&logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-6-646cff.svg?style=flat-square&logo=vite)](https://vitejs.dev/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-v4-38bdf8.svg?style=flat-square&logo=tailwindcss)](https://tailwindcss.com/)
[![Express](https://img.shields.io/badge/Express-4.x-000000.svg?style=flat-square&logo=express)](https://expressjs.com/)
[![License](https://img.shields.io/badge/license-MIT-green.svg?style=flat-square)](LICENSE)

---

## 📖 Overview

**NihonDictate** is an intelligent Japanese learning web application designed for intensive **Dictation (Listening & Typing)** and **Shadowing (Speaking Reflex)** training directly from any YouTube video (NHK News, Anime, Dramas, Vlogs, J-Pop songs, etc.).

The app automatically extracts Japanese subtitles, parses morphological Furigana/Hiragana readings using Kuromoji, translates sentences into Vietnamese, provides precise sentence-by-sentence auto-pause with zero audio clipping, and features a one-click Flashcard maker ready for **Anki, Quizlet, and MochiMochi**.

---

## ✨ Key Features

### 1. 🎥 YouTube Integration & Precise Sentence Segmentation
- **Universal YouTube Input**: Paste any YouTube link/video ID or select from cached/sample lessons.
- **Smart Sentence Splitting**: Automatically splits transcripts at natural punctuation boundaries (`。`) and conversational pauses.
- **Safe Gap Boundary Shift (`~0.22s`)**: Intelligently offsets audio segment endpoints to ensure crystal-clear pronunciations without bleeding into the next sentence.
- **Precision Auto-Pause**: Automatically pauses playback at the end of each sentence so you can focus on typing.

### 2. ⌨️ Professional Japanese Dictation Interface
- **Native Hiragana Input (Wanakana)**: Type Romaji and watch it smoothly convert into Hiragana in real time. Perfect caret and IME handling without jumpy backspaces.
- **Visual Character-by-Character Diff**:
  - 🟢 **Green**: 100% correct characters.
  - 🔴 **Red**: Incorrect or mismatched characters.
  - ⚪ **Underlined Grey**: Missing characters.
- **Flexible Practice Modes**:
  - *Strict Mode*: Require 100% typing accuracy or explicit answer reveal before moving forward.
  - *Free Practice Mode*: Click and jump freely to any sentence in the list.

### 3. ⭐ Quick Flashcard Bar (Under Video Player)
- **Instant Creation via Text Selection**: Highlight any word, Kanji compound, or phrase from the subtitles or lesson card to summon the gold Quick Flashcard bar below the video.
- **Automatic Furigana & Translation**: Automatically looks up Furigana/Hiragana readings and calls translation APIs for the selected text.
- **Editable Inputs**: Directly refine the Japanese term or reading before saving.
- **Context Preservation**: Automatically stores the surrounding sentence, timestamp, and lesson title.

### 4. 🗃️ Flashcard Manager & Multi-Platform Export
- Centralized modal to manage all saved vocabulary cards.
- Search and filter by lesson name or keyword.
- Interactive flip-card review mode.
- **1-Click Export**:
  - 📦 **Anki (.txt)**: Standard tab-separated format with Front, Furigana Reading, Vietnamese Meaning, Context Sentence, and Audio Timestamps ready for instant deck import.
  - 📝 **Quizlet (.txt / CSV)**: Clean format ready for Quizlet sets or MochiMochi.
  - 💾 **JSON Backup**: Import and export your cards to/from LocalStorage.

### 5. 📑 Long Video Support & Pagination
- Server supports extracting up to **2,000 sentences** (ideal for 1–2 hour long lectures or audiobooks).
- Sentence list automatically chunks into **50-sentence parts** (`Part 1: 1-50`, `Part 2: 51-100`, etc.) to guarantee buttery-smooth UI performance and milestone tracking.

### 6. 🗄️ Server Lesson Cache Management
- Header dropdown provides quick access to all analyzed and cached videos.
- Instant lesson switching without waiting for reprocessing.
- Delete lessons from server cache or restore deleted lessons directly from the UI.

### 7. 🗣️ Shadowing Mode & Subtitles Script Overview
- **Shadowing**: Record your voice through the microphone and play back alongside the native speaker for instant acoustic comparison.
- **Subtitles Tab**: Full bilingual Japanese-Vietnamese transcript with ruby Furigana for comprehensive reading practice.

---

## ⌨️ Keyboard Shortcuts

| Shortcut | Description |
| :--- | :--- |
| <kbd>Ctrl</kbd> + <kbd>Space</kbd> | Replay current sentence |
| <kbd>Enter</kbd> | Check typed answer |
| <kbd>Alt</kbd> + <kbd>N</kbd> | Move to next sentence |
| <kbd>Alt</kbd> + <kbd>H</kbd> | Toggle or fetch instant Vietnamese translation |
| <kbd>Alt</kbd> + <kbd>F</kbd> | Toggle Furigana display |
| <kbd>Alt</kbd> + <kbd>L</kbd> | Toggle sentence repeat loop |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) version **18.x** or higher.
- `npm` package manager (bundled with Node.js).

### Method 1: 1-Click Launch on Windows
Simply double-click:
```cmd
start.bat
```
*(This batch file verifies dependencies and launches both backend and frontend concurrently).*

### Method 2: Command Line Setup

1. **Clone the repository:**
```bash
git clone https://github.com/DWildShace/NihonDictate.git
cd NihonDictate
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start both backend and frontend development servers:**
```bash
npm run dev
```

> Alternatively, run servers separately:
> - Backend: `npm run dev:backend` (Port `http://localhost:3001`)
> - Frontend: `npm run dev:frontend` (Port `http://localhost:5173`)

4. **Open your browser:**
Navigate to: [http://localhost:5173](http://localhost:5173)

---

## 🏗️ Architecture & Project Structure

```
NihonDictate/
├── server/                         # Express Backend Service
│   ├── cache/                      # Cached subtitle and tokenized JSON files
│   ├── services/
│   │   ├── japaneseTokenizer.js    # Morphological analysis & Furigana (Kuromoji)
│   │   ├── subtitleNormalizer.js   # Sentence segmentation & Safe Gap time alignment
│   │   └── youtubeSubtitles.js     # Transcript extraction & machine translation
│   └── index.js                    # API endpoints (Extract, Cache, Health)
├── src/                            # React Frontend Application
│   ├── components/
│   │   ├── DictationCard.jsx       # Main typing card, visual diff, keyboard shortcuts
│   │   ├── QuickFlashcardBar.jsx   # Dedicated selection bar under video player
│   │   ├── FlashcardModal.jsx      # Flashcard library, review flipper & Anki export
│   │   ├── Header.jsx              # URL loader, lessons menu & cache manager
│   │   ├── SentenceList.jsx        # Chunked sentence navigation (50 items/part)
│   │   ├── ShadowingTab.jsx        # Voice recorder for pronunciation practice
│   │   ├── SubtitlesTab.jsx        # Full dual-language transcript viewer
│   │   └── VideoPlayer.jsx         # YouTube IFrame API with synchronized playback
│   ├── utils/
│   │   ├── japaneseDiff.js         # Japanese character comparison algorithm
│   │   ├── relativeTimestamps.js   # Audio boundary calculations
│   │   └── storage.js              # LocalStorage wrapper (Progress & Flashcards)
│   ├── App.jsx                     # Root application container & global event routing
│   └── main.jsx                    # Application entry point
├── start.bat                       # 1-click launch script for Windows
└── package.json                    # Project configuration and scripts
```

### Core Technologies:
- **Frontend**: React 19, Vite 6, Tailwind CSS v4, Lucide React, Wanakana.
- **Backend**: Node.js, Express 4, `youtube-transcript`, `kuromoji`, Google/MyMemory Translation API.
- **Media**: YouTube IFrame Player API.

---

## 📝 License

This project is open source and available under the [MIT License](LICENSE).
Feel free to use, modify, and distribute for personal learning and non-commercial purposes.
