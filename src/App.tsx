import { useState, useEffect, useRef } from 'react';

const SYSTEM_PROMPT = `You are Alex, a sharp and friendly marketing strategist conducting a discovery session with a property management company called Real Living Estates Ltd, based in Calgary, Alberta (also serving Edmonton, Airdrie, and Okotoks). They manage residential rentals, commercial spaces, short-term/vacation rentals, and offer Airbnb management.

Your job is to uncover their:
- USP (Unique Selling Proposition) — what truly makes them different
- ICP (Ideal Customer Profile) — who their best clients are (both property owners and tenants)
- Competitive landscape — who they compete with and how
- Core pain points — what frustrates their clients and their own team
- Goals — growth targets, markets they want to enter
- Brand personality — how they want to be perceived
- Proof points — stats, testimonials, track record
- Pricing positioning — budget, mid, or premium

Rules for how you must conduct this session:
1. Be conversational and warm — like a real consultant, not a questionnaire
2. Ask ONE focused question at a time, sometimes two short ones if they flow naturally together
3. Build on what they say — reference their previous answers, dig deeper with follow-ups
4. Use casual but professional language. Occasional affirmations like "That's really interesting" or "Good to know" are fine but don't overdo it
5. Do NOT ask generic or obvious questions — make them feel like you already know the industry
6. After about 10–12 exchanges, if you feel you have enough, wrap up naturally and say you have what you need and suggest generating an insights summary. Use the exact phrase: "SESSION_COMPLETE" on its own line at the very end of your wrap-up message.
7. Keep your messages concise — 2–4 sentences max per turn
8. Start by introducing yourself briefly and asking your first question about what originally drove them to start the business or what gap they saw in the market.`;

const formatTime = () => {
  const now = new Date();
  return now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export default function StrategySession() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [summary, setSummary] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [started, setStarted] = useState(false);
  const [msgCount, setMsgCount] = useState(0);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const startSession = async () => {
    setStarted(true);
    setLoading(true);
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: 'Begin the session.' }],
        }),
      });
      const data = await res.json();
      const reply = data.content.map((b) => b.text || '').join('');
      setMessages([{ role: 'assistant', content: reply, time: formatTime() }]);
    } catch (e) {
      setMessages([
        {
          role: 'assistant',
          content: 'Something went wrong starting the session. Please refresh.',
          time: formatTime(),
        },
      ]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: 'user', content: input.trim(), time: formatTime() };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setMsgCount((c) => c + 1);

    try {
      const apiMessages = [
        { role: 'user', content: 'Begin the session.' },
        ...newMessages.map((m) => ({ role: m.role, content: m.content })),
      ];

      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: apiMessages,
        }),
      });
      const data = await res.json();
      let reply = data.content.map((b) => b.text || '').join('');

      if (reply.includes('SESSION_COMPLETE')) {
        reply = reply.replace('SESSION_COMPLETE', '').trim();
        setSessionComplete(true);
      }

      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: reply, time: formatTime() },
      ]);
    } catch (e) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'Connection issue. Please try again.',
          time: formatTime(),
        },
      ]);
    }
    setLoading(false);
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    const transcript = messages
      .map(
        (m) =>
          `${m.role === 'assistant' ? 'Alex (Strategist)' : 'Client'}: ${
            m.content
          }`
      )
      .join('\n\n');

    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 1000,
          messages: [
            {
              role: 'user',
              content: `Based on this strategy session transcript, produce a clean structured insights report in JSON only. No preamble, no markdown fences. Return valid JSON with these keys: usp (string), icp_owners (string), icp_tenants (string), top_competitors (array of strings), core_pain_points (array of strings), growth_goals (string), brand_personality (string), key_proof_points (array of strings), pricing_positioning (string), recommended_focus (string).

Transcript:
${transcript}`,
            },
          ],
        }),
      });
      const data = await res.json();
      const raw = data.content
        .map((b) => b.text || '')
        .join('')
        .replace(/```json|```/g, '')
        .trim();
      setSummary(JSON.parse(raw));
    } catch (e) {
      setSummary({ error: 'Could not generate summary. Please try again.' });
    }
    setSummaryLoading(false);
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const insightCards =
    summary && !summary.error
      ? [
          {
            label: 'Unique Selling Proposition',
            value: summary.usp,
            icon: '◆',
            color: '#C9A84C',
          },
          {
            label: 'Ideal Client — Property Owners',
            value: summary.icp_owners,
            icon: '🏠',
            color: '#7EB8A4',
          },
          {
            label: 'Ideal Client — Tenants',
            value: summary.icp_tenants,
            icon: '👥',
            color: '#7EB8A4',
          },
          {
            label: 'Brand Personality',
            value: summary.brand_personality,
            icon: '✦',
            color: '#A78BCA',
          },
          {
            label: 'Pricing Positioning',
            value: summary.pricing_positioning,
            icon: '◈',
            color: '#C9A84C',
          },
          {
            label: 'Growth Goals',
            value: summary.growth_goals,
            icon: '↗',
            color: '#7EB8A4',
          },
          {
            label: 'Strategic Recommended Focus',
            value: summary.recommended_focus,
            icon: '★',
            color: '#E07B5A',
          },
        ]
      : [];

  const listCards =
    summary && !summary.error
      ? [
          {
            label: 'Top Competitors',
            items: summary.top_competitors,
            color: '#E07B5A',
          },
          {
            label: 'Core Pain Points',
            items: summary.core_pain_points,
            color: '#C9A84C',
          },
          {
            label: 'Key Proof Points',
            items: summary.key_proof_points,
            color: '#7EB8A4',
          },
        ]
      : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#0F1117',
        color: '#E8E2D9',
        fontFamily: "'Georgia', serif",
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #1A1D27; }
        ::-webkit-scrollbar-thumb { background: #3A3D4A; border-radius: 2px; }
        .msg-in { animation: fadeUp 0.3s ease forwards; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        .send-btn:hover { background: #C9A84C !important; color: #0F1117 !important; }
        .start-btn:hover { background: #B8944A !important; }
        .gen-btn:hover { opacity: 0.85; }
        textarea:focus { outline: none; }
        textarea { resize: none; }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: '1px solid #252830',
          padding: '20px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: '#0F1117',
          position: 'sticky',
          top: 0,
          zIndex: 10,
        }}
      >
        <div>
          <div
            style={{
              fontFamily: "'Playfair Display', serif",
              fontSize: 20,
              fontWeight: 700,
              color: '#E8E2D9',
              letterSpacing: '-0.3px',
            }}
          >
            Strategy Discovery
          </div>
          <div
            style={{
              fontSize: 12,
              color: '#6B6F7E',
              fontFamily: "'DM Sans', sans-serif",
              marginTop: 2,
              letterSpacing: '0.5px',
            }}
          >
            REAL LIVING ESTATES LTD · CALGARY, AB
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              background:
                started && !sessionComplete
                  ? '#4CAF7A'
                  : sessionComplete
                  ? '#C9A84C'
                  : '#6B6F7E',
              boxShadow:
                started && !sessionComplete ? '0 0 8px #4CAF7A88' : 'none',
            }}
          />
          <span
            style={{
              fontSize: 12,
              color: '#6B6F7E',
              fontFamily: "'DM Sans', sans-serif",
              letterSpacing: '0.5px',
            }}
          >
            {!started ? 'READY' : sessionComplete ? 'COMPLETE' : 'LIVE SESSION'}
          </span>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          maxWidth: 760,
          width: '100%',
          margin: '0 auto',
          padding: '0 20px',
        }}
      >
        {!started ? (
          // Start Screen
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              textAlign: 'center',
              padding: '60px 20px',
            }}
          >
            <div
              style={{
                fontSize: 11,
                letterSpacing: '3px',
                color: '#C9A84C',
                fontFamily: "'DM Sans', sans-serif",
                marginBottom: 24,
                textTransform: 'uppercase',
              }}
            >
              Marketing Strategy Session
            </div>
            <h1
              style={{
                fontFamily: "'Playfair Display', serif",
                fontSize: 36,
                fontWeight: 700,
                lineHeight: 1.2,
                color: '#E8E2D9',
                marginBottom: 16,
                maxWidth: 480,
              }}
            >
              Let's uncover what makes you{' '}
              <span style={{ color: '#C9A84C', fontStyle: 'italic' }}>
                different.
              </span>
            </h1>
            <p
              style={{
                color: '#8A8E9E',
                fontFamily: "'DM Sans', sans-serif",
                fontSize: 15,
                lineHeight: 1.7,
                maxWidth: 420,
                marginBottom: 40,
              }}
            >
              This is a conversational discovery session with Alex, your AI
              strategist. No forms, no checklists — just a real conversation to
              surface your USP, ideal clients, and competitive edge.
            </p>
            <div
              style={{
                display: 'flex',
                gap: 32,
                marginBottom: 48,
                flexWrap: 'wrap',
                justifyContent: 'center',
              }}
            >
              {[
                '~10 min',
                'USP + ICP',
                'Competitor insights',
                'Brand positioning',
              ].map((tag) => (
                <div
                  key={tag}
                  style={{
                    fontSize: 12,
                    color: '#6B6F7E',
                    fontFamily: "'DM Sans', sans-serif",
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <span style={{ color: '#C9A84C', fontSize: 14 }}>◆</span>{' '}
                  {tag}
                </div>
              ))}
            </div>
            <button
              className="start-btn"
              onClick={startSession}
              style={{
                background: '#C9A84C',
                color: '#0F1117',
                border: 'none',
                padding: '14px 40px',
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 600,
                fontSize: 15,
                cursor: 'pointer',
                letterSpacing: '0.3px',
                transition: 'background 0.2s',
              }}
            >
              Begin Session
            </button>
          </div>
        ) : (
          <>
            {/* Chat Area */}
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                padding: '28px 0 20px',
                display: 'flex',
                flexDirection: 'column',
                gap: 20,
              }}
            >
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className="msg-in"
                  style={{
                    display: 'flex',
                    flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                    alignItems: 'flex-end',
                    gap: 12,
                  }}
                >
                  {msg.role === 'assistant' && (
                    <div
                      style={{
                        width: 34,
                        height: 34,
                        borderRadius: '50%',
                        background: '#1E2130',
                        border: '1px solid #C9A84C33',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        color: '#C9A84C',
                        flexShrink: 0,
                        fontFamily: "'DM Sans', sans-serif",
                      }}
                    >
                      A
                    </div>
                  )}
                  <div style={{ maxWidth: '75%' }}>
                    <div
                      style={{
                        background: msg.role === 'user' ? '#C9A84C' : '#1A1D27',
                        color: msg.role === 'user' ? '#0F1117' : '#E8E2D9',
                        padding: '13px 18px',
                        fontSize: 14.5,
                        lineHeight: 1.65,
                        fontFamily: "'DM Sans', sans-serif",
                        fontWeight: msg.role === 'user' ? 500 : 400,
                        borderRadius:
                          msg.role === 'user'
                            ? '18px 18px 4px 18px'
                            : '18px 18px 18px 4px',
                        border:
                          msg.role === 'assistant'
                            ? '1px solid #252830'
                            : 'none',
                      }}
                    >
                      {msg.content}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#4A4E5E',
                        marginTop: 5,
                        fontFamily: "'DM Sans', sans-serif",
                        textAlign: msg.role === 'user' ? 'right' : 'left',
                        paddingLeft: msg.role === 'assistant' ? 4 : 0,
                        paddingRight: msg.role === 'user' ? 4 : 0,
                      }}
                    >
                      {msg.role === 'assistant' ? 'Alex · ' : ''}
                      {msg.time}
                    </div>
                  </div>
                </div>
              ))}

              {loading && (
                <div
                  className="msg-in"
                  style={{ display: 'flex', alignItems: 'flex-end', gap: 12 }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      background: '#1E2130',
                      border: '1px solid #C9A84C33',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      color: '#C9A84C',
                      flexShrink: 0,
                      fontFamily: "'DM Sans', sans-serif",
                    }}
                  >
                    A
                  </div>
                  <div
                    style={{
                      background: '#1A1D27',
                      border: '1px solid #252830',
                      padding: '14px 20px',
                      borderRadius: '18px 18px 18px 4px',
                      display: 'flex',
                      gap: 5,
                      alignItems: 'center',
                    }}
                  >
                    {[0, 1, 2].map((i) => (
                      <div
                        key={i}
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: '#C9A84C',
                          animation: `bounce 1s ${i * 0.15}s infinite`,
                          opacity: 0.7,
                        }}
                      />
                    ))}
                    <style>{`@keyframes bounce { 0%,60%,100%{transform:translateY(0)} 30%{transform:translateY(-5px)} }`}</style>
                  </div>
                </div>
              )}

              {/* Session Complete Banner */}
              {sessionComplete && !summary && (
                <div
                  className="msg-in"
                  style={{
                    background: 'linear-gradient(135deg, #1E2130, #252830)',
                    border: '1px solid #C9A84C44',
                    padding: '24px 28px',
                    textAlign: 'center',
                    marginTop: 8,
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: '3px',
                      color: '#C9A84C',
                      fontFamily: "'DM Sans', sans-serif",
                      marginBottom: 10,
                    }}
                  >
                    SESSION COMPLETE
                  </div>
                  <p
                    style={{
                      color: '#8A8E9E',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14,
                      marginBottom: 20,
                      lineHeight: 1.6,
                    }}
                  >
                    Ready to compile everything into a structured insights
                    report — USP, ICP, competitors, positioning, and more.
                  </p>
                  <button
                    className="gen-btn"
                    onClick={generateSummary}
                    disabled={summaryLoading}
                    style={{
                      background: '#C9A84C',
                      color: '#0F1117',
                      border: 'none',
                      padding: '12px 32px',
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 600,
                      fontSize: 14,
                      cursor: 'pointer',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {summaryLoading
                      ? 'Generating insights...'
                      : 'Generate Insights Report →'}
                  </button>
                </div>
              )}

              {/* Summary */}
              {summary && !summary.error && (
                <div className="msg-in" style={{ marginTop: 8 }}>
                  <div
                    style={{
                      fontSize: 11,
                      letterSpacing: '3px',
                      color: '#C9A84C',
                      fontFamily: "'DM Sans', sans-serif",
                      marginBottom: 20,
                      textAlign: 'center',
                    }}
                  >
                    INSIGHTS REPORT
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr',
                      gap: 12,
                      marginBottom: 12,
                    }}
                  >
                    {insightCards.map((card) => (
                      <div
                        key={card.label}
                        style={{
                          background: '#1A1D27',
                          border: '1px solid #252830',
                          padding: '16px 18px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 7,
                            marginBottom: 8,
                          }}
                        >
                          <span style={{ color: card.color, fontSize: 13 }}>
                            {card.icon}
                          </span>
                          <span
                            style={{
                              fontSize: 10,
                              letterSpacing: '1.5px',
                              color: '#6B6F7E',
                              fontFamily: "'DM Sans', sans-serif",
                              textTransform: 'uppercase',
                            }}
                          >
                            {card.label}
                          </span>
                        </div>
                        <p
                          style={{
                            fontSize: 13.5,
                            color: '#D8D2C9',
                            lineHeight: 1.6,
                            fontFamily: "'DM Sans', sans-serif",
                          }}
                        >
                          {card.value}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 12,
                    }}
                  >
                    {listCards.map((card) => (
                      <div
                        key={card.label}
                        style={{
                          background: '#1A1D27',
                          border: '1px solid #252830',
                          padding: '16px 18px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 10,
                            letterSpacing: '1.5px',
                            color: '#6B6F7E',
                            fontFamily: "'DM Sans', sans-serif",
                            textTransform: 'uppercase',
                            marginBottom: 12,
                          }}
                        >
                          {card.label}
                        </div>
                        <ul
                          style={{
                            listStyle: 'none',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 7,
                          }}
                        >
                          {(card.items || []).map((item, i) => (
                            <li
                              key={i}
                              style={{
                                display: 'flex',
                                gap: 8,
                                alignItems: 'flex-start',
                                fontSize: 13,
                                color: '#C8C2B9',
                                fontFamily: "'DM Sans', sans-serif",
                                lineHeight: 1.5,
                              }}
                            >
                              <span
                                style={{
                                  color: card.color,
                                  marginTop: 3,
                                  flexShrink: 0,
                                  fontSize: 8,
                                }}
                              >
                                ◆
                              </span>{' '}
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Input */}
            {!sessionComplete && (
              <div
                style={{
                  padding: '16px 0 24px',
                  borderTop: '1px solid #1E2130',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    gap: 10,
                    alignItems: 'flex-end',
                    background: '#1A1D27',
                    border: '1px solid #252830',
                    padding: '12px 16px',
                  }}
                >
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKey}
                    placeholder="Type your response..."
                    rows={1}
                    style={{
                      flex: 1,
                      background: 'none',
                      border: 'none',
                      color: '#E8E2D9',
                      fontFamily: "'DM Sans', sans-serif",
                      fontSize: 14.5,
                      lineHeight: 1.5,
                      maxHeight: 100,
                      overflowY: 'auto',
                    }}
                  />
                  <button
                    className="send-btn"
                    onClick={sendMessage}
                    disabled={loading || !input.trim()}
                    style={{
                      background: 'transparent',
                      border: '1px solid #C9A84C44',
                      color: '#C9A84C',
                      width: 36,
                      height: 36,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      flexShrink: 0,
                      fontSize: 16,
                      transition: 'all 0.2s',
                      opacity: loading || !input.trim() ? 0.4 : 1,
                    }}
                  >
                    ↑
                  </button>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: '#3A3D4A',
                    fontFamily: "'DM Sans', sans-serif",
                    marginTop: 8,
                    textAlign: 'center',
                  }}
                >
                  Press Enter to send · Shift+Enter for new line
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
