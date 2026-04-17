import { useState, useRef, useEffect } from 'react'
import {
  buildRequest,
  paramKey,
  isAbsoluteHttpUrl,
} from '../requestExecution/buildRequest'
import { executeRequest } from '../requestExecution/executeRequest'
import KeyValueEditor from '../requestExecution/KeyValueEditor'
import ResponseDisplay from '../requestExecution/ResponseDisplay'
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
 * @param {string} props.serverUrl - Global base URL from RequestConfig
 */
export default function EndpointDetail({ endpoint, serverUrl = '' }) {
  const {
    path,
    method,
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
      initialValues[paramKey(param)] = ''
    })
    return initialValues
  })

  const [requestBodyValue, setRequestBodyValue] = useState(
    buildInitialRequestBody(requestBody)
  )

  const [selectedContentType, setSelectedContentType] = useState(() => {
    if (requestBody?.content) {
      const types = Object.keys(requestBody.content)
      return types[0] || 'application/json'
    }
    return 'application/json'
  })

  const [customQueryParams, setCustomQueryParams] = useState([])
  const [customHeaders, setCustomHeaders] = useState([])
  const [requestData, setRequestData] = useState(null)
  const [responseData, setResponseData] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef(null)

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [])

  const showDescription = description && description !== summary

  const requiredParametersMissing = parameters.some((param) => {
    if (!param.required) return false
    return !parameterValues[paramKey(param)]?.trim()
  })

  const requiredBodyMissing =
    requestBody?.required && !requestBodyValue.trim()

  const serverUrlInvalid = !isAbsoluteHttpUrl(serverUrl)

  const executeDisabled =
    !isInteractive ||
    serverUrlInvalid ||
    requiredParametersMissing ||
    requiredBodyMissing ||
    isLoading

  function handleParameterChange(key, value) {
    setParameterValues((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  async function handleExecute() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const request = buildRequest({
      baseUrl: serverUrl,
      path,
      method,
      parameters,
      parameterValues,
      customQueryParams,
      customHeaders,
      body: requestBody ? requestBodyValue : null,
      contentType: selectedContentType,
    })

    setIsLoading(true)
    setRequestData(request)
    setResponseData(null)

    const result = await executeRequest(request, { signal: controller.signal })

    if (abortControllerRef.current === controller) {
      setResponseData(result)
      setIsLoading(false)
    }
  }

  function handleAbort() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  function handleExitInteractive() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsInteractive(false)
    setRequestData(null)
    setResponseData(null)
    setIsLoading(false)
  }

  const contentTypes = requestBody?.content
    ? Object.keys(requestBody.content)
    : []

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
            {isLoading ? (
              <button
                type="button"
                className="endpoint-detail-button"
                onClick={handleAbort}
              >
                Cancel
              </button>
            ) : (
              <button
                type="button"
                className="endpoint-detail-button"
                onClick={handleExitInteractive}
              >
                Done
              </button>
            )}
            <button
              type="button"
              className="endpoint-detail-button endpoint-detail-button--primary"
              disabled={executeDisabled}
              onClick={handleExecute}
            >
              {isLoading ? 'Sending...' : 'Execute'}
            </button>
          </div>
        )}
      </div>

      {isInteractive && serverUrlInvalid && (
        <p className="endpoint-detail-validation-message">
          Set an absolute server URL (https://...) in Configuration before
          executing the request.
        </p>
      )}

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
                  <th>Description</th>
                  <th>Value</th>
                </tr>
              </thead>
              <tbody>
                {parameters.map((param) => {
                  const key = paramKey(param)

                  return (
                    <tr key={key}>
                      <td className="endpoint-detail-param-name">
                        {param.name}
                        {param.required && (
                          <span className="endpoint-detail-required">required</span>
                        )}
                      </td>
                      <td>
                        <span className="endpoint-detail-location">{param.in}</span>
                      </td>
                      <td className="endpoint-detail-type">
                        {formatSchemaType(param.schema, param.schemaName)}
                      </td>
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

      {/* Custom query parameters (interactive mode only) */}
      {isInteractive && (
        <div className="endpoint-detail-section">
          <h4>Custom Query Parameters</h4>
          <KeyValueEditor
            rows={customQueryParams}
            onChange={setCustomQueryParams}
            addLabel="Add query parameter"
            keyPlaceholder="Parameter name"
            valuePlaceholder="Value"
            disabled={!isInteractive}
          />
        </div>
      )}

      {/* Custom headers (interactive mode only) */}
      {isInteractive && (
        <div className="endpoint-detail-section">
          <h4>Custom Headers</h4>
          <KeyValueEditor
            rows={customHeaders}
            onChange={setCustomHeaders}
            addLabel="Add header"
            keyPlaceholder="Header name"
            valuePlaceholder="Value"
            disabled={!isInteractive}
          />
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

          {/* Content type selector */}
          {contentTypes.length > 1 && isInteractive ? (
            <div className="endpoint-detail-content-type">
              <label className="endpoint-detail-content-type-label">
                Content Type
                <select
                  className="endpoint-detail-content-type-select"
                  value={selectedContentType}
                  onChange={(e) => setSelectedContentType(e.target.value)}
                >
                  {contentTypes.map((type) => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </label>
            </div>
          ) : (
            <div>
              {contentTypes.map((mediaType) => (
                <div key={mediaType} className="endpoint-detail-media">
                  <code className="endpoint-detail-media-type">{mediaType}</code>
                  <span className="endpoint-detail-type">
                    {formatSchemaType(
                      requestBody.content[mediaType].schema,
                      requestBody.content[mediaType].schemaName
                    )}
                  </span>
                </div>
              ))}
            </div>
          )}

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

      {/* Responses (spec-defined) */}
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

      {/* Actual response (after execution) */}
      <ResponseDisplay request={requestData} response={responseData} isLoading={isLoading} />
    </div>
  )
}
