export default function Header() {
  const handleClick = () => {
    window.location.reload()
  }

  return (
    <header className="app-header">
      <h1 onClick={handleClick}>openclient</h1>
    </header>
  )
}