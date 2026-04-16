import { useState } from 'react'
import ServerSelect from './ServerSelect'
import './GlobalConfig.css'

/**
 * Collapsible global configuration panel. Manages session-level settings
 * shared across all endpoints. Sub-components handle individual concerns
 * (server selection, auth, headers, etc.).
 *
 * @param {object} props
 * @param {Array<{ url: string, description: string }>} props.servers
 * @param {string} props.serverUrl
 * @param {function} props.onServerUrlChange
 */
export default function GlobalConfig({ servers, serverUrl, onServerUrlChange }) {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <section className="global-config">
      <button
        type="button"
        className="global-config-header"
        onClick={() => setCollapsed((prev) => !prev)}
        aria-expanded={!collapsed}
      >
        <span className="global-config-chevron">
          {collapsed ? '\u25B6' : '\u25BC'}
        </span>
        <h2>Configuration</h2>
      </button>

      {!collapsed && (
        <div className="global-config-body">
          <ServerSelect
            servers={servers}
            selectedUrl={serverUrl}
            onSelect={onServerUrlChange}
          />
        </div>
      )}
    </section>
  )
}
