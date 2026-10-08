import { useState, type ChangeEvent } from 'react'
import type {
  MockInterviewSessionResponse,
  MockInterviewStartPayload,
} from '../types/workflow'
import {
  startMockInterviewApi,
  submitMockInterviewAnswerApi,
  finishMockInterviewApi,
} from '../services/api'

interface MockInterviewModalProps {
  isOpen: boolean
  onClose: () => void
  targetCareer: string
  skills: string[]
  projects: string[]
  profileId?: string
  onSessionCompleted?: (session: MockInterviewSessionResponse) => void
}

export function MockInterviewModal({
  isOpen,
  onClose,
  targetCareer,
  skills,
  projects,
  profileId,
  onSessionCompleted,
}: MockInterviewModalProps) {
  const [step, setStep] = useState<'setup' | 'active' | 'evaluated' | 'report'>('setup')
  const [session, setSession] = useState<MockInterviewSessionResponse | null>(null)
  const [currentAnswer, setCurrentAnswer] = useState<string>('')
  const [questionCount, setQuestionCount] = useState<number>(4)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  if (!isOpen) return null

  const handleStartSession = async () => {
    setIsLoading(true)
    setErrorMessage(null)

    const payload: MockInterviewStartPayload = {
      profile_id: profileId,
      target_career: targetCareer || 'Software Engineer',
      skills: skills || [],
      projects: projects || [],
      question_count: questionCount,
    }

    const res = await startMockInterviewApi(payload)
    setIsLoading(false)

    if (res.success && res.data) {
      setSession(res.data)
      setCurrentAnswer('')
      setStep('active')
    } else {
      setErrorMessage(res.error || 'Failed to initialize mock interview session.')
    }
  }

  const handleSubmitAnswer = async () => {
    if (!session || !currentAnswer.trim()) {
      setErrorMessage('Please type an answer before submitting.')
      return
    }

    const currentQ = session.current_question
    if (!currentQ) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await submitMockInterviewAnswerApi({
      session_id: session.session_id,
      question_id: currentQ.id,
      student_answer: currentAnswer.trim(),
    })
    setIsLoading(false)

    if (res.success && res.data) {
      setSession(res.data)
      setStep('evaluated')
    } else {
      setErrorMessage(res.error || 'Failed to evaluate answer.')
    }
  }

  const handleNextQuestion = () => {
    if (!session) return
    setCurrentAnswer('')
    setErrorMessage(null)
    setStep('active')
  }

  const handleFinishInterview = async () => {
    if (!session) return

    setIsLoading(true)
    setErrorMessage(null)

    const res = await finishMockInterviewApi({
      session_id: session.session_id,
    })
    setIsLoading(false)

    if (res.success && res.data) {
      setSession(res.data)
      setStep('report')
      if (onSessionCompleted) {
        onSessionCompleted(res.data)
      }
    } else {
      setErrorMessage(res.error || 'Failed to synthesize final interview report.')
    }
  }

  const lastEvaluatedTurn =
    session && session.turns.length > 0
      ? [...session.turns].reverse().find((t) => t.evaluation)
      : null

  const isLastQuestion =
    session && session.current_question_index >= session.total_questions

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 50,
        backgroundColor: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '720px',
          maxHeight: '90vh',
          backgroundColor: '#090d16',
          border: '1px solid #1e293b',
          borderRadius: '14px',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #1e293b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            backgroundColor: '#0d1527',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '20px' }}>🎙️</span>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 700, color: '#f8fafc' }}>
                AI Mock Interview Simulator
              </div>
              <div style={{ fontSize: '11px', color: '#94a3b8' }}>
                Track: <strong style={{ color: '#fb923c' }}>{targetCareer || 'Software Engineer'}</strong>
                {session && (
                  <span style={{ marginLeft: '8px', color: '#64748b' }}>
                    • Session ID: {session.session_id}
                  </span>
                )}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#94a3b8',
              fontSize: '18px',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '4px',
            }}
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {errorMessage && (
            <div
              style={{
                marginBottom: '14px',
                padding: '10px 14px',
                borderRadius: '6px',
                backgroundColor: 'rgba(239, 68, 68, 0.15)',
                border: '1px solid rgba(239, 68, 68, 0.3)',
                color: '#fca5a5',
                fontSize: '12px',
              }}
            >
              ⚠️ {errorMessage}
            </div>
          )}

          {/* 1. SETUP SCREEN */}
          {step === 'setup' && (
            <div>
              <div style={{ textAlign: 'center', padding: '20px 0 10px' }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>🎯</div>
                <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '6px' }}>
                  Ready to practice for {targetCareer}?
                </div>
                <div style={{ fontSize: '12px', color: '#94a3b8', maxWidth: '480px', margin: '0 auto', lineHeight: 1.5 }}>
                  This interactive session simulates a live technical & behavioral round. Answer questions in writing, receive instant AI critique, and get a comprehensive evaluation report saved directly to the database.
                </div>
              </div>

              {/* Context Summary Cards */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', margin: '20px 0' }}>
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Candidate Skills Tested
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                    {skills && skills.length > 0 ? skills.slice(0, 5).join(', ') : 'Core domain competencies'}
                  </div>
                </div>

                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                    Project Discussion Focus
                  </div>
                  <div style={{ fontSize: '12px', color: '#e2e8f0' }}>
                    {projects && projects.length > 0 ? projects[0] : `${targetCareer} Showcase Architecture`}
                  </div>
                </div>
              </div>

              {/* Round length selector */}
              <div style={{ backgroundColor: '#131b2e', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b', marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#94a3b8', fontWeight: 600, marginBottom: '8px' }}>
                  Select Round Length (Questions)
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {[3, 4, 5].map((cnt) => (
                    <button
                      key={cnt}
                      type="button"
                      onClick={() => setQuestionCount(cnt)}
                      style={{
                        flex: 1,
                        padding: '10px',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 700,
                        backgroundColor: questionCount === cnt ? 'rgba(234, 88, 12, 0.2)' : '#0b1120',
                        color: questionCount === cnt ? '#fb923c' : '#94a3b8',
                        border: questionCount === cnt ? '1px solid #ea580c' : '1px solid #334155',
                        cursor: 'pointer',
                      }}
                    >
                      {cnt} Questions ({cnt * 3} mins est.)
                    </button>
                  ))}
                </div>
              </div>

              {/* Start Button */}
              <button
                type="button"
                onClick={handleStartSession}
                disabled={isLoading}
                style={{
                  width: '100%',
                  padding: '12px 18px',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 800,
                  color: '#ffffff',
                  background: isLoading
                    ? '#334155'
                    : 'linear-gradient(135deg, #ea580c 0%, #f97316 50%, #f59e0b 100%)',
                  border: '1px solid rgba(255, 255, 255, 0.2)',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  boxShadow: '0 4px 14px rgba(234, 88, 12, 0.35)',
                }}
              >
                {isLoading ? '⏳ Preparing Interview Room...' : '🚀 Begin Mock Interview Round'}
              </button>
            </div>
          )}

          {/* 2. ACTIVE QUESTION SCREEN */}
          {step === 'active' && session && session.current_question && (
            <div>
              {/* Progress Tracker */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#94a3b8', marginBottom: '5px' }}>
                  <span>
                    Question <strong>{session.current_question_index + 1}</strong> of {session.total_questions}
                  </span>
                  <span style={{ color: '#fb923c', fontWeight: 700, textTransform: 'uppercase' }}>
                    {session.current_question.category} Round
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', backgroundColor: '#131b2e', borderRadius: '3px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${((session.current_question_index + 1) / session.total_questions) * 100}%`,
                      height: '100%',
                      background: 'linear-gradient(90deg, #ea580c, #f59e0b)',
                      transition: 'width 0.3s ease',
                    }}
                  />
                </div>
              </div>

              {/* Question Card */}
              <div
                style={{
                  backgroundColor: '#131b2e',
                  borderRadius: '10px',
                  border: '1px solid #1e293b',
                  padding: '16px',
                  marginBottom: '16px',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <span style={{ fontSize: '10px', color: '#64748b', fontWeight: 800, textTransform: 'uppercase' }}>
                    AI Interviewer Prompt
                  </span>
                  {session.current_question.difficulty && (
                    <span
                      style={{
                        fontSize: '9px',
                        padding: '2px 7px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(245, 158, 11, 0.15)',
                        color: '#fcd34d',
                        fontWeight: 700,
                      }}
                    >
                      {session.current_question.difficulty}
                    </span>
                  )}
                </div>

                <div style={{ fontSize: '14px', fontWeight: 700, color: '#f8fafc', lineHeight: 1.45, marginBottom: '10px' }}>
                  "{session.current_question.question}"
                </div>

                {session.current_question.context_or_tip && (
                  <div
                    style={{
                      fontSize: '11px',
                      color: '#94a3b8',
                      backgroundColor: 'rgba(0, 0, 0, 0.3)',
                      padding: '8px 10px',
                      borderRadius: '6px',
                      borderLeft: '3px solid #fb923c',
                    }}
                  >
                    💡 <strong>Interviewer Tip:</strong> {session.current_question.context_or_tip}
                  </div>
                )}
              </div>

              {/* Student Answer Textarea */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '11px', color: '#cbd5e1', fontWeight: 600, marginBottom: '6px' }}>
                  Your Response:
                </label>
                <textarea
                  rows={6}
                  value={currentAnswer}
                  onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setCurrentAnswer(e.target.value)}
                  placeholder="Structure your answer clearly. Detail context, actions taken, trade-offs, and measurable outcomes..."
                  style={{
                    width: '100%',
                    backgroundColor: '#131b2e',
                    border: '1px solid #334155',
                    borderRadius: '8px',
                    padding: '12px',
                    fontSize: '13px',
                    color: '#f8fafc',
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                    lineHeight: 1.5,
                  }}
                />
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button
                  type="button"
                  onClick={handleSubmitAnswer}
                  disabled={isLoading || !currentAnswer.trim()}
                  style={{
                    padding: '10px 20px',
                    borderRadius: '7px',
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#ffffff',
                    backgroundColor: isLoading || !currentAnswer.trim() ? '#334155' : '#ea580c',
                    border: 'none',
                    cursor: isLoading || !currentAnswer.trim() ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 10px rgba(234, 88, 12, 0.3)',
                  }}
                >
                  {isLoading ? '⏳ AI Evaluating...' : 'Submit Answer ➔'}
                </button>
              </div>
            </div>
          )}

          {/* 3. EVALUATED TURN SCREEN */}
          {step === 'evaluated' && session && lastEvaluatedTurn && lastEvaluatedTurn.evaluation && (
            <div>
              <div
                style={{
                  padding: '16px',
                  borderRadius: '10px',
                  backgroundColor: '#131b2e',
                  border: '1px solid rgba(16, 185, 129, 0.35)',
                  marginBottom: '18px',
                }}
              >
                {/* Score Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '16px' }}>⭐</span>
                    <span style={{ fontSize: '15px', fontWeight: 800, color: '#34d399' }}>
                      Score: {lastEvaluatedTurn.evaluation.score} / 10
                    </span>
                  </div>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      padding: '3px 8px',
                      borderRadius: '4px',
                      backgroundColor: 'rgba(16, 185, 129, 0.15)',
                      color: '#a7f3d0',
                    }}
                  >
                    {lastEvaluatedTurn.evaluation.rating}
                  </span>
                </div>

                {/* Question and answer recap */}
                <div style={{ fontSize: '11px', color: '#94a3b8', marginBottom: '4px' }}>
                  Q: <strong style={{ color: '#f8fafc' }}>{lastEvaluatedTurn.question}</strong>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.4, fontStyle: 'italic', marginBottom: '12px' }}>
                  "{lastEvaluatedTurn.student_answer}"
                </div>

                {/* Constructive feedback */}
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5, marginBottom: '12px' }}>
                  {lastEvaluatedTurn.evaluation.feedback}
                </div>

                {/* Strengths & Tips */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '12px' }}>
                  <div style={{ backgroundColor: '#0b1120', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#34d399', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      ✓ What Went Well
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#86efac', lineHeight: 1.35 }}>
                      {lastEvaluatedTurn.evaluation.strengths.map((s, idx) => (
                        <li key={idx}>{s}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={{ backgroundColor: '#0b1120', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#fbbf24', fontWeight: 700, textTransform: 'uppercase', marginBottom: '4px' }}>
                      ⚡ What to Improve
                    </div>
                    <ul style={{ margin: 0, paddingLeft: '14px', fontSize: '11px', color: '#fcd34d', lineHeight: 1.35 }}>
                      {lastEvaluatedTurn.evaluation.improvement_tips.map((t, idx) => (
                        <li key={idx}>{t}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Model response preview */}
                {lastEvaluatedTurn.evaluation.sample_better_answer && (
                  <div style={{ backgroundColor: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.25)', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '3px' }}>
                      📖 Exemplary Model Response
                    </div>
                    <div style={{ fontSize: '11px', color: '#bae6fd', lineHeight: 1.45 }}>
                      {lastEvaluatedTurn.evaluation.sample_better_answer}
                    </div>
                  </div>
                )}
              </div>

              {/* Next Question / Finish Action */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                {isLastQuestion ? (
                  <button
                    type="button"
                    onClick={handleFinishInterview}
                    disabled={isLoading}
                    style={{
                      padding: '11px 22px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      border: 'none',
                      cursor: isLoading ? 'not-allowed' : 'pointer',
                      boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
                    }}
                  >
                    {isLoading ? '⏳ Synthesizing Final Report...' : '🏁 Finish & Generate Final Feedback ➔'}
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleNextQuestion}
                    style={{
                      padding: '11px 22px',
                      borderRadius: '8px',
                      fontSize: '13px',
                      fontWeight: 800,
                      color: '#ffffff',
                      background: 'linear-gradient(135deg, #ea580c 0%, #f97316 100%)',
                      border: 'none',
                      cursor: 'pointer',
                      boxShadow: '0 4px 12px rgba(234, 88, 12, 0.3)',
                    }}
                  >
                    Next Question ({session.current_question_index + 1} / {session.total_questions}) ➔
                  </button>
                )}
              </div>
            </div>
          )}

          {/* 4. FINAL FEEDBACK REPORT SCREEN */}
          {step === 'report' && session && session.final_feedback && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Overall Score Header */}
              <div
                style={{
                  padding: '18px',
                  borderRadius: '10px',
                  backgroundColor: '#131b2e',
                  border: '1px solid #1e293b',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div>
                  <div style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 700, marginBottom: '4px' }}>
                    Final Mock Interview Evaluation
                  </div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: '#f8fafc', marginBottom: '4px' }}>
                    {session.final_feedback.readiness_rating}
                  </div>
                  <div style={{ fontSize: '11px', color: '#34d399', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>💾</span> Persisted in Database (Session ID: <code>{session.session_id}</code>)
                  </div>
                </div>

                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    backgroundColor: 'rgba(16, 185, 129, 0.15)',
                    border: '2px solid #10b981',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <span style={{ fontSize: '20px', fontWeight: 900, color: '#34d399', lineHeight: 1 }}>
                    {session.final_feedback.overall_score}
                  </span>
                  <span style={{ fontSize: '10px', color: '#94a3b8' }}>/ 10</span>
                </div>
              </div>

              {/* Executive Summary */}
              <div style={{ backgroundColor: '#131b2e', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ fontSize: '10px', color: '#fb923c', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                  Executive Summary
                </div>
                <div style={{ fontSize: '12px', color: '#e2e8f0', lineHeight: 1.5 }}>
                  {session.final_feedback.executive_summary}
                </div>
              </div>

              {/* 3 Core Dimensions Matrix */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                {/* Communication */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#60a5fa' }}>
                      🗣️ Communication
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#93c5fd' }}>
                      {session.final_feedback.communication.score}/10
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {session.final_feedback.communication.summary}
                  </div>
                </div>

                {/* Technical Knowledge */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#a78bfa' }}>
                      💻 Tech Knowledge
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#c4b5fd' }}>
                      {session.final_feedback.technical_knowledge.score}/10
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {session.final_feedback.technical_knowledge.summary}
                  </div>
                </div>

                {/* Answer Quality */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#34d399' }}>
                      📝 Answer Quality
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 800, color: '#86efac' }}>
                      {session.final_feedback.answer_quality.score}/10
                    </span>
                  </div>
                  <div style={{ fontSize: '10px', color: '#cbd5e1', lineHeight: 1.4 }}>
                    {session.final_feedback.answer_quality.summary}
                  </div>
                </div>
              </div>

              {/* Confidence Indicators */}
              <div style={{ backgroundColor: '#131b2e', padding: '14px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontSize: '11px', fontWeight: 700, color: '#fbbf24', textTransform: 'uppercase' }}>
                    🎯 Observable Confidence & Articulation Indicators
                  </div>
                  <span style={{ fontSize: '11px', fontWeight: 800, color: '#fde68a' }}>
                    {session.final_feedback.confidence_indicators.score} / 10
                  </span>
                </div>
                <div style={{ fontSize: '11px', color: '#cbd5e1', lineHeight: 1.45, marginBottom: '8px' }}>
                  <strong>Articulation:</strong> {session.final_feedback.confidence_indicators.articulation_clarity}.{' '}
                  <strong>Conviction:</strong> {session.final_feedback.confidence_indicators.assertiveness_level}.
                </div>
                {session.final_feedback.confidence_indicators.observable_signals && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {session.final_feedback.confidence_indicators.observable_signals.map((sig, idx) => (
                      <span key={idx} style={{ fontSize: '10px', padding: '2px 8px', borderRadius: '4px', backgroundColor: '#0b1120', color: '#fef08a' }}>
                        • {sig}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Knowledge Gaps & Improvement Suggestions */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                {/* Knowledge Gaps */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#f87171', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    ⚠️ Knowledge Gaps Identified
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#fca5a5', lineHeight: 1.45 }}>
                    {session.final_feedback.knowledge_gaps.map((gap, idx) => (
                      <li key={idx}>{gap}</li>
                    ))}
                  </ul>
                </div>

                {/* Improvement Suggestions */}
                <div style={{ backgroundColor: '#131b2e', padding: '12px', borderRadius: '8px', border: '1px solid #1e293b' }}>
                  <div style={{ fontSize: '10px', color: '#38bdf8', fontWeight: 700, textTransform: 'uppercase', marginBottom: '6px' }}>
                    🚀 Actionable Improvement Suggestions
                  </div>
                  <ul style={{ margin: 0, paddingLeft: '16px', fontSize: '11px', color: '#bae6fd', lineHeight: 1.45 }}>
                    {session.final_feedback.improvement_suggestions.map((tip, idx) => (
                      <li key={idx}>{tip}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Strict Non-Clinical / Medical Disclaimer Banner */}
              <div
                style={{
                  padding: '10px 14px',
                  borderRadius: '6px',
                  backgroundColor: 'rgba(148, 163, 184, 0.08)',
                  border: '1px solid rgba(148, 163, 184, 0.2)',
                  fontSize: '10px',
                  color: '#94a3b8',
                  lineHeight: 1.4,
                  textAlign: 'center',
                }}
              >
                🔒 <strong>Non-Clinical Professional Assessment Notice:</strong> {session.final_feedback.disclaimer}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  onClick={() => {
                    setSession(null)
                    setStep('setup')
                  }}
                  style={{
                    padding: '9px 16px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#1e293b',
                    color: '#f8fafc',
                    border: '1px solid #334155',
                    cursor: 'pointer',
                  }}
                >
                  Start New Session
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: '9px 18px',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 700,
                    backgroundColor: '#ea580c',
                    color: '#ffffff',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
