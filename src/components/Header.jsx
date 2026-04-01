import { useState, useEffect, useRef } from 'react'
import logo from '../assets/logo.png'

export default function Header() {
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
    window.location.reload()
  }

  return (
    <header className="app-header">
      <h1 onClick={handleClick}>
        <img src={logo} alt="logo" className="header-logo" />
        openclient
      </h1>
      <div className="header-menu" ref={menuRef}>
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
