import { useState } from 'react'
import './EndpointDetail.css'

/**
 * Return a readable type string for a schema.
 */
function formatSchemaType(schema, schemaName) {
  if (schemaName) return schemaName
  if (!schema) return 'any'
  if (schema.type === 'array') {
    const itemType = schema.items
      ? formatSchemaType(schema.items, null)
      : 'any'
    return `array of ${itemType}`
  }
  return schema.type || 'object'
}

/**
 * Return a CSS modifier class for an HTTP status code.
 */
function statusCodeClass(code) {
  const num = parseInt(code, 10)
  if (num >= 200 && num < 300) return 'endpoint-detail-status--2xx'
  if (num >= 300 && num < 400) return 'endpoint-detail-status--3xx'
  if (num >= 400 && num < 500) return 'endpoint-detail-status--4xx'
  return 'endpoint-detail-status--5xx'
}

/**
 * Build a default request body text from requestBody content.
 */
function buildInitialRequestBody(requestBody) {
  if (!requestBody || !requestBody.content) return ''

  const jsonContent = requestBody.content['application/json']
  if (!jsonContent || !jsonContent.schema) return ''

  const schema = jsonContent.schema

  if (schema.example) {
    return JSON.stringify(schema.example, null, 2)
  }

  if (schema.default) {
    return JSON.stringify(schema.default, null, 2)
  }

  return ''
}

/**
 * Expandable detail panel for a single endpoint.
 *
 * @param {object} props
 * @param {object} props.endpoint - A single endpoint from apiModel.endpoints
 */
export default function EndpointDetail({ endpoint }) {
  const {
    description,
    summary,
    operationId,
    deprecated,
    parameters = [],
    requestBody,
    responses = [],
  } = endpoint

  const [isInteractive, setIsInteractive] = useState(false)

  const [parameterValues, setParameterValues] = useState(() => {
    const initialValues = {}
    parameters.forEach((param) => {
      initialValues[`${param.in}-${param.name}`] = ''
    })
    return initialValues
  })

  const [requestBodyValue, setRequestBodyValue] = useState(
    buildInitialRequestBody(requestBody)
  )

  const showDescription = description && description !== summary

  const requiredParametersMissing = parameters.some((param) => {
    if (!param.required) return false
    const key = `${param.in}-${param.name}`
    return !parameterValues[key]?.trim()
  })

  const requiredBodyMissing =
    requestBody?.required && !requestBodyValue.trim()

  const executeDisabled =
    !isInteractive || requiredParametersMissing || requiredBodyMissing

  function handleParameterChange(key, value) {
    setParameterValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  return (
    <div className="endpoint-detail">
      <div className="endpoint-detail-mode-bar">
        <span className="endpoint-detail-mode-label">
          Mode: {isInteractive ? 'Interactive' : 'Read-only'}
        </span>

        {!isInteractive ? (
          <button
            type="button"
            className="endpoint-detail-button endpoint-detail-button--primary"
            onClick={() => setIsInteractive(true)}
          >
            Try it out
          </button>
        ) : (
          <div className="endpoint-detail-actions">
            <button
              type="button"
              className="endpoint-detail-button"
              onClick={() => setIsInteractive(false)}
            >
              Cancel
            </button>
            <button
              type="button"
              className="endpoint-detail-button endpoint-detail-button--primary"
              disabled={executeDisabled}
            >
              Execute
            </button>
          </div>
        )}
      </div>

      {/* Header area */}
      {(showDescription || operationId || deprecated) && (
        <div className="endpoint-detail-header">
          {deprecated && (
            <span className="endpoint-detail-deprecated">Deprecated</span>
          )}
          {operationId && (
            <span className="endpoint-detail-operation-id">{operationId}</span>
          )}
          {showDescription && (
            <p className="endpoint-detail-description">{description}</p>
          )}
        </div>
      )}

      {/* Parameters */}
      {parameters.length > 0 && (
        <div className="endpoint-detail-section">
          <h4>
            {parameters.length === 1
              ? '1 Parameter'
              : `${parameters.length} Parameters`}
          </h4>
          <div className="endpoint-detail-table-wrap">
            <table className="endpoint-detail-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Location</th>
                  <th>Type</th>
                  <th>Required</th>
                  <th>Description</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => {
                  const key = `${param.in}-${param.name}`

                  return (
                    <tr key={key}>
                      <td className="endpoint-detail-param-name">
                        {param.name}
                      </td>
                      <td>
                        <span className="endpoint-detail-location">{param.in}</span>
                      </td>
                      <td className="endpoint-detail-type">
                        {formatSchemaType(param.schema, param.schemaName)}
                      </td>
                      <td>{param.required ? 'Yes' : 'No'}</td>
                      <td>{param.description}</td>
                      <td>
                        <input
                          type="text"
                          className="endpoint-detail-input"
                          placeholder={
                            isInteractive
                              ? `Enter ${param.name}`
                              : 'Read-only'
                          }
                          value={parameterValues[key]}
                          onChange={(e) =>
                            handleParameterChange(key, e.target.value)
                          }
                          disabled={!isInteractive}
                        />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {isInteractive && requiredParametersMissing && (
            <p className="endpoint-detail-validation-message">
              Fill in all required parameters before executing the request.
            </p>
          )}
        </div>
      )}

      {/* Request Body */}
      {requestBody && (
        <div className="endpoint-detail-section">
          <h4>
            Request Body
            {requestBody.required && (
              <span className="endpoint-detail-required">required</span>
            )}
          </h4>
          {requestBody.description && (
            <p className="endpoint-detail-body-desc">{requestBody.description}</p>
          )}
          {Object.entries(requestBody.content).map(([mediaType, media]) => (
            <div key={mediaType} className="endpoint-detail-media">
              <code className="endpoint-detail-media-type">{mediaType}</code>
              <span className="endpoint-detail-type">
                {formatSchemaType(media.schema, media.schemaName)}
              </span>
            </div>
          ))}

          <textarea
            className="endpoint-detail-textarea"
            placeholder={
              isInteractive
                ? 'Enter request body...'
                : 'Request body is read-only until Try it out is enabled.'
            }
            value={requestBodyValue}
            onChange={(e) => setRequestBodyValue(e.target.value)}
            disabled={!isInteractive}
          />

          {isInteractive && requiredBodyMissing && (
            <p className="endpoint-detail-validation-message">
              Request body is required before executing the request.
            </p>
          )}
        </div>
      )}

      {/* Responses */}
      {responses.length > 0 && (
        <div className="endpoint-detail-section">
          <h4>
            {responses.length === 1
              ? '1 Response'
              : `${responses.length} Responses`}
          </h4>
          <div className="endpoint-detail-responses">
            {responses.map((resp) => (
              <div key={resp.statusCode} className="endpoint-detail-response">
                <span
                  className={`endpoint-detail-status ${statusCodeClass(resp.statusCode)}`}
                >
                  {resp.statusCode}
                </span>
                <span className="endpoint-detail-response-desc">
                  {resp.description}
                </span>
                {Object.entries(resp.content).map(([mediaType, media]) => (
                  <span key={mediaType} className="endpoint-detail-response-media">
                    <code>{mediaType}</code>{' '}
                    <span className="endpoint-detail-type">
                      {formatSchemaType(media.schema, media.schemaName)}
                    </span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}