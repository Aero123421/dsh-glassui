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
    this.profileKey = undefined
    this.requestId = undefined
  }
  getSnapshot = () => this.state
  subscribe = listener => {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }
  storageKey() {
    return this.profileKey ? `${STORAGE}:${this.profileKey}` : undefined
  }
  selectProfile(key) {
    const next = typeof key === 'string' && /^[a-f0-9]{64}$/.test(key) ? key : undefined
    if (next === this.profileKey) return
    this.profileKey = next
    this.requestId = undefined
    if (next) {
      try {
        this.requestId = this.storage?.getItem(this.storageKey()) || undefined
      } catch {
        /* Optional storage. */
      }
    }
  }
  publish(state) {
    if (this.closed) return
    if (state.profileKey) this.selectProfile(state.profileKey)
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
      const status = await this.call('status')
      if (this.closed || generation !== this.generation) return
      this.selectProfile(status.profileKey)
      const state = this.requestId
        ? await this.call('reconcile', { requestId: this.requestId, profileKey: this.profileKey })
        : status
      if (this.closed || generation !== this.generation) return
      if (state.requestId) {
        this.requestId = state.requestId
        try {
          this.storage?.setItem(this.storageKey(), state.requestId)
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
    if (this.closed || !this.profileKey || this.state.status !== 'available') return
    const candidate = this.state.candidate,
      generation = ++this.generation
    this.publish({ ...this.state, status: 'settling' })
    let release
    try {
      release = await this.settleSettings()
    } catch {
      if (!this.closed && generation === this.generation)
        this.publish({ ...this.state, status: 'failed', reason: 'settings' })
      return
    }
    if (this.closed || generation !== this.generation) {
      release()
      return
    }
    this.requestId = crypto.randomUUID()
    try {
      this.storage?.setItem(this.storageKey(), this.requestId)
    } catch {
      /* Storage is optional; the Host journals admitted requests. */
    }
    this.publish({ ...this.state, status: 'starting' })
    try {
      const state = await this.call('begin', {
        candidateId: candidate.id,
        requestId: this.requestId,
        settings: this.settings(),
        profileKey: this.profileKey,
      })
      if (this.closed || generation !== this.generation) return
      if (typeof state.requestId !== 'string') throw new Error('invalid request')
      this.requestId = state.requestId
      try {
        this.storage?.setItem(this.storageKey(), state.requestId)
      } catch {
        /* Storage is optional; the Host journals admitted requests. */
      }
      if (generation === this.generation) {
        this.publish({ ...this.state, ...state })
        await this.load()
      }
    } catch (error) {
      if (this.closed || generation !== this.generation) return
      if (error.rejected) {
        this.requestId = undefined
        try {
          this.storage?.removeItem(this.storageKey())
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
            : error.message.endsWith('/profile')
              ? 'profile'
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
