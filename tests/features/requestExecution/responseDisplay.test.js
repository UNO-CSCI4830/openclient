import { describe, it, expect } from 'vitest'
import {
  escapeXmlText,
  escapeXmlAttr,
} from '../../../src/features/requestExecution/formatResponse'

describe('escapeXmlText', () => {
  it('escapes ampersands', () => {
    expect(escapeXmlText('rock & roll')).toBe('rock &amp; roll')
  })

  it('escapes angle brackets', () => {
    expect(escapeXmlText('a < b > c')).toBe('a &lt; b &gt; c')
  })

  it('does not escape quotes', () => {
    expect(escapeXmlText('say "hi"')).toBe('say "hi"')
  })

  it('escapes ampersand before other characters so it is not double-escaped', () => {
    expect(escapeXmlText('&lt; already')).toBe('&amp;lt; already')
  })
})

describe('escapeXmlAttr', () => {
  it('escapes quotes in addition to the text escapes', () => {
    expect(escapeXmlAttr('he said "hi"')).toBe('he said &quot;hi&quot;')
  })

  it('escapes ampersands and angle brackets', () => {
    expect(escapeXmlAttr('a & b < c')).toBe('a &amp; b &lt; c')
  })
})
