import { useState, useEffect, useRef } from "react";

interface Industry {
  id: string;
  label: string;
  icon: string;
  desc: string;
}

interface Message {
  role: string;
  content: string;
  time: string;
}

interface SummaryData {
  error?: string;
  usp?: string;
  icp_primary?: string;
  icp_secondary?: string;
  top_competitors?: string[];
  core_pain_points?: string[];
  growth_goals?: string;
  brand_personality?: string;
  key_proof_points?: string[];
  pricing_positioning?: string;
  recommended_focus?: string;
  quick_wins?: string[];
}

const CATEGORIES: { key: string; label: string; industries: Industry[] }[] = [
  {
    key: "realestate",
    label: "Real Estate & Property",
    industries: [
      { id: "property", label: "Property Management", icon: "🏢", desc: "Residential, commercial & short-term rentals" },
      { id: "realestate", label: "Real Estate Agency", icon: "🏡", desc: "Buying, selling & investment properties" },
    ],
  },
  {
    key: "health",
    label: "Health, Beauty & Wellness",
    industries: [
      { id: "healthcare", label: "Healthcare & Clinic", icon: "🏥", desc: "Medical, dental, therapy & wellness" },
      { id: "fitness", label: "Fitness & Wellness", icon: "💪", desc: "Gyms, studios, personal training" },
      { id: "beauty", label: "Beauty & Salon", icon: "✂️", desc: "Hair, nails, skincare & aesthetics" },
      { id: "aesthetician", label: "Aesthetician & Spa", icon: "✨", desc: "Facials, skin treatments & med spa" },
    ],
  },
  {
    key: "business",
    label: "Business & Professional Services",
    industries: [
      { id: "legal", label: "Legal & Professional", icon: "⚖️", desc: "Law firms, consulting & advisors" },
      { id: "accounting", label: "Accounting & Bookkeeping", icon: "📊", desc: "CPA firms, tax prep & bookkeeping" },
      { id: "financial", label: "Financial Services", icon: "💰", desc: "Wealth management, insurance & planning" },
      { id: "agency", label: "Marketing & Agency", icon: "📣", desc: "Creative, digital & PR agencies" },
      { id: "education", label: "Education & Coaching", icon: "🎓", desc: "Schools, tutoring & online courses" },
    ],
  },
  {
    key: "commerce",
    label: "Commerce & Technology",
    industries: [
      { id: "retail", label: "Retail & eCommerce", icon: "🛒", desc: "Brick & mortar and online stores" },
      { id: "tech", label: "Tech & SaaS", icon: "💻", desc: "Software, apps & tech startups" },
      { id: "construction", label: "Construction & Trades", icon: "🔨", desc: "Contracting, renovation & trades" },
    ],
  },
  {
    key: "hospitality",
    label: "Food, Hospitality & Transport",
    industries: [
      { id: "restaurant", label: "Restaurant & Hospitality", icon: "🍽️", desc: "Dining, cafes, catering & events" },
      { id: "transportation", label: "Transportation & Logistics", icon: "🚗", desc: "Trucking, courier, limo & fleet services" },
    ],
  },
  {
    key: "other",
    label: "Other",
    industries: [
      { id: "other", label: "Other Industry", icon: "✦", desc: "Tell Alex what industry you're in" },
    ],
  },
];

const PROMPTS: Record<string, string> = {
  property: `You are Alex, a sharp and friendly marketing strategist specializing in property management. Conduct a discovery session to uncover: USP, ICP (property owners AND tenants), competitive landscape, pricing positioning, brand personality, pain points (vacancy rates, maintenance, tenant issues), growth goals, and proof points. One conversational question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  realestate: `You are Alex, a marketing strategist who knows the real estate industry deeply. Uncover: property focus (residential, luxury, commercial, investment), ideal client profile, differentiation from other agents and big brokerages, local market expertise, client experience, lead generation approach, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  healthcare: `You are Alex, a marketing strategist specializing in healthcare practices. Uncover: specialization and differentiation, ideal patient profile, how patients find them, patient experience, competitive advantages, pain points (no-shows, insurance, growth), and goals. Warm and professional tone. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  fitness: `You are Alex, a marketing strategist for fitness and wellness businesses. Uncover: type of fitness experience and differentiation, ideal member profile, competition with big chains and boutiques, pricing and membership model, retention challenges, community culture, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  beauty: `You are Alex, a marketing strategist for beauty businesses. Uncover: service specializations, ideal client demographics, differentiation in a competitive market, pricing positioning, client retention, social media presence, biggest challenges, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  aesthetician: `You are Alex, a marketing strategist specializing in aesthetics and med spa businesses. Uncover: core treatment menu and signature services, ideal client profile, differentiation from dermatologist offices and DIY skincare trends, pricing positioning, client retention and memberships, how clients discover them, biggest challenges, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  legal: `You are Alex, a marketing strategist for professional services firms. Uncover: practice areas, ideal client profile, how clients find them, differentiation from other firms, client relationship approach, pricing structure, business development challenges, and growth goals. Sophisticated tone. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  accounting: `You are Alex, a marketing strategist for accounting firms. Uncover: service mix (tax, bookkeeping, advisory, CFO services), ideal client profile, differentiation from national firms and cheap online services, pricing approach, client acquisition strategy, biggest growth challenges, and goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  financial: `You are Alex, a marketing strategist for financial services businesses. Uncover: service offering (wealth management, planning, insurance, mortgages), ideal client profile, differentiation from robo-advisors and banks, trust-building approach, compliance considerations, referral strategy, current market challenges, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  agency: `You are Alex, a sharp marketing strategist who knows the agency world. Uncover: service specialization, ideal client profile, differentiation from other agencies, service model, pricing, how they win new clients, biggest operational challenges, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  education: `You are Alex, a marketing strategist for education and coaching businesses. Uncover: what they teach and their methodology, ideal student profile, competition with free content and big platforms, delivery model, pricing, how students find them, key outcomes, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  retail: `You are Alex, a marketing strategist for retail and eCommerce businesses. Uncover: hero products, ideal customer, differentiation from Amazon and big box, online vs in-store split, pricing positioning, operational challenges, loyalty approach, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  tech: `You are Alex, a marketing strategist for tech and SaaS companies. Uncover: problem solved and for whom, ideal customer profile, differentiation from competitors, pricing model, growth challenges (acquisition, churn), go-to-market approach, and expansion goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  construction: `You are Alex, a marketing strategist for construction and trades. Uncover: work specialization, ideal client, how they win jobs, pricing approach, how clients find them, biggest business challenges, and growth goals. Direct and practical tone. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  restaurant: `You are Alex, a marketing strategist for food and hospitality. Uncover: what makes this venue unique, ideal customers, local competition, price point positioning, brand personality, biggest challenges, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  transportation: `You are Alex, a marketing strategist for transportation and logistics businesses. Uncover: type of service (trucking, courier, limo, delivery, moving), ideal client profile, differentiation from Uber and national carriers, pricing model, client acquisition strategy, operational challenges, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
  other: `You are Alex, a sharp and friendly marketing strategist. First ask what type of business and industry this is. Then conduct a thorough discovery session to uncover their USP, ICP, competitive positioning, brand personality, pricing, pain points, and growth goals. One question at a time. After 10-12 exchanges output SESSION_COMPLETE on its own line.`,
};

const formatTime = () => new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const ACCENT = "#C9A84C";

export default function App() {
  const [screen, setScreen] = useState<"industry" | "company" | "chat" | "report">("industry");
  const [selectedIndustry, setSelectedIndustry] = useState<Industry | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [location, setLocation] = useState("");
  const [desc, setDesc] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sessionDone, setSessionDone] = useState(false);
  const [summary, setSummary] = useState<SummaryData | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const callAPI = async (system: string, msgs: { role: string; content: string }[]) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({ model: "claude-sonnet-4-5", max_tokens: 1000, system, messages: msgs }),
    });
    const data = await res.json();
    return data.content.map((b: { text?: string }) => b.text || "").join("");
  };

  const getSystemPrompt = () => {
    const base = PROMPTS[selectedIndustry?.id || "other"];
    return base + `\n\nClient — Company: "${companyName}", Location: "${location}"` + (desc ? `, Context: "${desc}"` : ".") + `\n\nStart now. Reference the company name naturally. Do NOT ask for company name or location — you already have it.`;
  };

  const startChat = async () => {
    setScreen("chat");
    setLoading(true);
    try {
      const reply = await callAPI(getSystemPrompt(), [{ role: "user", content: "Begin the session." }]);
      setMessages([{ role: "assistant", content: reply, time: formatTime() }]);
    } catch {
      setMessages([{ role: "assistant", content: "Something went wrong. Please refresh.", time: formatTime() }]);
    }
    setLoading(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMsg = async () => {
    if (!input.trim() || loading || sessionDone) return;
    const userMsg: Message = { role: "user", content: input.trim(), time: formatTime() };
    const newMsgs = [...messages, userMsg];
    setMessages(newMsgs);
    setInput("");
    setLoading(true);
    try {
      const apiMsgs = [{ role: "user", content: "Begin the session." }, ...newMsgs.map((m) => ({ role: m.role, content: m.content }))];
      let reply = await callAPI(getSystemPrompt(), apiMsgs);
      if (reply.includes("SESSION_COMPLETE")) {
        reply = reply.replace("SESSION_COMPLETE", "").trim();
        setSessionDone(true);
      }
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: reply, time: formatTime() }]);
    } catch {
      setMessages((prev: Message[]) => [...prev, { role: "assistant", content: "Connection issue. Please try again.", time: formatTime() }]);
    }
    setLoading(false);
  };

  const generateSummary = async () => {
    setSummaryLoading(true);
    const transcript = messages.map((m: Message) => `${m.role === "assistant" ? "Alex" : companyName}: ${m.content}`).join("\n\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-api-key": import.meta.env.VITE_ANTHROPIC_API_KEY, "anthropic-version": "2023-06-01", "anthropic-dangerous-direct-browser-access": "true" },
        body: JSON.stringify({
          model: "claude-sonnet-4-5", max_tokens: 1500,
          messages: [{ role: "user", content: `Based on this strategy session transcript, return ONLY valid JSON (no markdown, no preamble) with these keys: usp (string), icp_primary (string), icp_secondary (string), top_competitors (array of strings max 4), core_pain_points (array of strings max 4), growth_goals (string), brand_personality (string), key_proof_points (array of strings max 3), pricing_positioning (string), recommended_focus (string), quick_wins (array of strings max 3).\n\nTranscript:\n${transcript}` }],
        }),
      });
      const data = await res.json();
      const raw = data.content.map((b: { text?: string }) => b.text || "").join("").replace(/```json|```/g, "").trim();
      setSummary(JSON.parse(raw));
      setScreen("report");
    } catch {
      setSummary({ error: "Could not generate summary. Please try again." });
    }
    setSummaryLoading(false);
  };

  const startNew = () => {
    setScreen("industry"); setSelectedIndustry(null); setCompanyName(""); setLocation(""); setDesc("");
    setMessages([]); setInput(""); setLoading(false); setSessionDone(false); setSummary(null); setSummaryLoading(false);
  };

  const copyReport = () => {
    if (!summary) return;
    const text = `STRATEGY INSIGHTS REPORT\n${companyName} · ${location}\nIndustry: ${selectedIndustry?.label}\n\nUSP: ${summary.usp}\nPrimary ICP: ${summary.icp_primary}\nSecondary ICP: ${summary.icp_secondary}\nBrand: ${summary.brand_personality}\nPricing: ${summary.pricing_positioning}\nGrowth Goals: ${summary.growth_goals}\nRecommended Focus: ${summary.recommended_focus}\nCompetitors: ${(summary.top_competitors || []).join(", ")}\nPain Points: ${(summary.core_pain_points || []).join(", ")}\nQuick Wins: ${(summary.quick_wins || []).join(", ")}`;
    navigator.clipboard.writeText(text).then(() => alert("Report copied to clipboard!"));
  };

  const S = {
    page: { minHeight: "100vh", background: "#0C0F14", color: "#E8E3DA", fontFamily: "'DM Sans', sans-serif" } as React.CSSProperties,
    tag: { fontSize: 10, letterSpacing: "2px", textTransform: "uppercase" as const, color: ACCENT, fontFamily: "'DM Sans', sans-serif", marginBottom: 16 },
    btnGold: { background: ACCENT, color: "#0C0F14", border: "none", padding: "13px 36px", fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 14, cursor: "pointer", letterSpacing: "0.5px" } as React.CSSProperties,
    btnGhost: { background: "transparent", border: "1px solid #2A2D38", color: "#8A8E9E", padding: "10px 24px", fontFamily: "'DM Sans', sans-serif", fontSize: 13, cursor: "pointer" } as React.CSSProperties,
    insightCard: { background: "#13161E", border: "1px solid #1E2130", padding: "18px" } as React.CSSProperties,
  };

  const insightCards = summary && !summary.error ? [
    { label: "Unique Selling Proposition", value: summary.usp, accent: ACCENT },
    { label: "Primary Ideal Customer", value: summary.icp_primary, accent: "#7EB8A4" },
    { label: "Secondary Ideal Customer", value: summary.icp_secondary, accent: "#7EB8A4" },
    { label: "Brand Personality", value: summary.brand_personality, accent: "#A78BCA" },
    { label: "Pricing Positioning", value: summary.pricing_positioning, accent: ACCENT },
    { label: "Growth Goals", value: summary.growth_goals, accent: "#E07B5A" },
    { label: "Strategic Recommended Focus", value: summary.recommended_focus, accent: ACCENT },
  ] : [];

  const listCards = summary && !summary.error ? [
    { label: "Top Competitors", items: summary.top_competitors, accent: "#E07B5A" },
    { label: "Core Pain Points", items: summary.core_pain_points, accent: ACCENT },
    { label: "Quick Wins", items: summary.quick_wins, accent: "#7EB8A4" },
    { label: "Key Proof Points", items: summary.key_proof_points, accent: "#A78BCA" },
  ] : [];

  return (
    <div style={S.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,400;0,600;1,400&family=DM+Sans:wght@300;400;500&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        ::-webkit-scrollbar{width:3px}::-webkit-scrollbar-thumb{background:#2A2D38}
        @keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}}
        @keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}
        .fade-up{animation:fadeUp 0.35s ease forwards}
        .msg-in{animation:fadeUp 0.3s ease forwards}
        .ind-card{background:#13161E;border:1px solid #1E2130;padding:18px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden}
        .ind-card:hover{border-color:${ACCENT};background:#1A1D27;transform:translateY(-2px)}
        .ind-card.sel{border-color:${ACCENT};background:#1A1D27}
        .ind-card::before{content:'';position:absolute;top:0;left:0;right:0;height:2px;background:${ACCENT};transform:scaleX(0);transition:transform 0.2s}
        .ind-card:hover::before,.ind-card.sel::before{transform:scaleX(1)}
        textarea{resize:none}
        textarea:focus{outline:none}
        .btn-g:hover{background:#B89840!important}
        .btn-gh:hover{border-color:${ACCENT}!important;color:${ACCENT}!important}
        .send-btn:hover{background:${ACCENT}!important;color:#0C0F14!important}
      `}</style>

      {/* ── SCREEN: INDUSTRY ── */}
      {screen === "industry" && (
        <div style={{ maxWidth: 920, margin: "0 auto", padding: "48px 24px" }}>
          <div className="fade-up" style={{ textAlign: "center", marginBottom: 48 }}>
            <div style={S.tag}>AI Strategy Platform</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 600, lineHeight: 1.15, marginBottom: 14 }}>
              What industry are<br />you working with?
            </h1>
            <p style={{ color: "#6B6F7E", fontSize: 15, lineHeight: 1.7, maxWidth: 420, margin: "0 auto" }}>
              Select a category and Alex, your AI strategist, will run a fully tailored discovery session.
            </p>
          </div>

          {CATEGORIES.map((cat) => (
            <div key={cat.key}>
              <div style={{ fontSize: 10, letterSpacing: "1.5px", textTransform: "uppercase", color: "#3A3D4A", margin: "28px 0 10px", fontFamily: "'DM Sans', sans-serif" }}>{cat.label}</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))", gap: 10 }}>
                {cat.industries.map((ind) => (
                  <div key={ind.id} className={`ind-card${selectedIndustry?.id === ind.id ? " sel" : ""}`} onClick={() => setSelectedIndustry(ind)}>
                    <div style={{ fontSize: 22, marginBottom: 8 }}>{ind.icon}</div>
                    <div style={{ fontSize: 13, fontWeight: 500, color: "#E8E3DA", marginBottom: 3, lineHeight: 1.3 }}>{ind.label}</div>
                    <div style={{ fontSize: 11, color: "#6B6F7E", lineHeight: 1.4 }}>{ind.desc}</div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ textAlign: "center", marginTop: 36 }}>
            <button className="btn-g" disabled={!selectedIndustry} onClick={() => setScreen("company")}
              style={{ ...S.btnGold, opacity: selectedIndustry ? 1 : 0.4, cursor: selectedIndustry ? "pointer" : "not-allowed" }}>
              Continue →
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN: COMPANY ── */}
      {screen === "company" && (
        <div style={{ maxWidth: 560, margin: "0 auto", padding: "64px 24px" }}>
          <button className="btn-gh" style={S.btnGhost} onClick={() => setScreen("industry")}>← Back</button>
          <div className="fade-up" style={{ marginTop: 40 }}>
            <div style={S.tag}>{selectedIndustry?.label}</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, marginBottom: 8 }}>Tell us about the business</h2>
            <p style={{ color: "#6B6F7E", fontSize: 14, marginBottom: 36 }}>Just the basics — Alex will uncover the rest in conversation.</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {[
                { label: "Company Name", val: companyName, set: setCompanyName, ph: "e.g. Acme Company Inc." },
                { label: "City / Location", val: location, set: setLocation, ph: "e.g. Calgary, AB" },
                { label: "One Line About Them (optional)", val: desc, set: setDesc, ph: "e.g. Full-service firm est. 2018" },
              ].map((f) => (
                <div key={f.label}>
                  <label style={{ fontSize: 12, color: "#6B6F7E", letterSpacing: "1px", textTransform: "uppercase", display: "block", marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{f.label}</label>
                  <input value={f.val} onChange={(e) => f.set(e.target.value)} placeholder={f.ph}
                    style={{ background: "#13161E", border: "1px solid #1E2130", color: "#E8E3DA", padding: "12px 16px", fontFamily: "'DM Sans', sans-serif", fontSize: 15, width: "100%", outline: "none" }} />
                </div>
              ))}
            </div>
            <button className="btn-g" style={{ ...S.btnGold, marginTop: 32 }} onClick={() => { if (companyName && location) startChat(); }}>
              Begin Strategy Session →
            </button>
          </div>
        </div>
      )}

      {/* ── SCREEN: CHAT ── */}
      {screen === "chat" && (
        <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
          <div style={{ borderBottom: "1px solid #1E2130", padding: "16px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0C0F14", flexShrink: 0 }}>
            <div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600 }}>{companyName}</div>
              <div style={{ fontSize: 11, color: "#6B6F7E", marginTop: 2, letterSpacing: "0.5px" }}>{selectedIndustry?.label.toUpperCase()} · {location.toUpperCase()}</div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: sessionDone ? ACCENT : "#4CAF7A", boxShadow: sessionDone ? "none" : "0 0 8px #4CAF7A88" }} />
              <span style={{ fontSize: 11, color: "#6B6F7E", letterSpacing: "0.5px" }}>{sessionDone ? "COMPLETE" : "LIVE"}</span>
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: 18 }}>
            {messages.map((msg: Message, i: number) => (
              <div key={i} className="msg-in" style={{ display: "flex", flexDirection: msg.role === "user" ? "row-reverse" : "row", alignItems: "flex-end", gap: 10 }}>
                {msg.role === "assistant" && (
                  <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1D27", border: `1px solid ${ACCENT}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: ACCENT, flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>A</div>
                )}
                <div style={{ maxWidth: "78%" }}>
                  <div style={{ background: msg.role === "user" ? ACCENT : "#13161E", color: msg.role === "user" ? "#0C0F14" : "#E8E3DA", padding: "12px 16px", fontSize: 14, lineHeight: 1.65, fontFamily: "'DM Sans', sans-serif", borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px", border: msg.role === "assistant" ? "1px solid #1E2130" : "none" }}>
                    {msg.content}
                  </div>
                  <div style={{ fontSize: 11, color: "#3A3D4A", marginTop: 4, textAlign: msg.role === "user" ? "right" : "left", paddingLeft: msg.role === "assistant" ? 4 : 0, paddingRight: msg.role === "user" ? 4 : 0, fontFamily: "'DM Sans', sans-serif" }}>
                    {msg.role === "assistant" ? "Alex · " : ""}{msg.time}
                  </div>
                </div>
              </div>
            ))}

            {loading && (
              <div className="msg-in" style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: "50%", background: "#1A1D27", border: `1px solid ${ACCENT}55`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: ACCENT, flexShrink: 0, fontFamily: "'DM Sans', sans-serif", fontWeight: 500 }}>A</div>
                <div style={{ background: "#13161E", border: "1px solid #1E2130", padding: "12px 18px", borderRadius: "16px 16px 16px 4px", display: "flex", gap: 5, alignItems: "center" }}>
                  {[0, 1, 2].map((i) => (
                    <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: ACCENT, animation: `bounce 1s ${i * 0.15}s infinite`, opacity: 0.8 }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {!sessionDone ? (
            <div style={{ padding: "16px 24px", borderTop: "1px solid #1E2130", flexShrink: 0 }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-end", background: "#13161E", border: "1px solid #1E2130", padding: "10px 14px" }}>
                <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e: React.KeyboardEvent<HTMLTextAreaElement>) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMsg(); } }}
                  placeholder="Type your response..." rows={1}
                  style={{ flex: 1, background: "none", border: "none", color: "#E8E3DA", fontFamily: "'DM Sans', sans-serif", fontSize: 14, lineHeight: 1.5, maxHeight: 90, overflowY: "auto" }} />
                <button className="send-btn" onClick={sendMsg} disabled={loading || !input.trim()}
                  style={{ background: "transparent", border: `1px solid ${ACCENT}44`, color: ACCENT, width: 34, height: 34, cursor: "pointer", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "all 0.2s", opacity: loading || !input.trim() ? 0.4 : 1 }}>↑</button>
              </div>
              <div style={{ fontSize: 11, color: "#2A2D38", marginTop: 6, textAlign: "center", fontFamily: "'DM Sans', sans-serif" }}>Enter to send · Shift+Enter for new line</div>
            </div>
          ) : (
            <div style={{ padding: "20px 24px", textAlign: "center", background: "#13161E", borderTop: `1px solid ${ACCENT}44`, flexShrink: 0 }}>
              <div style={{ ...S.tag, marginBottom: 8 }}>Session Complete</div>
              <p style={{ color: "#6B6F7E", fontSize: 13, marginBottom: 16, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>Ready to compile your insights into a structured strategy report.</p>
              <button className="btn-g" style={S.btnGold} onClick={generateSummary} disabled={summaryLoading}>
                {summaryLoading ? "Generating..." : "Generate Insights Report →"}
              </button>
            </div>
          )}
        </div>
      )}

      {/* ── SCREEN: REPORT ── */}
      {screen === "report" && summary && !summary.error && (
        <div style={{ maxWidth: 820, margin: "0 auto", padding: "48px 24px" }}>
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            <div style={S.tag}>Session Complete</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, marginBottom: 8 }}>{companyName} — Strategy Insights</h2>
            <p style={{ color: "#6B6F7E", fontSize: 14, fontFamily: "'DM Sans', sans-serif" }}>{selectedIndustry?.label} · {location}</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 10 }}>
            {insightCards.map((card) => (
              <div key={card.label} style={S.insightCard}>
                <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: card.accent, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{card.label}</div>
                <p style={{ fontSize: 13.5, color: "#D8D2C9", lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{card.value || "—"}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {listCards.map((card) => (
              <div key={card.label} style={S.insightCard}>
                <div style={{ fontSize: 10, letterSpacing: "2px", textTransform: "uppercase", color: card.accent, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>{card.label}</div>
                <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: 7 }}>
                  {(card.items || []).map((item: string, i: number) => (
                    <li key={i} style={{ display: "flex", gap: 7, alignItems: "flex-start", fontSize: 12.5, color: "#C8C2B9", lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
                      <span style={{ color: card.accent, marginTop: 4, flexShrink: 0, fontSize: 6 }}>◆</span>{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div style={{ textAlign: "center", marginTop: 40, display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn-g" style={S.btnGold} onClick={startNew}>Start New Session →</button>
            <button className="btn-gh" style={S.btnGhost} onClick={copyReport}>Copy Report</button>
          </div>
        </div>
      )}
    </div>
  );
}
