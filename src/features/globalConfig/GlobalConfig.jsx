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
export default function GlobalConfig({
  servers,
  serverUrl,
  onServerUrlChange,
  environmentVariables = [],
  onEnvironmentVariablesChange,
}) {
  const [collapsed, setCollapsed] = useState(false)

  // FR15: helper functions
  function addEnvironmentVariable() {
    onEnvironmentVariablesChange((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: '', value: '' },
    ])
  }

  function updateEnvironmentVariable(index, field, value) {
    onEnvironmentVariablesChange((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    )
  }

  function removeEnvironmentVariable(index) {
    onEnvironmentVariablesChange((prev) => prev.filter((_, i) => i !== index))
  }

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

          {/* FR15: Environment Variables UI */}
          <div className="environment-variables">
            <div className="environment-variables-header">
              <h3>Environment Variables</h3>
              <button type="button" onClick={addEnvironmentVariable}>
                + Add variable
              </button>
            </div>

            {environmentVariables.length === 0 ? (
              <p className="environment-variables-empty">
                No environment variables added yet.
              </p>
            ) : (
              <div className="environment-variables-list">
                {environmentVariables.map((variable, index) => (
                  <div className="environment-variable-row" key={variable.id}>
                    <input
                      type="text"
                      placeholder="name"
                      value={variable.name}
                      onChange={(e) =>
                        updateEnvironmentVariable(index, 'name', e.target.value)
                      }
                    />
                    <input
                      type="text"
                      placeholder="value"
                      value={variable.value}
                      onChange={(e) =>
                        updateEnvironmentVariable(index, 'value', e.target.value)
                      }
                    />
                    <button
                      type="button"
                      onClick={() => removeEnvironmentVariable(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}
    </section>
  )
}