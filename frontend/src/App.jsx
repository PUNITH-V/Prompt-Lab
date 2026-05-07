import { useState } from "react"

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #0a0a0a; color: #e0e0e0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }
  textarea { width: 100%; background: transparent; border: none; outline: none; color: #e0e0e0; font-size: 13px; font-family: inherit; resize: none; line-height: 1.7; }
  textarea::placeholder { color: #333; }
  input[type=range] { accent-color: #fff; width: 80px; }
  input[type=number] { background: #1a1a1a; border: 0.5px solid #222; border-radius: 6px; color: #888; font-size: 12px; padding: 3px 8px; width: 64px; outline: none; }
  select { background: #1a1a1a; border: 0.5px solid #222; border-radius: 6px; color: #888; font-size: 12px; padding: 3px 8px; outline: none; }
`

function ResultCard({ r, score }) {
  const [show, setShow] = useState(false)
  const map = {
    zero_shot: { label: "Zero-shot", color: "#378ADD" },
    few_shot:  { label: "Few-shot",  color: "#1D9E75" },
    cot:       { label: "Chain of thought", color: "#D85A30" }
  }
  const { label, color } = map[r.technique] || { label: r.technique, color: "#666" }

  return (
    <div style={{ background: "#111", border: "0.5px solid #1f1f1f", borderRadius: 10, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
      <div style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.6px", textTransform: "uppercase", color }}>
        {label}
      </div>

      {score && (
        <div style={{ display: "flex", gap: 8 }}>
          {[["Clarity", score.clarity], ["Complete", score.completeness], ["Reasoning", score.reasoning]].map(([k, v]) => (
            <div key={k} style={{ flex: 1, background: "#0d0d0d", border: "0.5px solid #1a1a1a", borderRadius: 6, padding: "6px 8px", textAlign: "center" }}>
              <div style={{ fontSize: 16, fontWeight: 500, color: v >= 8 ? "#1D9E75" : v >= 6 ? "#D85A30" : "#E24B4A" }}>{v}</div>
              <div style={{ fontSize: 10, color: "#444", marginTop: 2 }}>{k}</div>
            </div>
          ))}
        </div>
      )}

      <p style={{ fontSize: 13, color: "#aaa", lineHeight: 1.75, whiteSpace: "pre-wrap" }}>{r.output}</p>
      <button onClick={() => setShow(!show)}
        style={{ background: "none", border: "none", color: "#444", fontSize: 11, cursor: "pointer", textAlign: "left", padding: 0 }}>
        {show ? "▲ hide prompt" : "▼ see transformed prompt"}
      </button>
      {show && (
        <pre style={{ fontSize: 11, color: "#555", background: "#0d0d0d", border: "0.5px solid #1a1a1a", borderRadius: 6, padding: 10, whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
          {r.transformed_prompt}
        </pre>
      )}
    </div>
  )
}

export default function App() {
  const [prompt, setPrompt]       = useState("")
  const [temp, setTemp]           = useState(0.7)
  const [maxTokens, setMaxTokens] = useState(512)
  const [technique, setTechnique] = useState("all")
  const [results, setResults]     = useState(null)
  const [loading, setLoading]     = useState(false)
  const [scores, setScores]       = useState({})
  const [history, setHistory]     = useState(() => {
    const saved = localStorage.getItem("prompt_history")
    return saved ? JSON.parse(saved) : []
  })

  async function handleSubmit() {
    setLoading(true)
    setScores({})
    const techniques = technique === "all" ? ["zero_shot", "few_shot", "cot"] : [technique]

    const initial = techniques.reduce((acc, t) => ({
      ...acc,
      [t]: { technique: t, transformed_prompt: "", output: "" }
    }), {})
    setResults(Object.values(initial))

    await Promise.all(techniques.map(async (t) => {
      const res = await fetch("https://prompt-lab-7htx.onrender.com/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, temperature: temp, max_tokens: maxTokens, technique: t })
      })

      const reader = res.body.getReader()
      const decoder = new TextDecoder()

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const lines = decoder.decode(value).split("\n").filter(Boolean)
        for (const line of lines) {
          const data = JSON.parse(line)
          if (data.type === "token") {
            setResults(prev => prev.map(r =>
              r.technique === t ? { ...r, output: r.output + data.token } : r
            ))
          }
          if (data.type === "prompt") {
            setResults(prev => prev.map(r =>
              r.technique === t ? { ...r, transformed_prompt: data.transformed_prompt } : r
            ))
          }
        }
      }
    }))

    const newEntry = {
      id: Date.now(),
      prompt,
      technique,
      temperature: temp,
      created_at: new Date().toISOString()
    }
    const updated = [newEntry, ...history].slice(0, 20)
    setHistory(updated)
    localStorage.setItem("prompt_history", JSON.stringify(updated))

    setLoading(false)
  }

  function exportCSV() {
    const headers = ["prompt", "technique", "temperature", "created_at"]
    const rows = history.map(h => [
      `"${h.prompt}"`,
      h.technique,
      h.temperature,
      h.created_at
    ])
    const csv = [headers, ...rows].map(r => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "prompt_history.csv"
    a.click()
  }

  async function scoreResults() {
    if (!results) return
    const newScores = {}
    await Promise.all(results.map(async r => {
      const res = await fetch("https://prompt-lab-7htx.onrender.com/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ output: r.output })
      })
      newScores[r.technique] = await res.json()
    }))
    setScores(newScores)
  }

  return (
    <>
      <style>{STYLES}</style>
      <div style={{ minHeight: "100vh", background: "#0a0a0a", padding: "32px 24px" }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 32, paddingBottom: 20, borderBottom: "0.5px solid #1a1a1a" }}>
            <div style={{ fontSize: 15, fontWeight: 500, color: "#fff", letterSpacing: "-0.3px" }}>
              Prompt Lab <span style={{ color: "#444", fontWeight: 400 }}>/ playground</span>
            </div>
            <div style={{ fontSize: 11, padding: "3px 10px", borderRadius: 4, background: "#111", color: "#555", border: "0.5px solid #1f1f1f" }}>
              v1.0
            </div>
          </div>

          {/* Input Card */}
          <div style={{ background: "#111", border: "0.5px solid #1f1f1f", borderRadius: 10, padding: 16, marginBottom: 16 }}>
            <textarea
              rows={4}
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              placeholder="Ask anything..."
            />
            <div style={{ height: "0.5px", background: "#1a1a1a", margin: "12px 0" }} />
            <div style={{ display: "flex", alignItems: "center", gap: 20, flexWrap: "wrap" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#555" }}>
                temp <span style={{ color: "#888" }}>{temp}</span>
                <input type="range" min={0} max={1} step={0.1} value={temp} onChange={e => setTemp(+e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#555" }}>
                tokens
                <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: "#555" }}>
                technique
                <select value={technique} onChange={e => setTechnique(e.target.value)}>
                  <option value="all">All 3</option>
                  <option value="zero_shot">Zero-shot</option>
                  <option value="few_shot">Few-shot</option>
                  <option value="cot">Chain of thought</option>
                </select>
              </div>
              <button onClick={handleSubmit} disabled={loading || !prompt}
                style={{ marginLeft: "auto", padding: "6px 18px", background: loading || !prompt ? "#1a1a1a" : "#fff", color: loading || !prompt ? "#444" : "#000", border: "none", borderRadius: 6, fontSize: 12, fontWeight: 500, cursor: loading || !prompt ? "not-allowed" : "pointer", transition: "all 0.15s" }}>
                {loading ? "thinking..." : "Generate →"}
              </button>
            </div>
          </div>

          {/* Results */}
          {results && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 12, marginBottom: 8 }}>
              {results.map(r => <ResultCard key={r.technique} r={r} score={scores[r.technique]} />)}
            </div>
          )}

          {/* Score Button */}
          {results && !loading && (
            <div style={{ textAlign: "center", marginBottom: 16, marginTop: 8 }}>
              <button onClick={scoreResults}
                style={{ padding: "6px 18px", background: "#1a1a1a", border: "0.5px solid #222", borderRadius: 6, fontSize: 12, color: "#888", cursor: "pointer" }}>
                Score responses ✦
              </button>
            </div>
          )}

          {/* History */}
          {history.length > 0 && (
            <div style={{ background: "#111", border: "0.5px solid #1f1f1f", borderRadius: 10, overflow: "hidden", marginTop: 8 }}>
              <div style={{ padding: "12px 16px", borderBottom: "0.5px solid #1a1a1a", fontSize: 12, color: "#444", fontWeight: 500, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                Recent
                <button onClick={exportCSV}
                  style={{ fontSize: 11, padding: "3px 10px", background: "#1a1a1a", border: "0.5px solid #222", borderRadius: 5, color: "#666", cursor: "pointer" }}>
                  Export CSV ↓
                </button>
              </div>
              {history.map(h => (
                <div key={h.id} onClick={() => setPrompt(h.prompt)}
                  style={{ display: "grid", gridTemplateColumns: "1fr auto auto auto", gap: 16, padding: "10px 16px", borderBottom: "0.5px solid #141414", alignItems: "center", cursor: "pointer" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#161616"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                  <div style={{ fontSize: 12, color: "#666" }}>{h.prompt}</div>
                  <div style={{ fontSize: 11, color: "#555", background: "#1a1a1a", padding: "2px 8px", borderRadius: 4 }}>{h.technique}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>{h.temperature}</div>
                  <div style={{ fontSize: 11, color: "#444" }}>{h.created_at.slice(11, 16)}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </>
  )
}
