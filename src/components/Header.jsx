import { useState } from 'react'
import logo from '../assets/logo.png'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  const handleClick = () => {
    window.location.reload()
  }

  return (
    <header className="app-header">
      <h1 onClick={handleClick}>
        <img src={logo} alt="logo" style={{ height: '3rem', marginRight: '0.75rem' }} />
        openclient
      </h1>
      <div className="header-menu">
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
          <span />
          <span />
          <span />
        </button>
        {menuOpen && (
          <div className="dropdown">
            <button onClick={() => setMenuOpen(false)}>Account</button>
            <button onClick={() => setMenuOpen(false)}>Settings</button>
          </div>
        )}
      </div>
    </header>
  )
}