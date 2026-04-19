/**
 * Executes an HTTP request and returns a structured response object.
 * This function never throws — all errors are captured in the result.
 *
 * @param {{ url: string, method: string, headers: object, body: string|null }} request
 *   The request descriptor produced by buildRequest().
 * @param {{ signal?: AbortSignal }} [options]
 *   Optional abort signal for cancellation.
 * @returns {Promise<{
 *   ok: boolean,
 *   status: number,
 *   statusText: string,
 *   headers: Array<[string, string]>,
 *   body: string,
 *   contentType: string,
 *   durationMs: number,
 *   error: string|null
 * }>}
 */
export async function executeRequest(request, options = {}) {
  const startTime = performance.now()

  try {
    // Auth will be addressed later
    const response = await fetch(request.url, {
      method: request.method,
      headers: request.headers,
      body: request.body,
      signal: options.signal,
    })

    const durationMs = Math.round(performance.now() - startTime)
    const headers = [...response.headers.entries()]
    const contentType = response.headers.get('content-type') || ''
    const body = await response.text()

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers,
      body,
      contentType,
      durationMs,
      error: null,
    }
  } catch (err) {
    const durationMs = Math.round(performance.now() - startTime)

    let error
    if (err.name === 'AbortError') {
      error = 'Request was cancelled.'
    } else if (err instanceof TypeError) {
      error =
        'Network error: unable to reach the server. This may be caused by CORS restrictions, a DNS failure, or the server being unreachable.'
    } else {
      error = err.message || 'An unknown error occurred.'
    }

    return {
      ok: false,
      status: 0,
      statusText: '',
      headers: [],
      body: '',
      contentType: '',
      durationMs,
      error,
    }
  }
}
