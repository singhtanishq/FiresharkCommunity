import { Link } from 'react-router-dom'
import { Fish } from 'lucide-react'

export function CommunityGuidelines() {
  return (
    <div className="app-main--narrow" style={{ margin: '0 auto', maxWidth: 760 }}>
      <h1>Community Guidelines</h1>
      <p className="muted mb-2">
        The FireShark Community is a place for technical questions, knowledge sharing and professional growth.
        These guidelines keep it useful, safe and welcoming.
      </p>

      <section className="panel mb-2">
        <div className="panel__header"><h2>What belongs here</h2></div>
        <div className="panel__body">
          <ul>
            <li>Practical technical questions on cybersecurity, ethical hacking, penetration testing, networking, cloud security, SOC & blue team work, forensics and more.</li>
            <li>Certification preparation and career guidance.</li>
            <li>Hands-on lab and project troubleshooting.</li>
            <li>Clear answers backed by experience, references or working commands.</li>
          </ul>
        </div>
      </section>

      <section className="panel mb-2">
        <div className="panel__header"><h2>How to ask a good question</h2></div>
        <div className="panel__body">
          <ul>
            <li>Use a descriptive title that summarises the actual problem.</li>
            <li>Include what you are trying to accomplish, what you already tried, and the exact error or output.</li>
            <li>Share your environment: operating system, tool and version.</li>
            <li>Format commands and output in code blocks.</li>
            <li>For networking questions, include topology and addressing details (sanitised).</li>
          </ul>
        </div>
      </section>

      <section className="panel mb-2">
        <div className="panel__header"><h2>What is not allowed</h2></div>
        <div className="panel__body">
          <ul>
            <li>Publishing passwords, API keys, tokens, private keys or other credentials.</li>
            <li>Personal data: phone numbers, addresses, government IDs, confidential company information.</li>
            <li>Requests for unauthorised access, credential theft, malware distribution or any illegal activity.</li>
            <li>Doxxing, harassment, phishing promotion or malicious links.</li>
            <li>Spam, advertising and excessive self-promotion.</li>
            <li>Account recovery, payment disputes and order problems \u2014 use <a href="https://fireshark.in/" target="_blank" rel="noopener noreferrer">FireShark Support</a> instead.</li>
          </ul>
          <p className="muted">
            Legitimate offensive-security education (labs, CTFs, authorised engagements) is welcome \u2014 scope your
            discussions to environments you are authorised to test.
          </p>
        </div>
      </section>

      <section className="panel mb-2">
        <div className="panel__header"><h2>Voting, reputation and badges</h2></div>
        <div className="panel__body">
          <ul>
            <li>Upvote answers that genuinely help; downvote only when something is incorrect or unsafe, ideally with a comment explaining why.</li>
            <li>Vote based on usefulness, not agreement.</li>
            <li>Reputation reflects community usefulness \u2014 ask, answer and get accepted to earn it.</li>
            <li>Badges recognise milestones like first questions, accepted answers and sustained contribution.</li>
            <li>The monthly leaderboard resets on the 1st; history is preserved.</li>
          </ul>
        </div>
      </section>

      <section className="panel mb-2">
        <div className="panel__header"><h2>Moderation & reporting</h2></div>
        <div className="panel__body">
          <ul>
            <li>Use the Report link on any question, answer or comment that breaks the rules.</li>
            <li>Moderators may hide, close or remove content and take action on accounts.</li>
            <li>Closed questions remain visible so knowledge is not lost.</li>
            <li>Significant moderation actions are logged.</li>
          </ul>
        </div>
      </section>

      <section className="panel">
        <div className="panel__header"><h2>Privacy</h2></div>
        <div className="panel__body">
          <ul>
            <li>Share only what you are comfortable making public.</li>
            <li>Remove personal information from screenshots before uploading.</li>
            <li>Profiles are public; location and website are optional.</li>
          </ul>
        </div>
      </section>

      <p className="muted mt-2">Questions about these guidelines? Reach the team via <a href="https://fireshark.in/" target="_blank" rel="noopener noreferrer">fireshark.in</a>.</p>
    </div>
  )
}

export function About() {
  return (
    <div className="app-main--narrow" style={{ margin: '0 auto', maxWidth: 760 }}>
      <h1>About the FireShark Community</h1>
      <p className="muted mb-2">
        The FireShark Community is a public question-and-answer platform for cybersecurity professionals, learners,
        ethical hackers and technology enthusiasts.
      </p>

      <div className="panel mb-2">
        <div className="panel__body">
          <h2>Ask. Answer. Learn.</h2>
          <p>
            Ask a technical question and get answers from practitioners. Vote for the answers that help. Accept the
            answer that solved your problem. Over time, the best discussions become a public, searchable knowledge
            base that helps the next person with the same problem.
          </p>
          <h2>Part of the FireShark ecosystem</h2>
          <p>
            The community connects naturally with the wider FireShark ecosystem \u2014 the main website, FireShark
            Academy, the learning platform and fireshark.ai. Learners can bring real questions from labs and
            courses, and experienced professionals can share what actually works.
          </p>
          <h2>Human answers, human moderation</h2>
          <p>
            Answers here come from people, not bots. Content is reviewed by human moderators, reputation is earned
            through genuinely useful participation, and the leaderboard rewards monthly contribution.
          </p>
        </div>
      </div>

      <div className="row">
        <Link to="/ask" className="btn btn--fire">Ask your first question</Link>
        <Link to="/questions" className="btn btn--ghost">Explore questions</Link>
      </div>
    </div>
  )
}

export function NotFound() {
  return (
    <div className="panel" style={{ maxWidth: 480, margin: '3rem auto' }}>
      <div className="panel__body" style={{ textAlign: 'center' }}>
        <Fish size={48} strokeWidth={1.5} aria-hidden="true" />
        <h1>404</h1>
        <p className="muted">The page you are looking for doesn't exist or has been moved.</p>
        <Link to="/" className="btn btn--primary">Back to the community</Link>
      </div>
    </div>
  )
}
