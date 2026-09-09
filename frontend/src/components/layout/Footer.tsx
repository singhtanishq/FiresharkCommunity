import { Link } from 'react-router-dom'
import logo from '../../assets/fireshark_community.png'

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div>
          <div className="brand" style={{ color: '#fff' }}>
            <span className="brand__mark"><img src={logo} alt="FireShark Community" /></span>
          </div>
          <p className="site-footer__brandline">
            Ask questions. Share knowledge. Build expertise. A community for cybersecurity professionals, learners
            and technology enthusiasts.
          </p>
        </div>

        <div>
          <h4>Community</h4>
          <Link to="/questions">Questions</Link>
          <Link to="/categories">Categories</Link>
          <Link to="/tags">Tags</Link>
          <Link to="/leaderboard">Leaderboard</Link>
        </div>

        <div>
          <h4>About</h4>
          <Link to="/community-guidelines">Community guidelines</Link>
          <Link to="/about">About this community</Link>
        </div>

        <div>
          <h4>FireShark</h4>
          <a href="https://fireshark.in/" target="_blank" rel="noopener noreferrer">fireshark.in</a>
          <a href="https://academy.fireshark.in/" target="_blank" rel="noopener noreferrer">Academy</a>
          <a href="https://learn.fireshark.in/" target="_blank" rel="noopener noreferrer">Learn</a>
          <a href="https://fireshark.ai/" target="_blank" rel="noopener noreferrer">fireshark.ai</a>
        </div>
      </div>
      <div className="site-footer__legal">
        © {new Date().getFullYear()} FireShark. All rights reserved. Use of this site is subject to the community guidelines.
      </div>
    </footer>
  )
}