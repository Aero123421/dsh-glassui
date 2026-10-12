// A scripted model for the E2E harness. DSH's native DeepSeek adapter speaks
// Anthropic Messages and honours $DEEPSEEK_BASE_URL, so this server answers
// every model call with a short Markdown reply: a list and a code block, which
// gives the transcript the same structure as a real conversation.
//
//   message contains nonce=<id>  -> "GLASSUI-MOCK-REPLY <id>" plus Markdown (tests)
//   anything else                -> a natural reply (documentation screenshots)
import { createServer } from 'node:http'

export const REPLY_PREFIX = 'GLASSUI-MOCK-REPLY'

function textOf(content) {
  if (typeof content === 'string') return content
  if (!Array.isArray(content)) return ''
  return content.map(block => (typeof block?.text === 'string' ? block.text : '')).join('\n')
}

/** A natural reply, used for documentation screenshots (messages without a nonce). */
const SHOWCASE = [
  'Here is a short plan for the refactor:',
  '',
  '1. **Extract** the token table into `tokens.ts`, so every module reads one list.',
  '2. **Measure** surfaces from computed styles instead of class names.',
  '3. **Verify** each release against the newest DSH before it ships.',
  '',
  '```ts',
  "export const FILL_TOKENS = { input: '--dsw-specific-input-major' } as const",
  '```',
  '',
  'Want me to start with step 1?',
].join('\n')

function reply(messages) {
  const last = textOf(messages.at(-1)?.content)
  const nonce = /nonce=([\w-]{1,64})/.exec(last)?.[1]
  if (nonce === undefined) return SHOWCASE
  return `${REPLY_PREFIX} ${nonce}\n\n- first point\n- second point\n\n\`\`\`js\nconst glass = ${JSON.stringify(nonce)}\n\`\`\`\n`
}

function stream(response, model, text) {
  response.writeHead(200, {
    'content-type': 'text/event-stream',
    'cache-control': 'no-cache',
    connection: 'keep-alive',
  })
  const event = (name, data) => response.write(`event: ${name}\ndata: ${JSON.stringify(data)}\n\n`)
  const usage = { input_tokens: 12, output_tokens: 0, cache_read_input_tokens: 0, cache_creation_input_tokens: 0 }
  const id = `msg_glassui_${Date.now().toString(36)}`
  event('message_start', {
    type: 'message_start',
    message: {
      id,
      type: 'message',
      role: 'assistant',
      model,
      content: [],
      stop_reason: null,
      stop_sequence: null,
      usage,
    },
  })
  event('content_block_start', { type: 'content_block_start', index: 0, content_block: { type: 'text', text: '' } })
  for (const chunk of text.match(/[\s\S]{1,16}/g) ?? [])
    event('content_block_delta', { type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text: chunk } })
  event('content_block_stop', { type: 'content_block_stop', index: 0 })
  event('message_delta', {
    type: 'message_delta',
    delta: { stop_reason: 'end_turn', stop_sequence: null },
    usage: { output_tokens: 8 },
  })
  event('message_stop', { type: 'message_stop' })
  response.end()
}

/** Start the mock on 127.0.0.1; resolves with its base URL. */
export async function startMockLlm() {
  const requests = []
  const server = createServer((request, response) => {
    let body = ''
    request.setEncoding('utf8')
    request.on('data', chunk => (body += chunk))
    request.on('end', () => {
      const path = new URL(request.url ?? '/', 'http://127.0.0.1').pathname.replace(/\/+$/, '')
      if (request.method !== 'POST' || !path.endsWith('/messages')) {
        response.writeHead(404, { 'content-type': 'application/json' })
        response.end('{"error":"not found"}')
        return
      }
      let parsed = {}
      try {
        parsed = JSON.parse(body)
      } catch {
        // an empty or invalid body gets the default reply
      }
      const text = reply(Array.isArray(parsed.messages) ? parsed.messages : [])
      requests.push({ at: Date.now(), path })
      const model = parsed.model ?? 'glassui-mock'
      if (parsed.stream === false) {
        response.writeHead(200, { 'content-type': 'application/json' })
        response.end(
          JSON.stringify({
            id: 'msg_glassui',
            type: 'message',
            role: 'assistant',
            model,
            content: [{ type: 'text', text }],
            stop_reason: 'end_turn',
            stop_sequence: null,
            usage: { input_tokens: 12, output_tokens: 8 },
          }),
        )
        return
      }
      stream(response, model, text)
    })
  })
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  const { port } = server.address()
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise(resolve => server.close(() => resolve())),
  }
}
