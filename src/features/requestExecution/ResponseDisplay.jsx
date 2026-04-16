import { useState } from 'react'
import './ResponseDisplay.css'

/**
 * Return a CSS modifier class for an HTTP status code.
 */
function statusCodeClass(code) {
  if (code >= 200 && code < 300) return 'response-display-status--2xx'
  if (code >= 300 && code < 400) return 'response-display-status--3xx'
  if (code >= 400 && code < 500) return 'response-display-status--4xx'
  return 'response-display-status--5xx'
}

/**
 * Format the response body for display based on content type.
 */
function formatResponseBody(body, contentType) {
  if (!body) return { formatted: '(empty response)', language: 'text' }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body)
      return { formatted: JSON.stringify(parsed, null, 2), language: 'json' }
    } catch {
      return { formatted: body, language: 'text' }
    }
  }

  if (
    contentType.includes('text/') ||
    contentType.includes('xml') ||
    contentType.includes('html')
  ) {
    return { formatted: body, language: 'text' }
  }

  if (body.length > 0) {
    return { formatted: `Binary content (${body.length} bytes)`, language: 'text' }
  }

  return { formatted: body, language: 'text' }
}

/**
 * Displays an API response inline within EndpointDetail.
 *
 * Shows status badge, duration, error banner, collapsible headers,
 * and formatted body content.
 *
 * @param {object} props
 * @param {object} props.response - Result object from executeRequest()
 * @param {boolean} props.isLoading - Whether a request is in flight
 */
export default function ResponseDisplay({ response, isLoading }) {
  const [headersExpanded, setHeadersExpanded] = useState(false)

  if (isLoading) {
    return (
      <div className="response-display">
        <div className="response-display-loading">Sending request...</div>
      </div>
    )
  }

  if (!response) return null

  const { formatted } = formatResponseBody(response.body, response.contentType)

  return (
    <div className="response-display">
      <h4>Response</h4>

      {/* Status line */}
      <div className="response-display-status-line">
        {response.error ? (
          <span className="response-display-status response-display-status--error">
            Error
          </span>
        ) : (
          <span
            className={`response-display-status ${statusCodeClass(response.status)}`}
          >
            {response.status} {response.statusText}
          </span>
        )}
        <span className="response-display-duration">
          {response.durationMs} ms
        </span>
      </div>

      {/* Error banner */}
      {response.error && (
        <div className="response-display-error">{response.error}</div>
      )}

      {/* Response headers */}
      {response.headers.length > 0 && (
        <div className="response-display-section">
          <button
            type="button"
            className="response-display-toggle"
            onClick={() => setHeadersExpanded((prev) => !prev)}
            aria-expanded={headersExpanded}
          >
            <span className="response-display-chevron">
              {headersExpanded ? '\u25BC' : '\u25B6'}
            </span>
            Headers ({response.headers.length})
          </button>

          {headersExpanded && (
            <table className="response-display-headers-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {response.headers.map(([name, value], i) => (
                  <tr key={i}>
                    <td className="response-display-header-name">{name}</td>
                    <td className="response-display-header-value">{value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* Response body */}
      {!response.error && (
        <div className="response-display-section">
          <div className="response-display-body-label">Body</div>
          <pre className="response-display-body">
            <code>{formatted}</code>
          </pre>
        </div>
      )}
    </div>
  )
}
