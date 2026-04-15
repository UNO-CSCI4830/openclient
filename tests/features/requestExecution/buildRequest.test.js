import { describe, it, expect } from 'vitest'
import { buildRequest } from '../../../src/features/requestExecution/buildRequest'

describe('buildRequest', () => {
  const defaults = {
    baseUrl: 'https://api.example.com/v1',
    path: '/users',
    method: 'get',
    parameters: [],
    parameterValues: {},
    customQueryParams: [],
    customHeaders: [],
    body: null,
    contentType: 'application/json',
  }

  it('builds a basic GET with no parameters', () => {
    const result = buildRequest(defaults)

    expect(result).toEqual({
      url: 'https://api.example.com/v1/users',
      method: 'GET',
      headers: {},
      body: null,
    })
  })

  it('uppercases the HTTP method', () => {
    const result = buildRequest({ ...defaults, method: 'post' })
    expect(result.method).toBe('POST')
  })

  it('strips trailing slash from base URL', () => {
    const result = buildRequest({
      ...defaults,
      baseUrl: 'https://api.example.com/v1/',
    })
    expect(result.url).toBe('https://api.example.com/v1/users')
  })

  it('strips multiple trailing slashes from base URL', () => {
    const result = buildRequest({
      ...defaults,
      baseUrl: 'https://api.example.com/v1///',
    })
    expect(result.url).toBe('https://api.example.com/v1/users')
  })

  describe('path parameters', () => {
    it('substitutes a single path parameter', () => {
      const result = buildRequest({
        ...defaults,
        path: '/users/{userId}',
        parameters: [{ name: 'userId', in: 'path', required: true }],
        parameterValues: { 'path-userId': '123' },
      })
      expect(result.url).toBe('https://api.example.com/v1/users/123')
    })

    it('substitutes multiple path parameters', () => {
      const result = buildRequest({
        ...defaults,
        path: '/users/{userId}/posts/{postId}',
        parameters: [
          { name: 'userId', in: 'path', required: true },
          { name: 'postId', in: 'path', required: true },
        ],
        parameterValues: {
          'path-userId': '42',
          'path-postId': '7',
        },
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users/42/posts/7'
      )
    })

    it('encodes special characters in path parameters', () => {
      const result = buildRequest({
        ...defaults,
        path: '/users/{name}',
        parameters: [{ name: 'name', in: 'path', required: true }],
        parameterValues: { 'path-name': 'John Doe' },
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users/John%20Doe'
      )
    })

    it('uses empty string for missing path parameter values', () => {
      const result = buildRequest({
        ...defaults,
        path: '/users/{userId}',
        parameters: [{ name: 'userId', in: 'path', required: true }],
        parameterValues: {},
      })
      expect(result.url).toBe('https://api.example.com/v1/users/')
    })
  })

  describe('query parameters', () => {
    it('appends spec-defined query parameters', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [
          { name: 'page', in: 'query' },
          { name: 'limit', in: 'query' },
        ],
        parameterValues: {
          'query-page': '2',
          'query-limit': '10',
        },
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users?page=2&limit=10'
      )
    })

    it('skips empty optional query parameters', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [
          { name: 'page', in: 'query' },
          { name: 'filter', in: 'query' },
        ],
        parameterValues: {
          'query-page': '1',
          'query-filter': '',
        },
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users?page=1'
      )
    })

    it('includes custom query parameters', () => {
      const result = buildRequest({
        ...defaults,
        customQueryParams: [
          { key: 'debug', value: 'true' },
          { key: 'format', value: 'json' },
        ],
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users?debug=true&format=json'
      )
    })

    it('skips custom query params with empty keys', () => {
      const result = buildRequest({
        ...defaults,
        customQueryParams: [
          { key: '', value: 'ignored' },
          { key: 'valid', value: 'kept' },
        ],
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users?valid=kept'
      )
    })

    it('combines spec-defined and custom query parameters', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [{ name: 'page', in: 'query' }],
        parameterValues: { 'query-page': '1' },
        customQueryParams: [{ key: 'debug', value: 'true' }],
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users?page=1&debug=true'
      )
    })

    it('allows custom query params with empty values', () => {
      const result = buildRequest({
        ...defaults,
        customQueryParams: [{ key: 'flag', value: '' }],
      })
      expect(result.url).toBe(
        'https://api.example.com/v1/users?flag='
      )
    })
  })

  describe('header parameters', () => {
    it('collects spec-defined header parameters', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [{ name: 'X-Request-ID', in: 'header' }],
        parameterValues: { 'header-X-Request-ID': 'abc-123' },
      })
      expect(result.headers['X-Request-ID']).toBe('abc-123')
    })

    it('skips empty header parameter values', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [{ name: 'X-Optional', in: 'header' }],
        parameterValues: { 'header-X-Optional': '' },
      })
      expect(result.headers).not.toHaveProperty('X-Optional')
    })

    it('includes custom headers', () => {
      const result = buildRequest({
        ...defaults,
        customHeaders: [
          { key: 'Authorization', value: 'Bearer token123' },
          { key: 'X-Custom', value: 'hello' },
        ],
      })
      expect(result.headers['Authorization']).toBe('Bearer token123')
      expect(result.headers['X-Custom']).toBe('hello')
    })

    it('skips custom headers with empty keys', () => {
      const result = buildRequest({
        ...defaults,
        customHeaders: [
          { key: '', value: 'ignored' },
          { key: 'X-Valid', value: 'kept' },
        ],
      })
      expect(Object.keys(result.headers)).toEqual(['X-Valid'])
      expect(result.headers['X-Valid']).toBe('kept')
    })

    it('combines spec-defined and custom headers', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [{ name: 'X-API-Key', in: 'header' }],
        parameterValues: { 'header-X-API-Key': 'key123' },
        customHeaders: [{ key: 'X-Debug', value: 'true' }],
      })
      expect(result.headers['X-API-Key']).toBe('key123')
      expect(result.headers['X-Debug']).toBe('true')
    })

    it('custom Content-Type header overrides auto-set Content-Type', () => {
      const result = buildRequest({
        ...defaults,
        method: 'post',
        body: '{"name":"Alice"}',
        contentType: 'application/json',
        customHeaders: [{ key: 'Content-Type', value: 'text/plain' }],
      })
      expect(result.headers['Content-Type']).toBe('text/plain')
      expect(Object.keys(result.headers).filter(
        (k) => k.toLowerCase() === 'content-type'
      )).toHaveLength(1)
    })

    it('lowercase content-type header overrides auto-set Content-Type', () => {
      const result = buildRequest({
        ...defaults,
        method: 'post',
        body: '{"name":"Alice"}',
        contentType: 'application/json',
        customHeaders: [{ key: 'content-type', value: 'application/xml' }],
      })
      expect(result.headers['content-type']).toBe('application/xml')
      expect(result.headers['Content-Type']).toBeUndefined()
      expect(Object.keys(result.headers).filter(
        (k) => k.toLowerCase() === 'content-type'
      )).toHaveLength(1)
    })
  })

  describe('cookie parameters', () => {
    it('assembles cookies into a single Cookie header', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [
          { name: 'session', in: 'cookie' },
          { name: 'theme', in: 'cookie' },
        ],
        parameterValues: {
          'cookie-session': 'abc123',
          'cookie-theme': 'dark',
        },
      })
      expect(result.headers['Cookie']).toBe('session=abc123; theme=dark')
    })

    it('skips empty cookie values', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [
          { name: 'session', in: 'cookie' },
          { name: 'optional', in: 'cookie' },
        ],
        parameterValues: {
          'cookie-session': 'abc123',
          'cookie-optional': '',
        },
      })
      expect(result.headers['Cookie']).toBe('session=abc123')
    })

    it('omits Cookie header when no cookie values are set', () => {
      const result = buildRequest({
        ...defaults,
        parameters: [{ name: 'session', in: 'cookie' }],
        parameterValues: { 'cookie-session': '' },
      })
      expect(result.headers).not.toHaveProperty('Cookie')
    })
  })

  describe('request body', () => {
    it('includes body and sets Content-Type', () => {
      const result = buildRequest({
        ...defaults,
        method: 'post',
        body: '{"name":"Alice"}',
        contentType: 'application/json',
      })
      expect(result.body).toBe('{"name":"Alice"}')
      expect(result.headers['Content-Type']).toBe('application/json')
    })

    it('handles non-JSON content types', () => {
      const result = buildRequest({
        ...defaults,
        method: 'post',
        body: '<user><name>Alice</name></user>',
        contentType: 'application/xml',
      })
      expect(result.body).toBe('<user><name>Alice</name></user>')
      expect(result.headers['Content-Type']).toBe('application/xml')
    })

    it('excludes body when null', () => {
      const result = buildRequest({
        ...defaults,
        body: null,
      })
      expect(result.body).toBeNull()
      expect(result.headers).not.toHaveProperty('Content-Type')
    })

    it('excludes body when empty string', () => {
      const result = buildRequest({
        ...defaults,
        body: '',
      })
      expect(result.body).toBeNull()
      expect(result.headers).not.toHaveProperty('Content-Type')
    })
  })

  describe('combined scenarios', () => {
    it('handles path + query + header + body together', () => {
      const result = buildRequest({
        baseUrl: 'https://api.example.com',
        path: '/users/{userId}/posts',
        method: 'post',
        parameters: [
          { name: 'userId', in: 'path', required: true },
          { name: 'draft', in: 'query' },
          { name: 'X-Request-ID', in: 'header' },
        ],
        parameterValues: {
          'path-userId': '42',
          'query-draft': 'true',
          'header-X-Request-ID': 'req-001',
        },
        customQueryParams: [{ key: 'verbose', value: '1' }],
        customHeaders: [{ key: 'X-Debug', value: 'on' }],
        body: '{"title":"Hello"}',
        contentType: 'application/json',
      })

      expect(result.url).toBe(
        'https://api.example.com/users/42/posts?draft=true&verbose=1'
      )
      expect(result.method).toBe('POST')
      expect(result.headers).toEqual({
        'X-Request-ID': 'req-001',
        'X-Debug': 'on',
        'Content-Type': 'application/json',
      })
      expect(result.body).toBe('{"title":"Hello"}')
    })

    it('works with no parameters at all', () => {
      const result = buildRequest({
        baseUrl: 'https://api.example.com',
        path: '/health',
        method: 'get',
      })
      expect(result.url).toBe('https://api.example.com/health')
      expect(result.method).toBe('GET')
      expect(result.headers).toEqual({})
      expect(result.body).toBeNull()
    })
  })
})
