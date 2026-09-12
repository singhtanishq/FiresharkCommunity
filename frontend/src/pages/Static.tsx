import { Link } from 'react-router-dom'
import { 
  Fish, ShieldAlert, CheckCircle2, XCircle, 
  Lightbulb, Star, Flag, ShieldCheck, Zap, 
  Globe, Users, ArrowRight, SearchX, Terminal
} from 'lucide-react'

// --- Helper component for premium list items ---
function RuleItem({ icon, text, type = 'default' }: { icon: React.ReactNode, text: React.ReactNode, type?: 'success' | 'danger' | 'info' | 'default' }) {
  const color = 
    type === 'success' ? 'var(--success)' : 
    type === 'danger' ? 'var(--danger)' : 
    type === 'info' ? '#d97706' : 'var(--brand-blue-500)';
  
  return (
    <div className="row" style={{ alignItems: 'flex-start', gap: '0.85rem', marginBottom: '1.25rem' }}>
      <div style={{ color, flexShrink: 0, marginTop: '2px' }}>{icon}</div>
      <div style={{ lineHeight: 1.65, color: 'var(--ink-800)', fontSize: '1rem' }}>{text}</div>
    </div>
  )
}

// =====================================================================
// COMMUNITY GUIDELINES
// =====================================================================

export function CommunityGuidelines() {
  return (
    <div className="app-main--narrow" style={{ margin: '0 auto', maxWidth: 840, paddingBottom: '4rem', animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Premium Header */}
      <div style={{ marginBottom: '3rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <div className="row" style={{ gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: 'var(--radius-lg)', background: 'var(--brand-blue-50)', color: 'var(--brand-blue-600)', display: 'grid', placeItems: 'center', boxShadow: '0 4px 12px rgba(22, 122, 201, 0.1)' }}>
            <ShieldAlert size={28} strokeWidth={2} />
          </div>
          <h1 style={{ fontSize: '2.4rem', fontWeight: 900, margin: 0, letterSpacing: '-0.02em', color: 'var(--ink-900)' }}>
            Community Guidelines
          </h1>
        </div>
        <p style={{ fontSize: '1.15rem', color: 'var(--text-2)', lineHeight: 1.6, margin: 0 }}>
          The FireShark Community is a place for technical questions, knowledge sharing, and professional growth. 
          These guidelines keep our network useful, safe, and welcoming for all intelligence levels.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        <section className="panel" style={{ padding: '2rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 color="var(--success)" /> What belongs here
          </h2>
          <div>
            <RuleItem type="success" icon={<CheckCircle2 size={20} />} text="Practical technical questions on cybersecurity, ethical hacking, penetration testing, networking, cloud security, SOC & blue team work, forensics and more." />
            <RuleItem type="success" icon={<CheckCircle2 size={20} />} text="Certification preparation and career guidance." />
            <RuleItem type="success" icon={<CheckCircle2 size={20} />} text="Hands-on lab and project troubleshooting." />
            <RuleItem type="success" icon={<CheckCircle2 size={20} />} text="Clear answers backed by experience, references or working commands." />
          </div>
        </section>

        <section className="panel" style={{ padding: '2rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Lightbulb color="#d97706" /> How to ask a good question
          </h2>
          <div>
            <RuleItem type="info" icon={<Terminal size={20} />} text="Use a descriptive title that summarises the actual problem." />
            <RuleItem type="info" icon={<Terminal size={20} />} text="Include what you are trying to accomplish, what you already tried, and the exact error or output." />
            <RuleItem type="info" icon={<Terminal size={20} />} text="Share your environment: operating system, tool and version." />
            <RuleItem type="info" icon={<Terminal size={20} />} text="Format commands and output in code blocks." />
            <RuleItem type="info" icon={<Terminal size={20} />} text="For networking questions, include topology and addressing details (sanitised)." />
          </div>
        </section>

        <section className="panel" style={{ padding: '2rem', border: '1px solid #fecaca', animation: 'modal-rise var(--dur-slow) var(--ease) 0.2s both' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--danger)' }}>
            <XCircle /> Strictly Prohibited
          </h2>
          <div>
            <RuleItem type="danger" icon={<XCircle size={20} />} text="Publishing passwords, API keys, tokens, private keys or other credentials." />
            <RuleItem type="danger" icon={<XCircle size={20} />} text="Personal data: phone numbers, addresses, government IDs, confidential company information." />
            <RuleItem type="danger" icon={<XCircle size={20} />} text="Requests for unauthorised access, credential theft, malware distribution or any illegal activity." />
            <RuleItem type="danger" icon={<XCircle size={20} />} text="Doxxing, harassment, phishing promotion or malicious links." />
            <RuleItem type="danger" icon={<XCircle size={20} />} text="Spam, advertising and excessive self-promotion." />
            <RuleItem type="danger" icon={<XCircle size={20} />} text={<>Account recovery, payment disputes and order problems — use <a href="https://fireshark.in/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>FireShark Support</a> instead.</>} />
          </div>
          <div className="banner banner--warn mt-2">
            <ShieldAlert size={18} style={{ flexShrink: 0 }} /> 
            <span style={{ fontSize: '0.9rem' }}>Legitimate offensive-security education (labs, CTFs, authorised engagements) is welcome — scope your discussions to environments you are authorised to test.</span>
          </div>
        </section>

        <div className="grid-2" style={{ gap: '1.5rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.25s both' }}>
          <section className="panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Star size={18} color="var(--brand-blue-500)" /> Reputation & Badges
            </h2>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--ink-800)', lineHeight: 1.6, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Upvote answers that genuinely help; downvote only when incorrect or unsafe (explain why).</li>
              <li>Vote based on usefulness, not agreement.</li>
              <li>Reputation reflects community usefulness — ask, answer and get accepted to earn it.</li>
              <li>Badges recognise milestones like first questions and sustained contribution.</li>
              <li>The monthly leaderboard resets on the 1st; history is preserved.</li>
            </ul>
          </section>

          <section className="panel" style={{ padding: '1.5rem' }}>
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Flag size={18} color="var(--brand-blue-500)" /> Moderation
            </h2>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--ink-800)', lineHeight: 1.6, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Use the Report link on any content that breaks the rules.</li>
              <li>Moderators may hide, close or remove content and take action on accounts.</li>
              <li>Closed questions remain visible so knowledge is not lost.</li>
              <li>Significant moderation actions are logged publicly.</li>
            </ul>
            
            <h2 style={{ fontSize: '1.15rem', fontWeight: 800, margin: '1.5rem 0 1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={18} color="var(--brand-blue-500)" /> Privacy
            </h2>
            <ul style={{ paddingLeft: '1.2rem', margin: 0, color: 'var(--ink-800)', lineHeight: 1.6, fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <li>Share only what you are comfortable making public.</li>
              <li>Remove personal information from screenshots before uploading.</li>
              <li>Profiles are public; location and website are optional.</li>
            </ul>
          </section>
        </div>
      </div>

      <div style={{ textAlign: 'center', marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border)', animation: 'fade-in var(--dur-slow) var(--ease) 0.3s both' }}>
        <p className="muted" style={{ fontSize: '1rem' }}>
          Questions about these guidelines? Reach the core team via <a href="https://fireshark.in/" target="_blank" rel="noopener noreferrer" style={{ fontWeight: 600 }}>fireshark.in</a>.
        </p>
      </div>
    </div>
  )
}

// =====================================================================
// ABOUT
// =====================================================================

export function About() {
  return (
    <div className="app-main" style={{ animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      
      {/* Hero Section */}
      <div style={{ textAlign: 'center', maxWidth: '800px', margin: '0 auto 4rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.05s both' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '72px', height: '72px', borderRadius: '50%', background: 'linear-gradient(135deg, var(--brand-blue-600), var(--brand-blue-400))', color: '#fff', marginBottom: '1.5rem', boxShadow: 'var(--shadow-blue)' }}>
          <Globe size={36} strokeWidth={2} />
        </div>
        <h1 style={{ fontSize: '3rem', fontWeight: 900, letterSpacing: '-0.03em', color: 'var(--ink-900)', lineHeight: 1.1, marginBottom: '1rem' }}>
          About the FireShark Community
        </h1>
        <p style={{ fontSize: '1.25rem', color: 'var(--text-2)', lineHeight: 1.6, maxWidth: '680px', margin: '0 auto' }}>
          A public question-and-answer platform built exclusively for cybersecurity professionals, learners, ethical hackers, and technology enthusiasts.
        </p>
      </div>

      {/* Feature Cards Grid */}
      <div className="grid-3" style={{ gap: '2rem', marginBottom: '4rem', animation: 'modal-rise var(--dur-slow) var(--ease) 0.15s both' }}>
        
        <div className="panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', transition: 'transform 0.3s ease', borderTop: '4px solid var(--brand-blue-400)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ width: '48px', height: '48px', background: 'var(--brand-blue-50)', color: 'var(--brand-blue-600)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem' }}>
            <Zap size={24} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>Ask. Answer. Learn.</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
            Ask technical questions and get answers from active practitioners. Vote for the intelligence that helps. Over time, the best discussions become a public, searchable knowledge base.
          </p>
        </div>

        <div className="panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', transition: 'transform 0.3s ease', borderTop: '4px solid #f2600c' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ width: '48px', height: '48px', background: '#ffedd5', color: '#f2600c', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem' }}>
            <Globe size={24} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>The Ecosystem</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
            Connected seamlessly with the wider FireShark ecosystem. Learners bring real questions from labs and courses, while experienced professionals share real-world tactics.
          </p>
        </div>

        <div className="panel" style={{ padding: '2.5rem 2rem', textAlign: 'center', transition: 'transform 0.3s ease', borderTop: '4px solid var(--success)' }} onMouseOver={e => e.currentTarget.style.transform = 'translateY(-5px)'} onMouseOut={e => e.currentTarget.style.transform = 'none'}>
          <div style={{ width: '48px', height: '48px', background: 'var(--success-bg)', color: 'var(--success)', borderRadius: '50%', display: 'grid', placeItems: 'center', margin: '0 auto 1.5rem' }}>
            <Users size={24} />
          </div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem' }}>Human Driven</h2>
          <p style={{ color: 'var(--text-2)', lineHeight: 1.6, fontSize: '0.95rem', margin: 0 }}>
            Answers here come from people, not bots. Content is reviewed by human moderators, reputation is earned authentically, and the leaderboard rewards genuine contribution.
          </p>
        </div>

      </div>

      {/* Footer CTA */}
      <div style={{ textAlign: 'center', animation: 'fade-in var(--dur-slow) var(--ease) 0.25s both' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 800, marginBottom: '1.5rem' }}>Ready to contribute?</h2>
        <div className="row" style={{ justifyContent: 'center', gap: '1rem' }}>
          <Link to="/ask" className="btn btn--fire btn--xl" style={{ borderRadius: '99px', padding: '0.8rem 2rem' }}>
            Ask your first question
          </Link>
          <Link to="/questions" className="btn btn--ghost btn--xl" style={{ borderRadius: '99px', padding: '0.8rem 2rem' }}>
            Explore the feed <ArrowRight size={18} style={{ marginLeft: 4 }} />
          </Link>
        </div>
      </div>
    </div>
  )
}

// =====================================================================
// NOT FOUND (404)
// =====================================================================

export function NotFound() {
  return (
    <div className="app-main" style={{ display: 'grid', placeItems: 'center', minHeight: '70vh', animation: 'fade-in var(--dur-slow) var(--ease)' }}>
      <div style={{ textAlign: 'center', maxWidth: '500px', animation: 'modal-rise var(--dur-slow) var(--ease) 0.1s both' }}>
        
        {/* Animated Float Container */}
        <div style={{ 
          display: 'inline-block', 
          animation: 'float 6s ease-in-out infinite', 
          color: 'var(--brand-blue-300)',
          marginBottom: '1.5rem' 
        }}>
          <Fish size={80} strokeWidth={1.5} aria-hidden="true" />
        </div>
        
        {/* We need a simple float keyframe for the fish */}
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) rotate(0deg); }
            50% { transform: translateY(-15px) rotate(5deg); }
          }
        `}</style>

        <h1 style={{ fontSize: '5rem', fontWeight: 900, lineHeight: 1, margin: '0 0 1rem', color: 'var(--ink-900)', letterSpacing: '-0.05em' }}>
          404
        </h1>
        
        <div className="row" style={{ justifyContent: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
          <SearchX size={20} color="var(--danger)" />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, margin: 0, color: 'var(--ink-800)' }}>Target Not Found</h2>
        </div>

        <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', lineHeight: 1.6, marginBottom: '2.5rem' }}>
          The intelligence record you are looking for has either been moved, classified, or never existed in the database.
        </p>
        
        <Link to="/" className="btn btn--primary btn--lg" style={{ borderRadius: '99px', padding: '0.8rem 2rem' }}>
          Return to Base
        </Link>
      </div>
    </div>
  )
}