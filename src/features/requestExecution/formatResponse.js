/**
 * Pure formatting helpers for ResponseDisplay. Kept in a separate module
 * so they can be unit-tested without rendering the component.
 */

export function escapeXmlText(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function escapeXmlAttr(value) {
  return escapeXmlText(value).replace(/"/g, '&quot;')
}

/**
 * Return a CSS modifier class for an HTTP status code.
 */
export function statusCodeClass(code) {
  if (code >= 200 && code < 300) return 'response-display-status--2xx'
  if (code >= 300 && code < 400) return 'response-display-status--3xx'
  if (code >= 400 && code < 500) return 'response-display-status--4xx'
  return 'response-display-status--5xx'
}

/**
 * Pretty-print an XML string using DOMParser.
 * Returns the original string if parsing fails.
 */
export function prettyPrintXml(xml) {
  const doc = new DOMParser().parseFromString(xml, 'application/xml')
  if (doc.querySelector('parsererror')) return xml

  const lines = []
  function walk(node, depth) {
    const indent = '  '.repeat(depth)
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent.trim()
      if (text) lines.push(`${indent}${escapeXmlText(text)}`)
      return
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return

    const attrs = Array.from(node.attributes)
      .map((a) => ` ${a.name}="${escapeXmlAttr(a.value)}"`)
      .join('')

    if (node.childNodes.length === 0) {
      lines.push(`${indent}<${node.tagName}${attrs}/>`)
    } else if (
      node.childNodes.length === 1 &&
      node.childNodes[0].nodeType === Node.TEXT_NODE
    ) {
      const text = escapeXmlText(node.childNodes[0].textContent.trim())
      lines.push(`${indent}<${node.tagName}${attrs}>${text}</${node.tagName}>`)
    } else {
      lines.push(`${indent}<${node.tagName}${attrs}>`)
      for (const child of node.childNodes) {
        walk(child, depth + 1)
      }
      lines.push(`${indent}</${node.tagName}>`)
    }
  }

  lines.push(`<?xml version="1.0" encoding="UTF-8"?>`)
  walk(doc.documentElement, 0)
  return lines.join('\n')
}

/**
 * Format the response body for display based on content type.
 */
export function formatResponseBody(body, contentType) {
  if (!body) return { formatted: '(empty response)', language: 'text' }

  if (contentType.includes('application/json')) {
    try {
      const parsed = JSON.parse(body)
      return { formatted: JSON.stringify(parsed, null, 2), language: 'json' }
    } catch {
      return { formatted: body, language: 'text' }
    }
  }

  if (contentType.includes('xml')) {
    return { formatted: prettyPrintXml(body), language: 'xml' }
  }

  if (contentType.includes('text/') || contentType.includes('html')) {
    return { formatted: body, language: 'text' }
  }

  if (body.length > 0) {
    return { formatted: `Binary content (${body.length} bytes)`, language: 'text' }
  }

  return { formatted: body, language: 'text' }
}
