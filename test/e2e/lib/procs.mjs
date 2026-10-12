// Child processes for the E2E harness. Long-running processes get their own
// process group (POSIX), so stopping one also stops what it spawned; an exit
// hook kills anything still alive, so a crash never leaves DSH listening.
// Adapted from the dsh-remora E2E harness (MIT, same author).
import { spawn, spawnSync } from 'node:child_process'
import { createWriteStream } from 'node:fs'

const isWindows = process.platform === 'win32'
const live = new Set()

function killTree(child, signal) {
  if (child.exitCode !== null || child.signalCode !== null) return
  try {
    if (isWindows) spawnSync('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
    else process.kill(-child.pid, signal)
  } catch {
    try {
      child.kill(signal)
    } catch {
      // already gone
    }
  }
}

process.on('exit', () => {
  for (const proc of live) killTree(proc.child, 'SIGKILL')
})

/** The parent's environment without package-manager script variables, plus `extra`. */
export function childEnv(extra = {}) {
  const keep = new Set([
    'npm_config_registry',
    'npm_config_proxy',
    'npm_config_https_proxy',
    'npm_config_cafile',
    'npm_config_strict_ssl',
  ])
  const env = {}
  for (const [key, value] of Object.entries(process.env)) {
    if (/^npm_/i.test(key) && !keep.has(key.toLowerCase())) continue
    if (key === 'INIT_CWD') continue
    env[key] = value
  }
  return { ...env, ...extra }
}

export class Proc {
  constructor(name, child, log) {
    this.name = name
    this.child = child
    this.output = ''
    this.listeners = new Set()
    this.exited = new Promise(resolve => child.once('exit', (code, signal) => resolve({ code, signal })))
    child.once('error', error => this.append(`\n[spawn error] ${error.message}\n`))
    for (const stream of [child.stdout, child.stderr]) {
      stream.setEncoding('utf8')
      stream.on('data', text => {
        log?.write(text)
        this.append(text)
      })
    }
  }

  append(text) {
    this.output = (this.output + text).slice(-200_000)
    for (const listener of this.listeners) listener()
  }

  get running() {
    return this.child.exitCode === null && this.child.signalCode === null
  }

  tail(lines = 40) {
    return this.output.split('\n').slice(-lines).join('\n')
  }

  /** Resolve with the first match of `pattern` in the output; reject on exit or timeout. */
  waitFor(pattern, timeoutMs, what = String(pattern)) {
    return new Promise((resolve, reject) => {
      const done = () => {
        clearTimeout(timer)
        this.listeners.delete(check)
      }
      const check = () => {
        const match = pattern.exec(this.output)
        if (match) {
          done()
          resolve(match)
        }
      }
      const timer = setTimeout(() => {
        done()
        reject(new Error(`${this.name}: timed out after ${timeoutMs} ms waiting for ${what}\n${this.tail()}`))
      }, timeoutMs)
      this.listeners.add(check)
      void this.exited.then(({ code, signal }) => {
        if (!this.listeners.has(check)) return
        done()
        reject(new Error(`${this.name} exited (code=${code} signal=${signal}) before ${what}\n${this.tail()}`))
      })
      check()
    })
  }

  /** SIGTERM the process group, SIGKILL after `graceMs`. */
  async stop(graceMs = 8000) {
    if (!this.running) return this.exited
    killTree(this.child, 'SIGTERM')
    const timer = setTimeout(() => killTree(this.child, 'SIGKILL'), graceMs)
    try {
      return await this.exited
    } finally {
      clearTimeout(timer)
    }
  }
}

/** Start a long-running process; output goes to `logFile` and an in-memory tail. */
export function start(name, command, args, { cwd, env, logFile } = {}) {
  const child = spawn(command, args, {
    cwd,
    env,
    detached: !isWindows,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  })
  const log = logFile ? createWriteStream(logFile, { flags: 'a' }) : undefined
  log?.write(`$ ${[command, ...args].join(' ')}\n`)
  const proc = new Proc(name, child, log)
  live.add(proc)
  child.once('exit', (code, signal) => {
    live.delete(proc)
    log?.end(`\n# exited code=${code} signal=${signal}\n`)
  })
  return proc
}

/** Run a command to completion. */
export async function run(name, command, args, { cwd, env, logFile, timeoutMs = 300_000 } = {}) {
  const proc = start(name, command, args, { cwd, env, logFile })
  let timer
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(() => {
      void proc.stop(2000)
      reject(new Error(`${name}: timed out after ${timeoutMs} ms\n${proc.tail()}`))
    }, timeoutMs)
  })
  try {
    const { code, signal } = await Promise.race([proc.exited, timeout])
    if (code !== 0) throw new Error(`${name} failed (code=${code} signal=${signal})\n${proc.tail()}`)
    return proc.output
  } finally {
    clearTimeout(timer)
  }
}

/** Stop every process still alive. */
export async function stopAll() {
  await Promise.all([...live].map(proc => proc.stop()))
}
