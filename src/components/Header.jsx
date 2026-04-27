import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo.png'

export default function Header({ user, onAccount, onSignOut, onLogin, onNewSpec, showNewSpec, hideMenu, onLoginPage }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return
    function handleClick(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [menuOpen])

  const handleClick = () => {
    if (!hideMenu && !onLoginPage) onNewSpec?.()
  }

  return (
    <header className="app-header">
      <img src={logo} alt="logo" className="header-logo" />
      <h1 onClick={handleClick}>
        OpenClient
      </h1>
      {!hideMenu && <div className="header-menu" ref={menuRef}>
        <button className="hamburger" onClick={() => setMenuOpen(o => !o)}>
          <span />
          <span />
          <span />
        </button>
        {menuOpen && (
          <div className="dropdown">
            {showNewSpec && <button onClick={() => { onNewSpec?.(); setMenuOpen(false) }}>New Spec</button>}
            {user ? (
              <button onClick={() => { onAccount?.(); setMenuOpen(false) }}>Account</button>
            ) : (
              <button onClick={() => { onLogin?.(); setMenuOpen(false) }}>Login</button>
            )}
          </div>
        )}
      </div>}
    </header>
  )
}
