import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

const LEVELS = [
  { id: 'Beginner', label: 'Beginner', desc: 'Starting from scratch', icon: '🌱' },
  { id: 'Intermediate', label: 'Intermediate', desc: 'I know the basics', icon: '🔥' },
  { id: 'Advanced', label: 'Advanced', desc: 'I want to go deep', icon: '⚡' },
  { id: 'Expert', label: 'Expert', desc: 'Mastery level', icon: '🚀' },
]

export default function Home() {
  const [step, setStep] = useState('topic')
  const [topic, setTopic] = useState('')
  const [level, setLevel] = useState('')
  const [questions, setQuestions] = useState([])
  const [answers, setAnswers] = useState({})
  const [loadingQuestions, setLoadingQuestions] = useState(false)
  const [course, setCourse] = useState(null)
  const [videos, setVideos] = useState({})
  const [loadingStatus, setLoadingStatus] = useState('')
  const [activeSection, setActiveSection] = useState(0)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [savedCourses, setSavedCourses] = useState([])
  const [showSaved, setShowSaved] = useState(false)
  const chatEndRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('savedCourses')
    if (saved) setSavedCourses(JSON.parse(saved))
  }, [])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  const handleTopicSubmit = async () => {
    if (!topic.trim()) return
    setStep('level')
  }

  const handleLevelSelect = async (selectedLevel) => {
    setLevel(selectedLevel)
    setLoadingQuestions(true)
    setStep('questions')
    try {
      const res = await fetch('/api/get-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: section.youtubeQuery, usedVideoIds: Object.values(videoResults).map(v => v.videoId) })
      })
      const data = await res.json()
      setQuestions(data.questions || [])
    } catch (err) {
      console.error(err)
    }
    setLoadingQuestions(false)
  }

  const handleBuildCourse = async () => {
    setStep('loading')
    setLoadingStatus('Designing your personalised curriculum...')

    try {
      const courseRes = await fetch('/api/generate-course', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, level, answers })
      })
      const courseData = await courseRes.json()
      setCourse(courseData)

      setLoadingStatus('Searching YouTube for the best videos...')

      const videoResults = {}
      for (let i = 0; i < courseData.sections.length; i++) {
        const section = courseData.sections[i]
        setLoadingStatus(`Finding video for: ${section.title}...`)
        try {
          const videoRes = await fetch('/api/search-video', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ query: section.youtubeQuery })
          })
          const videoData = await videoRes.json()
          if (videoData.videoId) {
            videoResults[i] = videoData
          }
        } catch (e) {
          console.error(`Video search failed for section ${i}`)
        }
      }

      setVideos(videoResults)
      setLoadingStatus('Your course is ready!')

      const newCourse = { ...courseData, videos: videoResults, topic, level, id: Date.now() }
      const updated = [newCourse, ...savedCourses.slice(0, 9)]
      setSavedCourses(updated)
      localStorage.setItem('savedCourses', JSON.stringify(updated))

      setTimeout(() => setStep('course'), 500)
    } catch (err) {
      console.error(err)
      setLoadingStatus('Something went wrong. Please try again.')
    }
  }

  const loadSavedCourse = (saved) => {
    setCourse(saved)
    setVideos(saved.videos || {})
    setTopic(saved.topic)
    setLevel(saved.level)
    setActiveSection(0)
    setChatMessages([])
    setShowSaved(false)
    setStep('course')
  }

  const sendChat = async () => {
    if (!chatInput.trim() || chatLoading) return
    const userMsg = { role: 'user', content: chatInput }
    const newMessages = [...chatMessages, userMsg]
    setChatMessages(newMessages)
    setChatInput('')
    setChatLoading(true)

    try {
      const section = course.sections[activeSection]
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          courseTitle: course.title,
          sectionTitle: section.title,
          sectionDescription: section.description
        })
      })
      const data = await res.json()
      setChatMessages([...newMessages, { role: 'assistant', content: data.message }])
    } catch (err) {
      console.error(err)
    }
    setChatLoading(false)
  }

  const resetApp = () => {
    setStep('topic')
    setTopic('')
    setLevel('')
    setQuestions([])
    setAnswers({})
    setCourse(null)
    setVideos({})
    setActiveSection(0)
    setChatMessages([])
    setShowChat(false)
  }

  return (
    <>
      <Head>
        <title>AI Learning Platform</title>
        <meta name="description" content="Build personalised courses with AI" />
      </Head>

      <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

        {/* HEADER */}
        <header style={{
          borderBottom: '1px solid var(--border)',
          padding: '0 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '60px',
          background: 'var(--surface)',
          position: 'sticky',
          top: 0,
          zIndex: 50
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }} onClick={resetApp}>
            <div style={{
              width: 32, height: 32, background: 'var(--accent)',
              borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16
            }}>✦</div>
            <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--white)' }}>SoothSeyer</span>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            {savedCourses.length > 0 && (
              <button className="btn-secondary" onClick={() => setShowSaved(!showSaved)} style={{ fontSize: 13 }}>
                📚 My Courses ({savedCourses.length})
              </button>
            )}
            {step === 'course' && (
              <button className="btn-secondary" onClick={resetApp} style={{ fontSize: 13 }}>
                + New Course
              </button>
            )}
          </div>
        </header>

        {/* SAVED COURSES DROPDOWN */}
        {showSaved && (
          <div style={{
            position: 'fixed', top: 68, right: 32, width: 320,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 12, zIndex: 100, padding: 16,
            boxShadow: '0 16px 48px rgba(0,0,0,0.4)'
          }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Saved Courses</div>
            {savedCourses.map((sc, i) => (
              <div key={sc.id || i}
                onClick={() => loadSavedCourse(sc)}
                style={{
                  padding: '10px 12px', borderRadius: 8, cursor: 'pointer',
                  marginBottom: 6, background: 'var(--surface2)',
                  border: '1px solid var(--border)', transition: 'all 0.2s'
                }}
                onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--accent)'}
                onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
              >
                <div style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>{sc.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>{sc.level} · {sc.estimatedHours}h</div>
              </div>
            ))}
          </div>
        )}

        {/* STEP: TOPIC */}
        {step === 'topic' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
            padding: '40px 20px', animation: 'fadeUp 0.5s ease'
          }}>
            <div style={{
              width: 64, height: 64, background: 'var(--accent)',
              borderRadius: 16, display: 'flex', alignItems: 'center',
              justifyContent: 'center', fontSize: 28, marginBottom: 24,
              boxShadow: '0 0 40px rgba(108,99,255,0.4)'
            }}>✦</div>
            <h1 style={{ fontSize: 36, fontWeight: 800, color: 'var(--white)', marginBottom: 10, textAlign: 'center' }}>
              What do you want to learn?
            </h1>
            <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 16, textAlign: 'center' }}>
              Type anything — AI builds you a personalised course in under 2 minutes
            </p>
            <div style={{ width: '100%', maxWidth: 520 }}>
              <input
                className="input-field"
                style={{ fontSize: 17, padding: '18px 22px', marginBottom: 16 }}
                placeholder="e.g. Python, Negotiation, Machine Learning, Investing..."
                value={topic}
                onChange={e => setTopic(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && topic.trim() && handleTopicSubmit()}
                autoFocus
              />
              <button
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px' }}
                onClick={handleTopicSubmit}
                disabled={!topic.trim()}
              >
                Build My Course →
              </button>
            </div>
            <div style={{ marginTop: 48, display: 'flex', gap: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
              {['Python for Data Science', 'Executive Presence', 'Prompt Engineering', 'Financial Modelling', 'Public Speaking'].map(s => (
                <button key={s}
                  onClick={() => { setTopic(s); handleTopicSubmit() }}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    color: 'var(--muted)', padding: '8px 16px', borderRadius: 20,
                    fontSize: 13, cursor: 'pointer', transition: 'all 0.2s'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--muted)' }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: LEVEL */}
        {step === 'level' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
            padding: '40px 20px', animation: 'fadeUp 0.4s ease'
          }}>
            <button onClick={() => setStep('topic')} style={{ background: 'none', border: 'none', color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>← Back</button>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: 'var(--white)', marginBottom: 8, textAlign: 'center' }}>
              What level do you want to reach?
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 15 }}>for <strong style={{ color: 'var(--accent)' }}>{topic}</strong></p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 16, width: '100%', maxWidth: 480 }}>
              {LEVELS.map(l => (
                <button key={l.id} onClick={() => handleLevelSelect(l.id)}
                  style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 14, padding: '24px 20px', textAlign: 'left',
                    cursor: 'pointer', transition: 'all 0.2s', color: 'var(--text)'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.background = 'var(--accent-glow)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.background = 'var(--surface)' }}
                >
                  <div style={{ fontSize: 28, marginBottom: 10 }}>{l.icon}</div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4 }}>{l.label}</div>
                  <div style={{ fontSize: 13, color: 'var(--muted)' }}>{l.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* STEP: QUESTIONS */}
        {step === 'questions' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
            padding: '40px 20px', animation: 'fadeUp 0.4s ease'
          }}>
            <button onClick={() => setStep('level')} style={{ background: 'none', border: 'none', color: 'var(--muted)', marginBottom: 32, fontSize: 14 }}>← Back</button>
            <h2 style={{ fontSize: 26, fontWeight: 700, color: 'var(--white)', marginBottom: 8, textAlign: 'center' }}>
              A few quick questions
            </h2>
            <p style={{ color: 'var(--muted)', marginBottom: 40, fontSize: 15, textAlign: 'center' }}>
              So we can build something actually tailored to you
            </p>

            {loadingQuestions ? (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  width: 40, height: 40, border: '3px solid var(--border)',
                  borderTop: '3px solid var(--accent)', borderRadius: '50%',
                  animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
                }} />
                <p style={{ color: 'var(--muted)' }}>Thinking about the right questions...</p>
              </div>
            ) : (
              <div style={{ width: '100%', maxWidth: 520 }}>
                {questions.map((q, i) => (
                  <div key={q.id} style={{ marginBottom: 28 }}>
                    <label style={{ display: 'block', fontWeight: 600, marginBottom: 10, color: 'var(--text)', fontSize: 15 }}>
                      {i + 1}. {q.question}
                    </label>
                    {q.type === 'select' ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {q.options.map(opt => (
                          <button key={opt} onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                            style={{
                              background: answers[q.id] === opt ? 'var(--accent-glow)' : 'var(--surface2)',
                              border: `1px solid ${answers[q.id] === opt ? 'var(--accent)' : 'var(--border)'}`,
                              color: answers[q.id] === opt ? 'var(--accent-light)' : 'var(--text)',
                              padding: '11px 16px', borderRadius: 8, textAlign: 'left',
                              cursor: 'pointer', fontSize: 14, transition: 'all 0.15s'
                            }}
                          >
                            {opt}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <textarea
                        className="input-field"
                        placeholder={q.placeholder}
                        rows={3}
                        value={answers[q.id] || ''}
                        onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })}
                        style={{ resize: 'vertical' }}
                      />
                    )}
                  </div>
                ))}

                {questions.length > 0 && (
                  <button
                    className="btn-primary"
                    style={{ width: '100%', justifyContent: 'center', fontSize: 16, padding: '14px', marginTop: 8 }}
                    onClick={handleBuildCourse}
                    disabled={Object.keys(answers).length < questions.length}
                  >
                    Build My Course ✦
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* STEP: LOADING */}
        {step === 'loading' && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', minHeight: 'calc(100vh - 60px)',
            padding: '40px 20px', animation: 'fadeUp 0.3s ease'
          }}>
            <div style={{
              width: 72, height: 72, border: '4px solid var(--border)',
              borderTop: '4px solid var(--accent)', borderRadius: '50%',
              animation: 'spin 1s linear infinite', marginBottom: 32
            }} />
            <h2 style={{ fontSize: 22, fontWeight: 700, color: 'var(--white)', marginBottom: 12 }}>
              Building your course
            </h2>
            <p style={{ color: 'var(--accent)', fontSize: 15, animation: 'pulse 1.5s ease infinite' }}>
              {loadingStatus}
            </p>
          </div>
        )}

        {/* STEP: COURSE */}
        {step === 'course' && course && (
          <div style={{ display: 'flex', height: 'calc(100vh - 60px)' }}>

            {/* SIDEBAR */}
            <div style={{
              width: 280, flexShrink: 0, background: 'var(--surface)',
              borderRight: '1px solid var(--border)', overflowY: 'auto',
              padding: '24px 16px'
            }}>
              <div style={{ marginBottom: 20, paddingBottom: 20, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Course</div>
                <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', lineHeight: 1.3, marginBottom: 6 }}>{course.title}</div>
                <div style={{ fontSize: 12, color: 'var(--muted)' }}>⏱ {course.estimatedHours}h · {course.sections.length} sections · {level}</div>
              </div>

              {course.sections.map((section, i) => (
                <button key={i} onClick={() => { setActiveSection(i); setChatMessages([]) }}
                  style={{
                    width: '100%', textAlign: 'left', background: activeSection === i ? 'var(--accent-glow)' : 'transparent',
                    border: `1px solid ${activeSection === i ? 'var(--accent)' : 'transparent'}`,
                    borderRadius: 8, padding: '10px 12px', marginBottom: 4, cursor: 'pointer',
                    transition: 'all 0.15s', color: activeSection === i ? 'var(--accent-light)' : 'var(--muted)'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                      background: activeSection === i ? 'var(--accent)' : 'var(--surface2)',
                      color: activeSection === i ? 'white' : 'var(--muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11, fontWeight: 700, marginTop: 1
                    }}>{i + 1}</span>
                    <span style={{ fontSize: 13, fontWeight: activeSection === i ? 600 : 400, lineHeight: 1.4 }}>{section.title}</span>
                  </div>
                </button>
              ))}
            </div>

            {/* MAIN CONTENT */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px 40px' }}>
              {course.sections[activeSection] && (() => {
                const section = course.sections[activeSection]
                const video = videos[activeSection]
                return (
                  <div style={{ maxWidth: 800, animation: 'fadeUp 0.3s ease' }}>
                    <div style={{ fontSize: 12, color: 'var(--muted)', marginBottom: 8, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      Section {activeSection + 1} of {course.sections.length}
                    </div>
                    <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--white)', marginBottom: 8 }}>{section.title}</h2>
                    <p style={{ color: 'var(--muted)', marginBottom: 28, fontSize: 15, lineHeight: 1.7 }}>{section.description}</p>

                    {/* VIDEO */}
                    {video ? (
                      <div style={{ marginBottom: 32 }}>
                        <div style={{
                          borderRadius: 12, overflow: 'hidden',
                          border: '1px solid var(--border)',
                          aspectRatio: '16/9', background: '#000'
                        }}>
                          <iframe
                            width="100%" height="100%"
                            src={`https://www.youtube.com/embed/${video.videoId}`}
                            title={video.title}
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            style={{ display: 'block' }}
                          />
                        </div>
                        <div style={{ marginTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{video.title}</div>
                            <div style={{ fontSize: 12, color: 'var(--muted)' }}>{video.channelTitle}</div>
                          </div>
                          <a href={`https://www.youtube.com/watch?v=${video.videoId}`} target="_blank" rel="noopener noreferrer"
                            style={{ fontSize: 12, color: 'var(--accent)', textDecoration: 'none' }}>
                            Open in YouTube ↗
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div style={{
                        background: 'var(--surface2)', border: '1px solid var(--border)',
                        borderRadius: 12, padding: 32, textAlign: 'center', marginBottom: 32
                      }}>
                        <div style={{ color: 'var(--muted)', fontSize: 14 }}>Video unavailable for this section</div>
                      </div>
                    )}

                    {/* SUBTOPICS */}
                    <div style={{ marginBottom: 24 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--white)', marginBottom: 12 }}>What you'll cover</h3>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {section.subtopics.map((s, i) => (
                          <span key={i} style={{
                            background: 'var(--surface2)', border: '1px solid var(--border)',
                            color: 'var(--muted)', padding: '6px 14px', borderRadius: 20, fontSize: 13
                          }}>{s}</span>
                        ))}
                      </div>
                    </div>

                    {/* KEY TAKEAWAYS */}
                    <div style={{
                      background: 'var(--surface)', border: '1px solid var(--border)',
                      borderRadius: 12, padding: '20px 24px', marginBottom: 24
                    }}>
                      <h3 style={{ fontSize: 15, fontWeight: 700, color: 'var(--white)', marginBottom: 12 }}>⚡ Key Takeaways</h3>
                      {section.keyTakeaways.map((t, i) => (
                        <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 8, fontSize: 14, color: 'var(--muted)' }}>
                          <span style={{ color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>✓</span>
                          {t}
                        </div>
                      ))}
                    </div>

                    {/* NAVIGATION */}
                    <div style={{ display: 'flex', gap: 12, justifyContent: 'space-between', paddingTop: 8 }}>
                      <button className="btn-secondary"
                        onClick={() => setActiveSection(Math.max(0, activeSection - 1))}
                        disabled={activeSection === 0}
                        style={{ opacity: activeSection === 0 ? 0.3 : 1 }}
                      >← Previous</button>
                      <button className="btn-primary"
                        onClick={() => setActiveSection(Math.min(course.sections.length - 1, activeSection + 1))}
                        disabled={activeSection === course.sections.length - 1}
                      >Next Section →</button>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* AI TUTOR CHAT */}
        {step === 'course' && course && (
          <>
            <button
              onClick={() => setShowChat(!showChat)}
              style={{
                position: 'fixed', bottom: 24, right: 24, width: 52, height: 52,
                background: 'var(--accent)', border: 'none', borderRadius: '50%',
                color: 'white', fontSize: 22, cursor: 'pointer', zIndex: 200,
                boxShadow: '0 4px 20px rgba(108,99,255,0.5)', transition: 'all 0.2s'
              }}
            >
              {showChat ? '✕' : '💬'}
            </button>

            {showChat && (
              <div style={{
                position: 'fixed', bottom: 88, right: 24, width: 360,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 16, zIndex: 200, display: 'flex', flexDirection: 'column',
                boxShadow: '0 16px 48px rgba(0,0,0,0.5)', overflow: 'hidden',
                height: 480
              }}>
                <div style={{
                  padding: '14px 18px', borderBottom: '1px solid var(--border)',
                  background: 'var(--surface2)'
                }}>
                  <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--white)' }}>Zoltar</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{course.sections[activeSection]?.title}</div>
                </div>

                <div style={{ flex: 1, overflowY: 'auto', padding: 16 }}>
                  {chatMessages.length === 0 && (
                    <div style={{
                      textAlign: 'center', padding: '24px 16px',
                      color: 'var(--muted)', fontSize: 13, lineHeight: 1.6
                    }}>
                      Ask me anything about this section — I'm here to help you understand it.
                    </div>
                  )}
                  {chatMessages.map((msg, i) => (
                    <div key={i} style={{
                      marginBottom: 12,
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start'
                    }}>
                      <div style={{
                        maxWidth: '85%',
                        background: msg.role === 'user' ? 'var(--accent)' : 'var(--surface2)',
                        color: 'var(--text)', padding: '10px 14px', borderRadius: 12,
                        fontSize: 13, lineHeight: 1.6,
                        borderBottomRightRadius: msg.role === 'user' ? 4 : 12,
                        borderBottomLeftRadius: msg.role === 'assistant' ? 4 : 12
                      }}>
                       {msg.content.split('\n').map((line, i) => (
  <div key={i} style={{marginBottom: line.startsWith('-') ? 4 : 0}}>
    {line.startsWith('-') ? (
      <div style={{display:'flex', gap:8}}>
        <span style={{color:'var(--accent)', flexShrink:0}}>•</span>
        <span>{line.substring(1).trim()}</span>
      </div>
    ) : line}
  </div>
))}
                      </div>
                    </div>
                  ))}
                  {chatLoading && (
                    <div style={{ display: 'flex', gap: 4, padding: '8px 12px' }}>
                      {[0, 1, 2].map(i => (
                        <div key={i} style={{
                          width: 6, height: 6, borderRadius: '50%',
                          background: 'var(--muted)',
                          animation: `pulse 1s ease ${i * 0.2}s infinite`
                        }} />
                      ))}
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                <div style={{ padding: 12, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                  <input
                    className="input-field"
                    style={{ flex: 1, fontSize: 13, padding: '10px 14px' }}
                    placeholder="Ask a question..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && sendChat()}
                  />
                  <button className="btn-primary" onClick={sendChat}
                    disabled={!chatInput.trim() || chatLoading}
                    style={{ padding: '10px 14px', fontSize: 16 }}>
                    ↑
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  )
}
