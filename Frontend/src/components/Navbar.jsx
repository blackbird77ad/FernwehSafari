import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import ThemeToggle from "./ThemeToggle";
import travellexLogo from "../assets/photos/Travellex-logo-wordmark.png";
import useAuth from "../hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/tours", label: "Tours" },
  { to: "/gallery", label: "Gallery" },
  { to: "/about", label: "About" },
  { to: "/partner", label: "Partner" },
  { to: "/contact", label: "Contact" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const { isAuthenticated, isStaff, logout, user } = useAuth();
  const navigate = useNavigate();
  const isTourCompany = user?.role === "tour_company";
  const firstName = user?.name?.trim().split(" ")[0] || "Account";

  function handleLogout() {
    logout();
    setOpen(false);
    setAccountOpen(false);
    navigate("/");
  }

  function closeMenus() {
    setOpen(false);
    setAccountOpen(false);
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/" onClick={closeMenus} aria-label="Travellex home">
        <img className="brand-logo" src={travellexLogo} alt="Travellex" />
      </Link>
      <button
        className="menu-button"
        type="button"
        aria-expanded={open}
        aria-controls="primary-navigation"
        onClick={() => {
          setOpen((value) => !value);
          setAccountOpen(false);
        }}
      >
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      <nav id="primary-navigation" className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={closeMenus}>
            {link.label}
          </NavLink>
        ))}
        {isAuthenticated ? (
          <div className="account-menu-wrap">
            <button
              className="account-menu-button"
              type="button"
              onClick={() => setAccountOpen((value) => !value)}
              aria-expanded={accountOpen}
              aria-haspopup="menu"
            >
              <span className="account-avatar" aria-hidden="true">
                <UserIcon />
              </span>
              <span className="account-name">{firstName}</span>
              <ChevronIcon />
            </button>
            {accountOpen && (
              <div className="account-menu" role="menu">
                <Link to={isStaff ? "/admin" : "/dashboard#profile"} onClick={closeMenus} role="menuitem">
                  Profile
                </Link>
                <Link to={isStaff ? "/admin" : "/dashboard#saved-tours"} onClick={closeMenus} role="menuitem">
                  My tours
                </Link>
                {isTourCompany && (
                  <Link to="/dashboard#company-tours" onClick={closeMenus} role="menuitem">
                    My listings
                  </Link>
                )}
                {isStaff && (
                  <Link to="/admin" onClick={closeMenus} role="menuitem">
                    CRM
                  </Link>
                )}
                <button type="button" onClick={handleLogout} role="menuitem">
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link className="nav-cta" to="/login" onClick={closeMenus}>
              Login
            </Link>
          </>
        )}
        <ThemeToggle compact />
      </nav>
    </header>
  );
}

function UserIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M20 21a8 8 0 0 0-16 0" />
      <circle cx="12" cy="8" r="4" />
    </svg>
  );
}

function ChevronIcon() {
  return (
    <svg className="account-chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}
