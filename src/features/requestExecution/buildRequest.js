/**
 * Set a header, removing any existing key that matches case-insensitively.
 * HTTP headers are case-insensitive, so "Content-Type" and "content-type"
 * must not coexist in the same request.
 */
function setHeader(headers, name, value) {
  const lower = name.toLowerCase()
  for (const existing of Object.keys(headers)) {
    if (existing.toLowerCase() === lower) {
      delete headers[existing]
    }
  }
  headers[name] = value
}

/**
 * Constructs a fetch-ready request descriptor from an endpoint definition
 * and user-supplied values.
 *
 * This is a pure function with no side effects — it builds a plain object
 * that can be passed to fetch() or inspected before sending.
 *
 * @param {object} options
 * @param {string} options.baseUrl - Selected server URL (e.g. "https://api.example.com/v1")
 * @param {string} options.path - Endpoint path template (e.g. "/users/{userId}")
 * @param {string} options.method - HTTP method (e.g. "get", "post")
 * @param {Array} options.parameters - Endpoint parameter definitions from apiModel
 * @param {object} options.parameterValues - Values for spec-defined params, keyed by "${in}-${name}"
 * @param {Array<{key: string, value: string}>} options.customQueryParams - User-added query params
 * @param {Array<{key: string, value: string}>} options.customHeaders - User-added headers
 * @param {string|null} options.body - Raw request body string (null if no body)
 * @param {string} options.contentType - Selected content type for the body (e.g. "application/json")
 * @returns {{ url: string, method: string, headers: object, body: string|null }}
 */
export function buildRequest({
  baseUrl,
  path,
  method,
  parameters = [],
  parameterValues = {},
  customQueryParams = [],
  customHeaders = [],
  body = null,
  contentType = 'application/json',
}) {
  const headers = {}

  // Substitute path parameters
  let resolvedPath = path
  for (const param of parameters) {
    if (param.in !== 'path') continue
    const key = `path-${param.name}`
    const value = parameterValues[key] || ''
    resolvedPath = resolvedPath.replace(
      `{${param.name}}`,
      encodeURIComponent(value)
    )
  }

  // Assemble query parameters (spec-defined + custom)
  const queryParams = new URLSearchParams()

  for (const param of parameters) {
    if (param.in !== 'query') continue
    const key = `query-${param.name}`
    const value = parameterValues[key]
    if (value !== undefined && value !== '') {
      queryParams.append(param.name, value)
    }
  }

  for (const { key, value } of customQueryParams) {
    if (key.trim()) {
      queryParams.append(key, value)
    }
  }

  // Set Content-Type when body is provided (before other headers so they can override)
  let requestBody = null
  if (body !== null && body !== '') {
    setHeader(headers, 'Content-Type', contentType)
    requestBody = body
  }

  // Collect header parameters (spec-defined + custom)
  // Applied after Content-Type so user values take precedence.
  for (const param of parameters) {
    if (param.in !== 'header') continue
    const key = `header-${param.name}`
    const value = parameterValues[key]
    if (value !== undefined && value !== '') {
      setHeader(headers, param.name, value)
    }
  }

  for (const { key, value } of customHeaders) {
    if (key.trim()) {
      setHeader(headers, key, value)
    }
  }

  // Collect cookie parameters into a single Cookie header
  const cookies = []
  for (const param of parameters) {
    if (param.in !== 'cookie') continue
    const key = `cookie-${param.name}`
    const value = parameterValues[key]
    if (value !== undefined && value !== '') {
      cookies.push(`${param.name}=${value}`)
    }
  }
  if (cookies.length > 0) {
    setHeader(headers, 'Cookie', cookies.join('; '))
  }

  // Build the full URL
  const normalizedBase = baseUrl.replace(/\/+$/, '')
  const queryString = queryParams.toString()
  const url = queryString
    ? `${normalizedBase}${resolvedPath}?${queryString}`
    : `${normalizedBase}${resolvedPath}`

  return {
    url,
    method: method.toUpperCase(),
    headers,
    body: requestBody,
  }
}

