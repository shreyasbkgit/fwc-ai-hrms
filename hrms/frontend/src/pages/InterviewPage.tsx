import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import "./InterviewPage.css";

function InterviewPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const appRes = await fetch("/api/jobs/applications");
        const appData = await appRes.json();
        const app = appData.applications.find((a: any) => a.id === id);

        const res = await fetch(`/api/interview/${app.jobId}`);
        const data = await res.json();

        if (data.success) {
          setQuestions(data.questions);
          setAnswers(new Array(data.questions.length).fill(""));
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    loadQuestions();
  }, [id]);

  const handleChange = (index: number, value: string) => {
    const updated = [...answers];
    updated[index] = value;
    setAnswers(updated);
  };

  const submitInterview = async () => {
    const unanswered = answers.filter((a) => a.trim() === "").length;
    if (unanswered > 0) {
      if (!confirm(`${unanswered} question(s) unanswered. Submit anyway?`))
        return;
    }
    try {
      setSubmitting(true);
      const response = await fetch("/api/interview/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ applicationId: id, answers }),
      });
      const data = await response.json();
      if (data.success) {
        alert(
          `Interview submitted!\n\nDecision: ${data.decision}\nFinal Score: ${data.finalScore?.toFixed(1)}`,
        );
        navigate("/candidate");
      }
    } catch {
      alert("Interview submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const answered = answers.filter((a) => a.trim() !== "").length;
  const progress =
    questions.length > 0 ? (answered / questions.length) * 100 : 0;

  if (loading) {
    return (
      <div className="interview-loading">Loading interview questions…</div>
    );
  }

  return (
    <div className="interview-page">
      <div className="interview-inner">
        <div className="interview-header">
          <h1>Technical Interview</h1>
          <p>
            Answer all questions thoughtfully. Your responses will be evaluated
            by AI.
          </p>
          <div className="progress-wrap">
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="progress-label">
              {answered} / {questions.length} answered
            </span>
          </div>
        </div>

        {questions.map((question, index) => (
          <div key={index} className="question-card">
            <div className="question-number">
              Question {index + 1} of {questions.length}
            </div>
            <div className="question-text">{question}</div>
            <textarea
              className="answer-textarea"
              rows={5}
              value={answers[index]}
              onChange={(e) => handleChange(index, e.target.value)}
              placeholder="Type your answer here…"
            />
          </div>
        ))}

        <div className="submit-section">
          <span className="submit-note">
            {answered < questions.length
              ? `${questions.length - answered} question(s) remaining`
              : "All questions answered ✓"}
          </span>
          <button
            className="submit-btn"
            onClick={submitInterview}
            disabled={submitting}
          >
            {submitting ? "Evaluating…" : "Submit Interview →"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default InterviewPage;
