import { useState } from "react";

function QuestionTester() {
  const [category, setCategory] = useState("General Knowledge");
  const [difficulty, setDifficulty] = useState("medium");
  const [count, setCount] = useState(5);

  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleGenerate(e) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setQuestions([]);

    try {
      const res = await fetch("http://localhost:5000/api/generate-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category,
          difficulty,
          count: Number(count),
        }),
      });

      if (!res.ok) {
        throw new Error(`Request failed with status ${res.status}`);
      }

      const data = await res.json();

      // Expecting { questions: [...] }
      if (!data.questions || !Array.isArray(data.questions)) {
        throw new Error("Invalid response format (missing questions array).");
      }

      setQuestions(data.questions);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to generate questions.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: 16 }}>
      <h1>Question Generator Tester</h1>

      <form onSubmit={handleGenerate} style={{ marginBottom: 24 }}>
        {/* Category input */}
        <div style={{ marginBottom: 12 }}>
          <label>
            Category:&nbsp;
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. Computer Science"
            />
          </label>
        </div>

        {/* Difficulty select */}
        <div style={{ marginBottom: 12 }}>
          <label>
            Difficulty:&nbsp;
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
            >
              <option value="easy">easy</option>
              <option value="medium">medium</option>
              <option value="hard">hard</option>
            </select>
          </label>
        </div>

        {/* Count input */}
        <div style={{ marginBottom: 12 }}>
          <label>
            Number of Questions:&nbsp;
            <input
              type="number"
              min={1}
              max={20}
              value={count}
              onChange={(e) => setCount(e.target.value)}
            />
          </label>
        </div>

        <button type="submit" disabled={loading}>
          {loading ? "Generating..." : "Generate Questions"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div style={{ color: "red", marginBottom: 16 }}>
          Error: {error}
        </div>
      )}

      {/* Questions display */}
      {questions.length > 0 && (
        <div>
          <h2>Generated Questions</h2>
          {questions.map((q, qi) => (
            <div
              key={qi}
              style={{
                marginBottom: 16,
                padding: 12,
                border: "1px solid #ccc",
                borderRadius: 8,
              }}
            >
              <div style={{ fontSize: 12, color: "#666" }}>
                Category: {q.category} | Difficulty: {q.difficulty}
              </div>
              <div style={{ fontWeight: "bold", margin: "8px 0" }}>
                {qi + 1}. {q.question}
              </div>
              <ol type="A" style={{ paddingLeft: 20 }}>
                {q.options.map((opt, oi) => (
                  <li
                    key={oi}
                    style={{
                      fontWeight:
                        oi === q.correctIndex ? "bold" : "normal",
                    }}
                  >
                    {opt}
                    {oi === q.correctIndex ? "  ← correct" : ""}
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default QuestionTester;
