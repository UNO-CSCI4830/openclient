/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

const ALLOWED_ORIGIN = 'https://uno-csci4830.github.io'

export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
    }
    if (request.method === 'OPTIONS') return new Response(null, { headers: cors })

    const target = new URL(request.url).searchParams.get('url')
    if (!target) {
      return Response.json({ error: 'Missing "url" parameter' }, { status: 400, headers: cors })
    }

    try {
      const upstream = await fetch(target)
      const body = await upstream.text()
      return new Response(body, {
        status: upstream.status,
        headers: {
          ...cors,
          'Content-Type': upstream.headers.get('Content-Type') || 'text/plain',
        },
      })
    } catch (err) {
      return Response.json({ error: `Failed to fetch: ${err.message}` }, { status: 502, headers: cors })
    }
  },
}
