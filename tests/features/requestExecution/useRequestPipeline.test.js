import { describe, it, expect } from 'vitest'
import { buildInitialRequestBody } from '../../../src/features/requestExecution/useRequestPipeline'
import { paramKey } from '../../../src/features/requestExecution/buildRequest'

function initParamValues(parameters) {
  const initialValues = {}
  parameters.forEach((param) => {
    initialValues[paramKey(param)] = ''
  })
  return initialValues
}

function initSelectedContentType(requestBody) {
  if (requestBody?.content) {
    const types = Object.keys(requestBody.content)
    return types[0] || 'application/json'
  }
  return 'application/json'
}

function deriveRequiredParametersMissing(parameters, parameterValues) {
  return parameters.some((param) => {
    if (!param.required) return false
    return !parameterValues[paramKey(param)]?.trim()
  })
}

function deriveRequiredBodyMissing(requestBody, requestBodyValue) {
  return requestBody?.required && !requestBodyValue.trim()
}

describe('buildInitialRequestBody — empty cases', () => {
  it('returns empty string when requestBody is null', () => {
    expect(buildInitialRequestBody(null)).toBe('')
  })

  it('returns empty string when requestBody has no content property', () => {
    expect(buildInitialRequestBody({})).toBe('')
  })

  it('returns empty string when content has no application/json key', () => {
    expect(buildInitialRequestBody({ content: { 'text/plain': {} } })).toBe('')
  })

  it('returns empty string when application/json entry has no schema', () => {
    expect(buildInitialRequestBody({ content: { 'application/json': {} } })).toBe('')
  })

  it('returns empty string when schema has neither example nor default', () => {
    expect(
      buildInitialRequestBody({ content: { 'application/json': { schema: { type: 'object' } } } })
    ).toBe('')
  })
})

describe('buildInitialRequestBody — example vs default', () => {
  const wrap = (schema) => ({ content: { 'application/json': { schema } } })

  it('returns pretty-printed JSON of schema.example', () => {
    const example = { id: 1, name: 'Alice' }
    expect(buildInitialRequestBody(wrap({ example }))).toBe(JSON.stringify(example, null, 2))
  })

  it('returns pretty-printed JSON of schema.default when no example', () => {
    const def = { status: 'active' }
    expect(buildInitialRequestBody(wrap({ default: def }))).toBe(JSON.stringify(def, null, 2))
  })

  it('prefers schema.example over schema.default', () => {
    const example = { preferred: true }
    const def = { preferred: false }
    expect(buildInitialRequestBody(wrap({ example, default: def }))).toBe(
      JSON.stringify(example, null, 2)
    )
  })

  it('falls back to empty string when neither example nor default exists', () => {
    expect(buildInitialRequestBody(wrap({}))).toBe('')
  })
})

describe('initial parameterValues', () => {
  it('seeds every parameter to an empty string keyed by paramKey', () => {
    const parameters = [
      { in: 'query', name: 'search' },
      { in: 'path', name: 'id' },
      { in: 'header', name: 'X-Token' },
    ]
    const values = initParamValues(parameters)
    for (const param of parameters) {
      expect(values[paramKey(param)]).toBe('')
    }
  })

  it('returns an empty object when there are no parameters', () => {
    expect(initParamValues([])).toEqual({})
  })

  it('keys are in the format "{in}-{name}"', () => {
    const param = { in: 'query', name: 'limit' }
    const values = initParamValues([param])
    expect(Object.keys(values)).toEqual(['query-limit'])
  })
})

describe('initial selectedContentType', () => {
  it('defaults to application/json when there is no requestBody', () => {
    expect(initSelectedContentType(undefined)).toBe('application/json')
  })

  it('defaults to application/json when requestBody has no content', () => {
    expect(initSelectedContentType({ required: true })).toBe('application/json')
  })

  it('uses the first key of requestBody.content', () => {
    const requestBody = { content: { 'application/xml': {}, 'application/json': {} } }
    expect(initSelectedContentType(requestBody)).toBe('application/xml')
  })

  it('uses application/json when it is the only content type', () => {
    const requestBody = { content: { 'application/json': {} } }
    expect(initSelectedContentType(requestBody)).toBe('application/json')
  })
})

describe('requiredParametersMissing derivation', () => {
  it('is false when there are no parameters', () => {
    expect(deriveRequiredParametersMissing([], {})).toBe(false)
  })

  it('is true when a required parameter has an empty string value', () => {
    const param = { in: 'query', name: 'q', required: true }
    const values = initParamValues([param])
    expect(deriveRequiredParametersMissing([param], values)).toBe(true)
  })

  it('is true when a required parameter value is whitespace only', () => {
    const param = { in: 'query', name: 'q', required: true }
    const values = { [paramKey(param)]: '   ' }
    expect(deriveRequiredParametersMissing([param], values)).toBe(true)
  })

  it('is false when all required parameters have non-whitespace values', () => {
    const param = { in: 'query', name: 'q', required: true }
    const values = { [paramKey(param)]: 'hello' }
    expect(deriveRequiredParametersMissing([param], values)).toBe(false)
  })

  it('ignores optional parameters', () => {
    const param = { in: 'query', name: 'optional', required: false }
    const values = initParamValues([param]) // value is ''
    expect(deriveRequiredParametersMissing([param], values)).toBe(false)
  })

  it('is true when at least one of multiple required params is empty', () => {
    const a = { in: 'query', name: 'a', required: true }
    const b = { in: 'query', name: 'b', required: true }
    const values = { [paramKey(a)]: 'filled', [paramKey(b)]: '' }
    expect(deriveRequiredParametersMissing([a, b], values)).toBe(true)
  })

  it('is false when all required params are filled even if optional ones are empty', () => {
    const required = { in: 'query', name: 'req', required: true }
    const optional = { in: 'query', name: 'opt', required: false }
    const values = { [paramKey(required)]: 'value', [paramKey(optional)]: '' }
    expect(deriveRequiredParametersMissing([required, optional], values)).toBe(false)
  })
})

describe('requiredBodyMissing derivation', () => {
  it('is falsy when there is no requestBody', () => {
    expect(deriveRequiredBodyMissing(undefined, '')).toBeFalsy()
  })

  it('is falsy when requestBody.required is false', () => {
    expect(deriveRequiredBodyMissing({ required: false }, '')).toBeFalsy()
  })

  it('is falsy when requestBody.required is false and body is also empty', () => {
    expect(deriveRequiredBodyMissing({ required: false }, '')).toBeFalsy()
  })

  it('is true when requestBody.required is true and body is empty string', () => {
    expect(deriveRequiredBodyMissing({ required: true }, '')).toBe(true)
  })

  it('is true when requestBody.required is true and body is whitespace only', () => {
    expect(deriveRequiredBodyMissing({ required: true }, '   ')).toBe(true)
  })

  it('is false when requestBody.required is true and body has content', () => {
    expect(deriveRequiredBodyMissing({ required: true }, '{"key":"value"}')).toBe(false)
  })

  it('is false when requestBody.required is true and body has whitespace-padded content', () => {
    expect(deriveRequiredBodyMissing({ required: true }, '  {"a":1}  ')).toBe(false)
  })
})
