import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useRequestPipeline } from '../../../src/features/requestExecution/useRequestPipeline'
import { executeRequest } from '../../../src/features/requestExecution/executeRequest'

vi.mock('../../../src/features/requestExecution/executeRequest', () => ({
  executeRequest: vi.fn(),
}))

function deferred() {
  let resolve
  const promise = new Promise((res) => {
    resolve = res
  })
  return { promise, resolve }
}

const endpoint = {
  path: '/users/{userId}',
  method: 'get',
  parameters: [{ name: 'userId', in: 'path', required: true }],
}
const serverUrl = 'https://api.example.com'

const okResponse = {
  ok: true,
  status: 200,
  statusText: 'OK',
  headers: [],
  body: '{"x":1}',
  contentType: 'application/json',
  durationMs: 1,
  error: null,
}

beforeEach(() => {
  executeRequest.mockReset()
})

describe('useRequestPipeline - execute (happy path)', () => {
  it('passes a request built from current state to executeRequest', async () => {
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.setParameterValue('path-userId', '42')
    })
    await act(async () => {
      await result.current.execute()
    })

    expect(executeRequest).toHaveBeenCalledTimes(1)
    const [request, options] = executeRequest.mock.calls[0]
    expect(request).toEqual(
      expect.objectContaining({
        url: 'https://api.example.com/users/42',
        method: 'GET',
      })
    )
    expect(options.signal).toBeInstanceOf(AbortSignal)
  })

  it('writes the built request to requestData', async () => {
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.setParameterValue('path-userId', '7')
    })
    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.requestData).toEqual(
      expect.objectContaining({
        url: 'https://api.example.com/users/7',
        method: 'GET',
      })
    )
  })

  it('sets isLoading to true while the request is in flight', async () => {
    const d = deferred()
    executeRequest.mockReturnValue(d.promise)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })

    expect(result.current.isLoading).toBe(true)

    await act(async () => {
      d.resolve(okResponse)
    })
  })

  it('clears isLoading once the request resolves', async () => {
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('writes the executeRequest result to responseData', async () => {
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      await result.current.execute()
    })

    expect(result.current.responseData).toEqual(okResponse)
  })

  it('forwards the request body and selected content type to executeRequest', async () => {
    const endpointWithBody = {
      path: '/users',
      method: 'post',
      parameters: [],
      requestBody: {
        required: true,
        content: { 'application/json': {} },
      },
    }
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint: endpointWithBody, serverUrl })
    )

    act(() => {
      result.current.setRequestBodyValue('{"name":"Alice"}')
      result.current.setSelectedContentType('application/xml')
    })
    await act(async () => {
      await result.current.execute()
    })

    const [request] = executeRequest.mock.calls[0]
    expect(request.body).toBe('{"name":"Alice"}')
    expect(request.headers['Content-Type']).toBe('application/xml')
  })

  it('forwards custom headers to executeRequest', async () => {
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.setCustomHeaders([
        { key: 'X-Trace-Id', value: 'abc-123' },
      ])
    })
    await act(async () => {
      await result.current.execute()
    })

    const [request] = executeRequest.mock.calls[0]
    expect(request.headers['X-Trace-Id']).toBe('abc-123')
  })

  it('forwards custom query parameters to executeRequest', async () => {
    executeRequest.mockResolvedValue(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.setCustomQueryParams([
        { key: 'debug', value: 'true' },
      ])
    })
    await act(async () => {
      await result.current.execute()
    })

    const [request] = executeRequest.mock.calls[0]
    expect(request.url).toContain('debug=true')
  })

  it('writes requestData synchronously, before the response resolves', async () => {
    const d = deferred()
    executeRequest.mockReturnValue(d.promise)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })

    expect(result.current.requestData).not.toBeNull()
    expect(result.current.responseData).toBeNull()

    await act(async () => {
      d.resolve(okResponse)
    })
  })
})

describe('useRequestPipeline - execute (re-entrant)', () => {
  it('aborts the first call when execute is invoked again before it resolves', async () => {
    const first = deferred()
    const second = deferred()
    const signals = []
    executeRequest
      .mockImplementationOnce((_req, opts) => {
        signals.push(opts.signal)
        return first.promise
      })
      .mockImplementationOnce((_req, opts) => {
        signals.push(opts.signal)
        return second.promise
      })

    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })
    await act(async () => {
      result.current.execute()
    })

    expect(signals[0].aborted).toBe(true)
    expect(signals[1].aborted).toBe(false)

    await act(async () => {
      first.resolve(okResponse)
      second.resolve(okResponse)
    })
  })

  it('writes only the later calls response to state', async () => {
    const first = deferred()
    const second = deferred()
    const firstResponse = { ...okResponse, body: 'first' }
    const secondResponse = { ...okResponse, body: 'second' }

    executeRequest
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    let firstPromise
    let secondPromise
    await act(async () => {
      firstPromise = result.current.execute()
    })
    await act(async () => {
      secondPromise = result.current.execute()
    })

    await act(async () => {
      first.resolve(firstResponse)
      await firstPromise
    })
    expect(result.current.responseData).toBeNull()

    await act(async () => {
      second.resolve(secondResponse)
      await secondPromise
    })
    expect(result.current.responseData).toEqual(secondResponse)
  })

  it('rebuilds the request from current state on each call', async () => {
    const first = deferred()
    const second = deferred()
    executeRequest
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(second.promise)

    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.setParameterValue('path-userId', 'first-id')
    })
    await act(async () => {
      result.current.execute()
    })

    act(() => {
      result.current.setParameterValue('path-userId', 'second-id')
    })
    await act(async () => {
      result.current.execute()
    })

    const firstRequest = executeRequest.mock.calls[0][0]
    const secondRequest = executeRequest.mock.calls[1][0]
    expect(firstRequest.url).toBe('https://api.example.com/users/first-id')
    expect(secondRequest.url).toBe('https://api.example.com/users/second-id')
    expect(result.current.requestData.url).toBe(
      'https://api.example.com/users/second-id'
    )

    await act(async () => {
      first.resolve(okResponse)
      second.resolve(okResponse)
    })
  })
})

describe('useRequestPipeline - abort', () => {
  it('signals the current AbortController', async () => {
    const d = deferred()
    let capturedSignal
    executeRequest.mockImplementation((_req, opts) => {
      capturedSignal = opts.signal
      return d.promise
    })

    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })
    expect(capturedSignal.aborted).toBe(false)

    act(() => {
      result.current.abort()
    })
    expect(capturedSignal.aborted).toBe(true)

    await act(async () => {
      d.resolve(okResponse)
    })
  })

  it('does not clear requestData', async () => {
    const d = deferred()
    executeRequest.mockReturnValue(d.promise)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })
    const before = result.current.requestData
    expect(before).not.toBeNull()

    act(() => {
      result.current.abort()
    })

    expect(result.current.requestData).toBe(before)

    await act(async () => {
      d.resolve(okResponse)
    })
  })

  it('does not clear responseData when called after a prior response is set', async () => {
    executeRequest.mockResolvedValueOnce(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      await result.current.execute()
    })
    expect(result.current.responseData).toEqual(okResponse)

    act(() => {
      result.current.abort()
    })

    expect(result.current.responseData).toEqual(okResponse)
  })

  // abort() intentionally does not disown the controller (unlike reset), so
  // executeRequest's AbortError result still reaches the UI as the "cancelled" response.
  it('lets a late-arriving resolution still update responseData', async () => {
    const d = deferred()
    executeRequest.mockReturnValue(d.promise)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    let executePromise
    await act(async () => {
      executePromise = result.current.execute()
    })

    act(() => {
      result.current.abort()
    })

    const abortedResult = {
      ...okResponse,
      ok: false,
      status: 0,
      error: 'Request was cancelled.',
    }
    await act(async () => {
      d.resolve(abortedResult)
      await executePromise
    })

    expect(result.current.responseData).toEqual(abortedResult)
    expect(result.current.isLoading).toBe(false)
  })

  it('is safe to call with no in-flight request', () => {
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.abort()
    })

    expect(result.current.requestData).toBeNull()
    expect(result.current.responseData).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useRequestPipeline - reset', () => {
  it('aborts the in-flight controller', async () => {
    const d = deferred()
    let capturedSignal
    executeRequest.mockImplementation((_req, opts) => {
      capturedSignal = opts.signal
      return d.promise
    })
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })
    expect(capturedSignal.aborted).toBe(false)

    act(() => {
      result.current.reset()
    })

    expect(capturedSignal.aborted).toBe(true)

    await act(async () => {
      d.resolve(okResponse)
    })
  })

  it('clears requestData, responseData, and isLoading', async () => {
    executeRequest.mockResolvedValueOnce(okResponse)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      await result.current.execute()
    })
    expect(result.current.requestData).not.toBeNull()
    expect(result.current.responseData).not.toBeNull()

    act(() => {
      result.current.reset()
    })

    expect(result.current.requestData).toBeNull()
    expect(result.current.responseData).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('discards a late-arriving response from the aborted call', async () => {
    const d = deferred()
    executeRequest.mockReturnValueOnce(d.promise)
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    let executePromise
    await act(async () => {
      executePromise = result.current.execute()
    })

    act(() => {
      result.current.reset()
    })

    await act(async () => {
      d.resolve(okResponse)
      await executePromise
    })

    expect(result.current.requestData).toBeNull()
    expect(result.current.responseData).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })

  it('is safe to call with no in-flight request', () => {
    const { result } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    act(() => {
      result.current.reset()
    })

    expect(result.current.requestData).toBeNull()
    expect(result.current.responseData).toBeNull()
    expect(result.current.isLoading).toBe(false)
  })
})

describe('useRequestPipeline - unmount cleanup', () => {
  it('aborts the in-flight controller when the hook unmounts', async () => {
    const d = deferred()
    let capturedSignal
    executeRequest.mockImplementation((_req, opts) => {
      capturedSignal = opts.signal
      return d.promise
    })
    const { result, unmount } = renderHook(() =>
      useRequestPipeline({ endpoint, serverUrl })
    )

    await act(async () => {
      result.current.execute()
    })
    expect(capturedSignal.aborted).toBe(false)

    unmount()

    expect(capturedSignal.aborted).toBe(true)
  })
})
