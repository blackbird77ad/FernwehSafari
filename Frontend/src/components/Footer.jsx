import { Link } from "react-router-dom";
import ThemeToggle from "./ThemeToggle";
import travellexLogo from "../assets/photos/Travellex-logo-wordmark.png";

export default function Footer() {
  return (
    <footer className="footer">
      <div>
        <Link className="brand" to="/">
          <img className="brand-logo" src={travellexLogo} alt="Travellex" />
        </Link>
        <p>Curated safari, mountain, culture, coast and adventure routes across Africa, with deep current coverage of Tanzania and Zanzibar.</p>
        <div className="footer-badges">
          <span>EUR pricing</span>
          <span>Trip-ready</span>
          <span>Operator reviewed</span>
        </div>
      </div>
      <div>
        <h3>Explore</h3>
        <Link to="/">Home</Link>
        <Link to="/tours">Tours</Link>
        <Link to="/gallery">Gallery</Link>
        <Link to="/testimonials">Testimonials</Link>
        <Link to="/faq">FAQ</Link>
        <Link to="/contact">Contact</Link>
      </div>
      <div>
        <h3>Destinations</h3>
        <Link to="/destinations/germany-to-africa-tours">From Germany</Link>
        <Link to="/destinations/tanzania-tours">Tanzania tours</Link>
        <Link to="/destinations/zanzibar-tours">Zanzibar coast</Link>
        <Link to="/destinations/tanzania-safari-tours">Tanzania safari</Link>
        <Link to="/destinations/ngorongoro-crater-safari">Ngorongoro</Link>
        <Link to="/destinations/kilimanjaro-tours">Kilimanjaro</Link>
      </div>
      <div>
        <h3>Partners</h3>
        <Link to="/partner">Partner</Link>
        <Link to="/login">Login as partner</Link>
        <Link to="/partner#partner-application">Become a partner</Link>
        <Link to="/dashboard">Tour dashboard</Link>
      </div>
      <div>
        <h3>Contact</h3>
        <a className="footer-contact-link" href="mailto:experience@travellex.tours">
          <MailIcon />
          experience@travellex.tours
        </a>
        <div className="footer-whatsapp-row">
          <a
            className="footer-whatsapp-icon"
            href="https://wa.me/4917676062927"
            target="_blank"
            rel="noreferrer"
            aria-label="Chat on WhatsApp"
            title="Chat on WhatsApp"
          >
            <WhatsAppIcon />
          </a>
          <a className="footer-whatsapp-number" href="https://wa.me/4917676062927" target="_blank" rel="noreferrer">
            +49 176 7606 2927
          </a>
        </div>
        <a className="footer-contact-link" href="https://www.instagram.com/officialshalom2" target="_blank" rel="noreferrer">
          <InstagramIcon />
          Instagram
        </a>
        <ThemeToggle compact />
      </div>
      <div className="footer-bottom">
        <span>&copy; {new Date().getFullYear()} Travellex. All rights reserved.</span>
        <a className="footer-credit-link" href="https://thebrandhelper.com/" target="_blank" rel="noreferrer">
          Built by <span>The Brand<span className="brand-helper-red">Helper</span></span>
        </a>
      </div>
    </footer>
  );
}

function MailIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
      <path d="m4 7 8 6 8-6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg aria-hidden="true" fill="currentColor" viewBox="0 0 32 32">
      <path d="M16.02 3.2A12.74 12.74 0 0 0 5.18 22.64L3.6 28.8l6.3-1.5A12.73 12.73 0 1 0 16.02 3.2Zm0 22.92c-2.02 0-3.9-.58-5.5-1.58l-.4-.24-3.72.88.94-3.62-.26-.42a10.16 10.16 0 1 1 8.94 4.98Zm5.58-7.6c-.3-.16-1.8-.9-2.08-1-.28-.1-.48-.16-.68.16-.2.3-.78 1-.96 1.2-.18.2-.36.22-.66.08-.3-.16-1.28-.48-2.44-1.52-.9-.8-1.5-1.78-1.68-2.08-.18-.3-.02-.46.14-.62.14-.14.3-.36.46-.54.16-.18.2-.3.3-.5.1-.2.06-.38-.02-.54-.08-.16-.68-1.64-.94-2.24-.24-.58-.5-.5-.68-.5h-.58c-.2 0-.52.08-.8.38-.28.3-1.04 1.02-1.04 2.48s1.06 2.86 1.2 3.06c.16.2 2.1 3.2 5.08 4.48.7.3 1.26.48 1.7.62.72.22 1.36.18 1.88.12.58-.08 1.8-.74 2.06-1.44.26-.7.26-1.3.18-1.44-.08-.14-.28-.22-.58-.36Z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg aria-hidden="true" fill="none" viewBox="0 0 24 24">
      <rect height="16" rx="5" stroke="currentColor" strokeWidth="2" width="16" x="4" y="4" />
      <circle cx="12" cy="12" r="3.2" stroke="currentColor" strokeWidth="2" />
      <path d="M17.5 6.8h.01" stroke="currentColor" strokeLinecap="round" strokeWidth="2.4" />
    </svg>
  );
}
