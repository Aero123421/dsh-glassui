const STORAGE = 'dsh-glassui:update'
export class UpdateController {
  constructor(connection, settleSettings, settings, storage) {
    if (storage === undefined) {
      try {
        storage = globalThis.sessionStorage
      } catch {
        /* Storage is optional; the Host journals admitted requests. */
      }
    }
    this.connection = connection
    this.settleSettings = settleSettings
    this.settings = settings
    this.storage = storage
    this.listeners = new Set()
    this.state = { status: 'blocked', reason: 'manager-unavailable' }
    this.generation = 0
    this.closed = false
    this.timer = null
    try {
      this.requestId = storage?.getItem(STORAGE) || undefined
    } catch {
      /* Storage is optional; the Host journals admitted requests. */
    }
  }
  getSnapshot = () => this.state
  subscribe = listener => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  publish(state) {
    if (this.closed) return
    this.state = state
    for (const listener of this.listeners) listener()
  }
  attach(connection) {
    this.connection = connection
    void this.load()
    return () => {
      if (this.connection === connection) {
        this.connection = undefined
        this.generation++
        this.publish({ ...this.state, status: 'blocked', reason: 'manager-unavailable' })
      }
    }
  }
  async call(method, payload = {}) {
    if (!this.connection) return { status: 'blocked', reason: 'manager-unavailable' }
    const result = await this.connection.rpc.call('/api', `dsh-glassui/update-${method}`, payload)
    if (!result.ok) {
      const error = new Error(result.error.code)
      error.rejected = true
      throw error
    }
    return result.value
  }
  async load() {
    if (this.closed) return
    const generation = ++this.generation
    clearTimeout(this.timer)
    try {
      const state = await this.call(
        this.requestId ? 'reconcile' : 'status',
        this.requestId ? { requestId: this.requestId } : {},
      )
      if (this.closed || generation !== this.generation) return
      if (state.requestId) {
        this.requestId = state.requestId
        try {
          this.storage?.setItem(STORAGE, state.requestId)
        } catch {
          /* Storage is optional; the Host journals admitted requests. */
        }
      }
      this.publish(state)
      if (['preparing', 'installing'].includes(state.status))
        this.timer = setTimeout(() => {
          void this.load()
        }, 800)
    } catch {
      if (generation === this.generation)
        this.publish({ ...this.state, status: this.requestId ? 'unknown' : 'blocked', reason: 'network' })
    }
  }
  async check() {
    if (
      this.closed ||
      ['settling', 'checking', 'preparing', 'installing', 'starting', 'unknown'].includes(this.state.status)
    )
      return
    const generation = ++this.generation
    this.publish({ ...this.state, status: 'checking' })
    try {
      const state = await this.call('check')
      if (generation === this.generation) this.publish(state)
    } catch {
      if (generation === this.generation) this.publish({ ...this.state, status: 'blocked', reason: 'network' })
    }
  }
  async begin() {
    if (this.closed || this.state.status !== 'available') return
    const candidate = this.state.candidate,
      generation = ++this.generation
    this.publish({ ...this.state, status: 'settling' })
    let release
    try {
      release = await this.settleSettings()
    } catch {
      this.publish({ ...this.state, status: 'failed', reason: 'settings' })
      return
    }
    if (this.closed || generation !== this.generation) {
      release()
      return
    }
    this.requestId = crypto.randomUUID()
    try {
      this.storage?.setItem(STORAGE, this.requestId)
    } catch {
      /* Storage is optional; the Host journals admitted requests. */
    }
    this.publish({ ...this.state, status: 'starting' })
    try {
      const state = await this.call('begin', {
        candidateId: candidate.id,
        requestId: this.requestId,
        settings: this.settings(),
      })
      if (typeof state.requestId !== 'string') throw new Error('invalid request')
      this.requestId = state.requestId
      try {
        this.storage?.setItem(STORAGE, state.requestId)
      } catch {
        /* Storage is optional; the Host journals admitted requests. */
      }
      if (generation === this.generation) {
        this.publish({ ...this.state, ...state })
        await this.load()
      }
    } catch (error) {
      if (error.rejected) {
        this.requestId = undefined
        try {
          this.storage?.removeItem(STORAGE)
        } catch {
          /* Storage is optional; the Host journals admitted requests. */
        }
      }
      if (generation === this.generation)
        this.publish({
          ...this.state,
          status: error.rejected ? 'failed' : 'unknown',
          reason: error.message.endsWith('/busy')
            ? 'busy'
            : error.message.endsWith('/settings')
              ? 'settings'
              : 'network',
        })
    } finally {
      release()
    }
  }
  dispose() {
    this.closed = true
    this.generation++
    clearTimeout(this.timer)
    this.listeners.clear()
  }
}
