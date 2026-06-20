import { Link, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import useAuth from "../hooks/useAuth";

const links = [
  { to: "/", label: "Home" },
  { to: "/tours", label: "Tours" },
  { to: "/about", label: "About" },
  { to: "/gallery", label: "Gallery" },
  { to: "/faq", label: "FAQ" },
  { to: "/contact", label: "Contact" }
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { isAdmin, isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    setOpen(false);
    navigate("/");
  }

  return (
    <header className="navbar">
      <Link className="brand" to="/" onClick={() => setOpen(false)}>
        <span className="brand-mark">FS</span>
        <span>FernwehSafari</span>
      </Link>
      <button className="menu-button" type="button" onClick={() => setOpen((value) => !value)}>
        <span>{open ? "Close" : "Menu"}</span>
      </button>
      <nav className={open ? "nav-links open" : "nav-links"} aria-label="Primary navigation">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to} onClick={() => setOpen(false)}>
            {link.label}
          </NavLink>
        ))}
        {isAuthenticated ? (
          <>
            <NavLink to="/dashboard" onClick={() => setOpen(false)}>
              Dashboard
            </NavLink>
            {isAdmin && (
              <NavLink to="/admin" onClick={() => setOpen(false)}>
                Admin
              </NavLink>
            )}
            <button className="text-button" type="button" onClick={handleLogout}>
              Logout {user?.name ? user.name.split(" ")[0] : ""}
            </button>
          </>
        ) : (
          <Link className="nav-cta" to="/login" onClick={() => setOpen(false)}>
            Login
          </Link>
        )}
      </nav>
    </header>
  );
}
