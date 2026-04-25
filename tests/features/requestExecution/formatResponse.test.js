import { describe, expect, it } from 'vitest'
import {
  escapeXmlAttr,
  escapeXmlText,
  formatResponseBody,
  prettyPrintXml,
  statusCodeClass,
} from '../../../src/features/requestExecution/formatResponse'

describe('formatResponse helpers', () => {
  it('returns the correct status class for 2xx, 3xx, 4xx, and 5xx codes', () => {
    expect(statusCodeClass(200)).toBe('response-display-status--2xx')
    expect(statusCodeClass(302)).toBe('response-display-status--3xx')
    expect(statusCodeClass(404)).toBe('response-display-status--4xx')
    expect(statusCodeClass(500)).toBe('response-display-status--5xx')
  })

  it('pretty prints valid JSON response bodies', () => {
    const result = formatResponseBody('{"name":"Jamshed","active":true}', 'application/json')

    expect(result.language).toBe('json')
    expect(result.formatted).toBe(JSON.stringify({ name: 'Jamshed', active: true }, null, 2))
  })

  it('falls back to text when JSON parsing fails', () => {
    const result = formatResponseBody('{bad json}', 'application/json')

    expect(result.language).toBe('text')
    expect(result.formatted).toBe('{bad json}')
  })

  it('returns an empty response message for an empty body', () => {
    const result = formatResponseBody('', 'application/json')

    expect(result.language).toBe('text')
    expect(result.formatted).toBe('(empty response)')
  })

  it('escapes XML text characters correctly', () => {
    expect(escapeXmlText('5 < 10 & 10 > 5')).toBe('5 &lt; 10 &amp; 10 &gt; 5')
  })

  it('escapes XML attribute quotes correctly', () => {
    expect(escapeXmlAttr('name="test" & value')).toBe('name=&quot;test&quot; &amp; value')
  })

  
})