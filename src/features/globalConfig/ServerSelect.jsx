import { useState } from 'react'
import './ServerSelect.css'

/**
 * Server base URL selector for request construction.
 *
 * Two controls that work together:
 * - A dropdown (when servers are defined) that pre-fills the URL field
 * - An always-editable text input that holds the actual base URL used for requests
 *
 * This handles all cases uniformly: no servers, absolute URLs, relative URLs, or a mix.
 *
 * @param {object} props
 * @param {Array<{ url: string, description: string }>} props.servers
 * @param {string} props.selectedUrl - The current base URL value
 * @param {function} props.onSelect - called with the new URL string
 */
export default function ServerSelect({ servers, selectedUrl, onSelect }) {
  const [selectedIndex, setSelectedIndex] = useState(0)

  function handleDropdownChange(e) {
    const index = Number(e.target.value)
    setSelectedIndex(index)
    onSelect(servers[index].url)
  }

  return (
    <div className="server-select">
      {servers.length > 0 && (
        <div className="server-select-row">
          <span className="server-select-label">Server</span>
          <select
            className="server-select-dropdown"
            value={selectedIndex}
            onChange={handleDropdownChange}
          >
            {servers.map((server, i) => (
              <option key={i} value={i}>
                {server.url}
                {server.description ? ` — ${server.description}` : ''}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="server-select-row">
        <span className="server-select-label">URL</span>
        <input
          type="text"
          className="server-select-input"
          placeholder="https://api.example.com"
          value={selectedUrl}
          onChange={(e) => onSelect(e.target.value)}
        />
      </div>
    </div>
  )
}
