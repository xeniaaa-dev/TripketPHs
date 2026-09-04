import Brand from './Brand'
import SocialIcon from './SocialIcon'
import WaveRule from './WaveRule'
import { FOOTER_GROUPS, FOOTER_TAGLINE, SOCIAL_LINKS } from '../data/content'

export default function SiteFooter() {
  return (
    <footer className="site-footer">
      <WaveRule />

      <div className="container footer-grid">
        <div className="footer-brand">
          <Brand size={24} />
          <p>{FOOTER_TAGLINE}</p>
        </div>

        {FOOTER_GROUPS.map(({ heading, links }) => (
          <nav className="footer-group" key={heading} aria-labelledby={`footer-${heading}`}>
            <h2 id={`footer-${heading}`}>{heading}</h2>
            <ul>
              {links.map(({ label, href }) => (
                <li key={label}>
                  <a href={href}>{label}</a>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>

      <div className="container footer-bottom">
        <small>© {new Date().getFullYear()} Tripket PH. All rights reserved.</small>
        <ul className="social-links">
          {SOCIAL_LINKS.map(({ label, network, href }) => (
            <li key={network}>
              <a href={href} aria-label={label} rel="noreferrer noopener" target="_blank">
                <SocialIcon network={network} />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  )
}
