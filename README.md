# 🧠 Prompt Lab

> A developer playground for comparing LLM prompting techniques side by side — built with FastAPI, LangChain, and React.

---
## 🚀 Live Demo

- **Frontend:** [Vercel](https://prompt-lab-delta-two.vercel.app/)
- **Backend API:** [Render](https://prompt-lab-7htx.onrender.com/)
- **API Docs:** [Swagger UI](https://prompt-lab-7htx.onrender.com/docs)

---
## What is this?

Prompt Lab lets you write a prompt once and instantly see how three different prompting strategies affect the LLM's response — in real time, with streaming output, quality scoring, and persistent history.

Built as a portfolio project to demonstrate practical skills in generative AI engineering, including prompt design, LangChain orchestration, async FastAPI, and modern React.

---

## Features

- **3 prompting techniques** — Zero-shot, Few-shot, Chain-of-thought
- **Side-by-side comparison** — all 3 responses generated in parallel
- **Streaming output** — token-by-token rendering via Server-Sent Events
- **LLM-as-judge scoring** — automatic quality rating across Clarity, Completeness, and Reasoning
- **Persistent history** — every prompt + response saved to SQLite, clickable to reload
- **CSV export** — download full prompt history
- **Configurable settings** — temperature and max tokens per request
- **Premium dark UI** — minimal, developer-focused design

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React + Vite |
| Backend | FastAPI + Uvicorn |
| AI Orchestration | LangChain + LangChain-Groq |
| LLM Provider | Groq (llama-3.3-70b-versatile) |
| Database | SQLite via SQLAlchemy |
| Styling | Inline CSS (dark minimal theme) |

---

## Architecture

```
React Frontend
      │
      │  POST /stream   POST /generate   GET /history   POST /score
      ▼
FastAPI Backend
      │
      ├── templates.py     ← prompt builders (zero_shot, few_shot, cot)
      ├── schemas.py       ← Pydantic request/response models
      ├── database.py      ← SQLAlchemy models + SQLite engine
      │
      ▼
LangChain + Groq LLM
```

---

## Project Structure

```
prompt-lab/
├── backend/
│   ├── main.py          # FastAPI app + all endpoints
│   ├── schemas.py       # Pydantic models
│   ├── templates.py     # Prompt template functions
│   ├── database.py      # SQLite + SQLAlchemy setup
│   ├── .env             # GROQ_API_KEY (not committed)
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   └── App.jsx      # Full React app
│   └── package.json
└── README.md
```

---

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- A free [Groq API key](https://groq.com)

### Backend Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux

pip install fastapi uvicorn langchain langchain-groq sqlalchemy python-dotenv
```

Create a `.env` file in `/backend`:
```
GROQ_API_KEY=your_key_here
```

Start the server:
```bash
uvicorn main:app --reload
```

API docs available at: `http://localhost:8000/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

App runs at: `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| POST | `/generate` | Single technique, full response |
| POST | `/stream` | Single technique, streaming response |
| POST | `/score` | LLM-as-judge quality scoring |
| GET | `/history` | Last 20 prompt history records |

---

## Prompting Techniques

**Zero-shot** — Raw prompt passed directly to the LLM with no examples or instructions. Tests the model's baseline knowledge.

**Few-shot** — Prompt is prepended with 2-3 curated Q&A examples to guide the model's response format and style.

**Chain-of-thought** — Prompt appends "Let's think through this step by step" to encourage explicit reasoning before answering.

---

## Design Decisions

**Why LangChain?** Using LangChain's `PromptTemplate` and LCEL chain syntax (rather than raw API calls) demonstrates production-grade AI orchestration patterns used in real teams.

**Why Groq?** Free tier, extremely fast inference, and drop-in LangChain compatibility — ideal for a portfolio project with real-time streaming.

**Why SQLite?** Zero-config persistent storage for prompt history. Easily swappable for PostgreSQL in production.

**Why streaming?** `StreamingResponse` + `astream()` demonstrates async Python and real-time UX — a common pattern in production AI applications.

**Why LLM-as-judge?** Automatic response scoring using a second LLM call is a widely-used evaluation pattern in GenAI systems. Including it shows awareness of AI evaluation beyond just generation.

---

## What I Learned

- Designing and comparing prompt templates across techniques
- LangChain LCEL chain composition and async streaming
- FastAPI async endpoints with `StreamingResponse`
- Reading streamed NDJSON in React using `ReadableStream`
- SQLAlchemy ORM for lightweight persistence
- LLM-as-judge evaluation patterns

---

## Author

PUNITH-V

---

## License

MIT
