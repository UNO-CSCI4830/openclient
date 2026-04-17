import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { executeRequest } from '../../../src/features/requestExecution/executeRequest'

describe('executeRequest', () => {
  const baseRequest = {
    url: 'https://api.example.com/users',
    method: 'GET',
    headers: {},
    body: null,
  }

  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  function mockFetchResponse({
    ok = true,
    status = 200,
    statusText = 'OK',
    headers = new Headers({ 'content-type': 'application/json' }),
    body = '{"data": "test"}',
  } = {}) {
    fetch.mockResolvedValueOnce({
      ok,
      status,
      statusText,
      headers,
      text: () => Promise.resolve(body),
    })
  }

  it('returns a successful JSON response', async () => {
    mockFetchResponse()

    const result = await executeRequest(baseRequest)

    expect(result.ok).toBe(true)
    expect(result.status).toBe(200)
    expect(result.statusText).toBe('OK')
    expect(result.body).toBe('{"data": "test"}')
    expect(result.contentType).toBe('application/json')
    expect(result.error).toBeNull()
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('passes request options to fetch correctly', async () => {
    mockFetchResponse()

    const request = {
      url: 'https://api.example.com/users',
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
      body: '{"name":"Alice"}',
    }

    await executeRequest(request)

    expect(fetch).toHaveBeenCalledWith('https://api.example.com/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Custom': 'value' },
      body: '{"name":"Alice"}',
      signal: undefined,
    })
  })

  it('passes abort signal to fetch', async () => {
    mockFetchResponse()

    const controller = new AbortController()
    await executeRequest(baseRequest, { signal: controller.signal })

    expect(fetch).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ signal: controller.signal })
    )
  })

  it('handles a non-ok HTTP response (4xx)', async () => {
    mockFetchResponse({
      ok: false,
      status: 404,
      statusText: 'Not Found',
      body: '{"error": "User not found"}',
    })

    const result = await executeRequest(baseRequest)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(404)
    expect(result.statusText).toBe('Not Found')
    expect(result.body).toBe('{"error": "User not found"}')
    expect(result.error).toBeNull()
  })

  it('handles a server error response (5xx)', async () => {
    mockFetchResponse({
      ok: false,
      status: 500,
      statusText: 'Internal Server Error',
      body: 'Something went wrong',
    })

    const result = await executeRequest(baseRequest)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(500)
    expect(result.error).toBeNull()
    expect(result.body).toBe('Something went wrong')
  })

  it('handles a network error (TypeError)', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await executeRequest(baseRequest)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(0)
    expect(result.statusText).toBe('')
    expect(result.headers).toEqual([])
    expect(result.body).toBe('')
    expect(result.error).toContain('Network error')
    expect(result.error).toContain('CORS')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('handles an abort error', async () => {
    const abortError = new DOMException('The operation was aborted.', 'AbortError')
    fetch.mockRejectedValueOnce(abortError)

    const result = await executeRequest(baseRequest)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(0)
    expect(result.error).toBe('Request was cancelled.')
  })

  it('handles a generic error', async () => {
    fetch.mockRejectedValueOnce(new Error('Something unexpected'))

    const result = await executeRequest(baseRequest)

    expect(result.ok).toBe(false)
    expect(result.status).toBe(0)
    expect(result.error).toBe('Something unexpected')
  })

  it('captures response headers as key-value pairs', async () => {
    const headers = new Headers()
    headers.set('content-type', 'application/json')
    headers.set('x-request-id', 'abc-123')

    mockFetchResponse({ headers })

    const result = await executeRequest(baseRequest)

    expect(result.headers).toEqual(
      expect.arrayContaining([
        ['content-type', 'application/json'],
        ['x-request-id', 'abc-123'],
      ])
    )
  })

  it('handles empty response body (204 No Content)', async () => {
    mockFetchResponse({
      status: 204,
      statusText: 'No Content',
      body: '',
      headers: new Headers(),
    })

    const result = await executeRequest(baseRequest)

    expect(result.status).toBe(204)
    expect(result.body).toBe('')
    expect(result.contentType).toBe('')
  })

  it('measures duration as a positive number', async () => {
    mockFetchResponse()

    const result = await executeRequest(baseRequest)

    expect(typeof result.durationMs).toBe('number')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })

  it('measures duration even on error', async () => {
    fetch.mockRejectedValueOnce(new TypeError('Failed to fetch'))

    const result = await executeRequest(baseRequest)

    expect(typeof result.durationMs).toBe('number')
    expect(result.durationMs).toBeGreaterThanOrEqual(0)
  })
})
