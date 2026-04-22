import { useState, useRef, useEffect } from 'react'
import { buildRequest, paramKey } from './buildRequest'
import { executeRequest } from './executeRequest'

export function buildInitialRequestBody(requestBody) {
  if (!requestBody || !requestBody.content) return ''

  const jsonContent = requestBody.content['application/json']
  if (!jsonContent || !jsonContent.schema) return ''

  const schema = jsonContent.schema
  if (schema.example) return JSON.stringify(schema.example, null, 2)
  if (schema.default) return JSON.stringify(schema.default, null, 2)
  return ''
}

/**
 * Request-pipeline state and actions for a single endpoint. Owns user
 * inputs (param values, body, content type, custom headers/query),
 * in-flight request state, and AbortController lifecycle.
 *
 * Display concerns (interactive/read-only mode, server URL validity)
 * live in the consuming component.
 */
export function useRequestPipeline({ endpoint, serverUrl }) {
  const { path, method, parameters = [], requestBody } = endpoint

  const [parameterValues, setParameterValues] = useState(() => {
    const initialValues = {}
    parameters.forEach((param) => {
      initialValues[paramKey(param)] = ''
    })
    return initialValues
  })

  const [requestBodyValue, setRequestBodyValue] = useState(() =>
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

  const requiredParametersMissing = parameters.some((param) => {
    if (!param.required) return false
    return !parameterValues[paramKey(param)]?.trim()
  })

  const requiredBodyMissing =
    requestBody?.required && !requestBodyValue.trim()

  function setParameterValue(key, value) {
    setParameterValues((prev) => ({ ...prev, [key]: value }))
  }

  async function execute() {
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

  function abort() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
  }

  // Clear in-flight + last-request state; aborts and disowns any pending
  // executeRequest continuation so it can't write a stale response.
  function reset() {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setRequestData(null)
    setResponseData(null)
    setIsLoading(false)
  }

  return {
    parameterValues,
    setParameterValue,
    requestBodyValue,
    setRequestBodyValue,
    selectedContentType,
    setSelectedContentType,
    customQueryParams,
    setCustomQueryParams,
    customHeaders,
    setCustomHeaders,
    requestData,
    responseData,
    isLoading,
    requiredParametersMissing,
    requiredBodyMissing,
    execute,
    abort,
    reset,
  }
}
