import { useState } from 'react'
import { statusCodeClass, formatResponseBody } from './formatResponse'
import './ResponseDisplay.css'

/**
 * Displays an API response inline within EndpointDetail.
 *
 * Shows status badge, duration, error banner, collapsible headers,
 * and formatted body content.
 *
 * @param {object} props
 * @param {object|null} props.request - Request descriptor from buildRequest()
 * @param {object} props.response - Result object from executeRequest()
 * @param {boolean} props.isLoading - Whether a request is in flight
 */
export default function ResponseDisplay({ request, response, isLoading }) {
  const [headersExpanded, setHeadersExpanded] = useState(false)

  if (isLoading) {
    return (
      <div className="response-display">
        {request && (
          <div className="response-display-request-url">
            {request.method} {request.url}
          </div>
        )}
        <div className="response-display-loading">Sending request...</div>
      </div>
    )
  }

  if (!response) return null

  const { formatted } = formatResponseBody(response.body, response.contentType)

  return (
    <div className="response-display">
      {request && (
        <div className="response-display-request-url">
          <span className="response-display-request-url-label">Request URL:</span>
          {request.method} {request.url}
        </div>
      )}
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
