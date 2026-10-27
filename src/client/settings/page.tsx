/**
 * The "Glass UI" section of DSH's settings. Controls write through the
 * controller. Pointer sliders preview locally until release; other edits apply
 * immediately. Accepted edits are saved in the background.
 * Styling uses DSH's own tokens (styles.css), so the page matches DSH and turns
 * to glass with the rest of the app.
 */
import {
  memo,
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import { SURFACE_KINDS } from '../../shared/dom.ts'
import {
  WALLPAPER_CHOICES,
  isSafeWallpaperUrl,
  type GlassSettings,
  type WallpaperChoice,
  type WallpaperPreset,
} from '../../shared/settings.ts'
import { isAnimated, wallpaperImage, type Scheme } from '../../shared/wallpapers.ts'
import type { ControllerState, GlassController } from '../controller.ts'
import type { UpdateController } from '../update-controller.mjs'
import type { Status } from '../../host/updates.mjs'
import { en, type CopyKey } from './locales.ts'

/** Translate a key, filling `{name}` placeholders. */
export type Translate = (key: CopyKey, params?: Readonly<Record<string, string | number>>) => string

/** Live translation: re-renders the page when DSH's language changes. */
export interface LocaleSource {
  readonly subscribe: (listener: () => void) => () => void
  readonly revision: () => number
  readonly translate: Translate
}

/** Inputs of the page. */
export interface SettingsPageProps {
  controller: GlassController
  updates: UpdateController
  locale: LocaleSource
  version: string
  /** Whether this browser can render refraction. */
  refractionSupported: boolean
  /** DSH's public settings.section close action. */
  close?: (() => void) | undefined
}

const DIAGNOSTICS_INTERVAL_MS = 1000
function RangeControl(props: {
  id: string
  label: string
  value: number
  left: string
  right: string
  describedBy?: string
  field: 'tint' | 'inlineCodeOpacity'
  controller: GlassController
  scheme: Scheme
  previewLabel: string
  hint: string
}) {
  const [draft, setDraft] = useState(props.value)
  const value = useRef(props.value)
  const dragging = useRef(false)
  const release = useRef<(() => void) | undefined>(undefined)
  const commit = (): void => props.controller.update(props.field, value.current)
  const finish = (): void => {
    if (!dragging.current) return
    dragging.current = false
    commit()
    release.current?.()
    release.current = undefined
  }
  const latestFinish = useRef(finish)
  latestFinish.current = finish
  useEffect(() => {
    if (!dragging.current) {
      value.current = props.value
      setDraft(props.value)
    }
  }, [props.value])
  useEffect(() => {
    const end = (): void => latestFinish.current()
    window.addEventListener('pointerup', end, true)
    window.addEventListener('pointercancel', end, true)
    window.addEventListener('blur', end)
    return () => {
      window.removeEventListener('pointerup', end, true)
      window.removeEventListener('pointercancel', end, true)
      window.removeEventListener('blur', end)
      end()
    }
  }, [])
  return (
    <div className="glassui-slider" style={{ '--glassui-preview-opacity': draft / 100 } as CSSProperties}>
      <div className="glassui-slider__head">
        <label className="glassui-row__label" htmlFor={props.id}>
          {props.label}
        </label>
        <span className="glassui-slider__value">{draft}</span>
      </div>
      <input
        id={props.id}
        type="range"
        min={0}
        max={100}
        step={1}
        value={draft}
        className="glassui-range"
        aria-describedby={props.describedBy}
        style={{ '--glassui-progress': `${draft}%` } as CSSProperties}
        onPointerDown={() => {
          if (dragging.current) return
          dragging.current = true
          release.current = props.controller.beginAdjustment(() => latestFinish.current())
        }}
        onBlur={finish}
        onChange={event => {
          value.current = Number(event.target.value)
          setDraft(value.current)
          if (!dragging.current) commit()
        }}
      />
      <div className="glassui-slider__ends" aria-hidden="true">
        <span>{props.left}</span>
        <span>{props.right}</span>
      </div>
      <div
        className="glassui-slider-preview"
        aria-label={props.previewLabel}
        data-kind={props.field}
        data-scheme={props.scheme}
        style={{ backgroundImage: wallpaperImage('bay', props.scheme) }}
      >
        <span className="glassui-slider-preview__pane">
          {props.field === 'inlineCodeOpacity' ? <code>path</code> : props.previewLabel}
        </span>
      </div>
      <p className="glassui-note">{props.hint}</p>
    </div>
  )
}

function useController(controller: GlassController): ControllerState {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}

function useTranslate(locale: LocaleSource): Translate {
  const revision = useSyncExternalStore(locale.subscribe, locale.revision)
  return useCallback((key, params) => locale.translate(key, params), [locale, revision])
}

function useScheme(): Scheme {
  const read = (): Scheme => (document.body.hasAttribute('data-ds-dark-theme') ? 'dark' : 'light')
  const [scheme, setScheme] = useState(read)
  useEffect(() => {
    const observer = new MutationObserver(() => setScheme(read()))
    observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme'] })
    return () => observer.disconnect()
  }, [])
  return scheme
}

function Row(props: { label: string; hint?: string | undefined; htmlFor?: string; children: ReactNode }) {
  return (
    <div className="glassui-row">
      <div className="glassui-row__text">
        {props.htmlFor ? (
          <label className="glassui-row__label" htmlFor={props.htmlFor}>
            {props.label}
          </label>
        ) : (
          <span className="glassui-row__label">{props.label}</span>
        )}
        {props.hint ? <span className="glassui-row__hint">{props.hint}</span> : null}
      </div>
      <div className="glassui-row__control">{props.children}</div>
    </div>
  )
}

function Switch(props: { checked: boolean; label: string; disabled?: boolean; onChange: (value: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      className="glassui-switch"
      aria-checked={props.checked}
      aria-label={props.label}
      disabled={props.disabled}
      onClick={() => props.onChange(!props.checked)}
    />
  )
}

function navigateRadios(event: KeyboardEvent<HTMLDivElement>): void {
  const options = [...event.currentTarget.querySelectorAll<HTMLButtonElement>('[role="radio"]')]
  const current = options.findIndex(option => option === event.target)
  if (current < 0) return
  let next: number
  switch (event.key) {
    case 'ArrowRight':
    case 'ArrowDown':
      next = (current + 1) % options.length
      break
    case 'ArrowLeft':
    case 'ArrowUp':
      next = (current + options.length - 1) % options.length
      break
    case 'Home':
      next = 0
      break
    case 'End':
      next = options.length - 1
      break
    default:
      return
  }
  event.preventDefault()
  options[next]?.focus()
  options[next]?.click()
}

function Segmented<T extends string>(props: {
  label: string
  value: T
  options: readonly { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const index = Math.max(
    0,
    props.options.findIndex(option => option.value === props.value),
  )
  return (
    <div
      className="glassui-segmented"
      role="radiogroup"
      aria-label={props.label}
      onKeyDown={navigateRadios}
      style={{ '--glassui-segments': props.options.length, '--glassui-index': index } as CSSProperties}
    >
      <span className="glassui-segmented__thumb" aria-hidden="true" />
      {props.options.map(option => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={option.value === props.value}
          tabIndex={option.value === props.value ? 0 : -1}
          className="glassui-segmented__option"
          onClick={() => props.onChange(option.value)}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

function TextField(props: {
  id: string
  value: string
  placeholder: string
  invalid: boolean
  message: string
  validate?: (value: string) => boolean
  onCommit: (value: string) => void
}) {
  const [draft, setDraft] = useState(props.value)
  useEffect(() => setDraft(props.value), [props.value])
  const draftInvalid = props.validate ? draft.trim() !== '' && !props.validate(draft.trim()) : false
  const commit = (): void => {
    const value = draft.trim()
    if (value === props.value || draftInvalid) return
    props.onCommit(value)
  }
  return (
    <div className="glassui-field">
      <input
        id={props.id}
        className="glassui-input"
        value={draft}
        placeholder={props.placeholder}
        spellCheck={false}
        autoComplete="off"
        aria-invalid={props.invalid || draftInvalid}
        onChange={event => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={event => {
          if (event.key === 'Enter') commit()
        }}
      />
      {props.invalid || draftInvalid ? (
        <span className="glassui-field__error" role="alert">
          {props.message}
        </span>
      ) : null}
    </div>
  )
}

/** The built-in preset a wallpaper choice stands for, if any. */
function preset(choice: WallpaperChoice): WallpaperPreset | undefined {
  if (choice === 'auto') return 'bay'
  if (choice === 'none' || choice === 'custom') return undefined
  return choice
}

const WallpaperPicker = memo(function WallpaperPicker(props: {
  value: WallpaperChoice
  scheme: Scheme
  t: Translate
  onChange: (value: WallpaperChoice) => void
}) {
  const { t } = props
  return (
    <div
      className="glassui-wallpapers"
      role="radiogroup"
      aria-label={t('section.wallpaper')}
      onKeyDown={navigateRadios}
    >
      {WALLPAPER_CHOICES.map(choice => {
        const shown = preset(choice)
        const preview = shown ? wallpaperImage(shown, props.scheme) : undefined
        const live = choice !== 'auto' && shown !== undefined && isAnimated(shown)
        const name = t(`wallpaper.${choice}`)
        return (
          <button
            key={choice}
            type="button"
            role="radio"
            aria-checked={props.value === choice}
            tabIndex={props.value === choice ? 0 : -1}
            aria-label={live ? `${name}, ${t('wallpaper.live')}` : name}
            className="glassui-wallpaper"
            data-choice={choice}
            onClick={() => props.onChange(choice)}
          >
            <span
              className="glassui-wallpaper__swatch"
              aria-hidden="true"
              style={preview ? { backgroundImage: preview } : undefined}
            >
              {choice === 'auto' ? <span className="glassui-wallpaper__badge">A</span> : null}
              {live ? (
                <span className="glassui-wallpaper__badge" data-kind="live">
                  {t('wallpaper.live')}
                </span>
              ) : null}
            </span>
            <span className="glassui-wallpaper__name">{name}</span>
          </button>
        )
      })}
    </div>
  )
})

function Diagnostics(props: { state: ControllerState; t: Translate; version: string }) {
  const { state, t } = props
  const { diagnostics } = state
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const makeReport = (): string =>
    JSON.stringify(
      {
        version: props.version,
        settings: { ...state.settings, wallpaperUrl: state.settings.wallpaperUrl ? '[configured]' : '' },
        diagnostics,
        userAgent: navigator.userAgent,
      },
      null,
      2,
    )
  const surfaces = SURFACE_KINDS.filter(kind => diagnostics.surfaces[kind] > 0)
    .map(kind => `${t(`kind.${kind}`)} ${diagnostics.surfaces[kind]}`)
    .join(' · ')
  const tokens =
    diagnostics.missingTokens.length === 0 && diagnostics.ambiguousTokens.length === 0
      ? t('diag.tokens.ok')
      : [
          diagnostics.missingTokens.length > 0
            ? t('diag.tokens.missing', { list: diagnostics.missingTokens.join(', ') })
            : '',
          diagnostics.ambiguousTokens.length > 0
            ? t('diag.tokens.ambiguous', { list: diagnostics.ambiguousTokens.join(', ') })
            : '',
        ]
          .filter(Boolean)
          .join(' ')
  const copy = async (): Promise<void> => {
    const text = makeReport()
    try {
      await navigator.clipboard.writeText(text)
      setCopied('done')
    } catch {
      setCopied('failed')
    }
  }
  return (
    <div className="glassui-diagnostics">
      <dl className="glassui-facts">
        <dt>{t('diag.surfaces')}</dt>
        <dd>{surfaces || '—'}</dd>
        <dt>{t('diag.lenses')}</dt>
        <dd>{diagnostics.lenses}</dd>
        <dt>{t('diag.tokens')}</dt>
        <dd>{tokens}</dd>
        <dt>{t('diag.scan')}</dt>
        <dd>
          {t('diag.scan.value', {
            batches: diagnostics.scans.batches,
            longest: diagnostics.scans.longestMs.toFixed(1),
          })}
        </dd>
      </dl>
      <div className="glassui-actions">
        <button type="button" className="glassui-button" onClick={() => void copy()}>
          {copied === 'done' ? t('diag.copied') : t('diag.copy')}
        </button>
      </div>
      {copied === 'failed' ? (
        <>
          <p className="glassui-note">{t('diag.copy.failed')}</p>
          <textarea className="glassui-report" readOnly value={makeReport()} aria-label={t('diag.title')} />
        </>
      ) : null}
    </div>
  )
}

const UPDATE_MESSAGES: Record<Status, CopyKey> = {
  idle: 'updateIdle',
  checking: 'updateChecking',
  current: 'updateCurrent',
  available: 'updateAvailable',
  blocked: 'updateBlocked',
  settling: 'updateSettling',
  starting: 'updatePreparing',
  preparing: 'updatePreparing',
  installing: 'updateInstalling',
  'restart-required': 'updateRestart',
  applied: 'updateApplied',
  failed: 'updateFailed',
  cancelled: 'updateCancelled',
  overridden: 'updateOverridden',
  unknown: 'updateUnknown',
}
function UpdatesRow({ controller, t }: { controller: UpdateController; t: Translate }) {
  const view = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  useEffect(() => {
    void controller.load()
  }, [controller])
  const busy = ['settling', 'checking', 'starting', 'preparing', 'installing'].includes(view.status)
  const reason: CopyKey =
    `updateReason_${view.reason}` in en ? (`updateReason_${view.reason}` as CopyKey) : 'updateReason_network'
  return (
    <section className="glassui-section glassui-update" aria-label={t('updateTitle')}>
      <h3 className="glassui-section__title">{t('updateTitle')}</h3>
      <div className="glassui-card glassui-stack">
        <p>
          {t('updateRunning')}: {view.runtimeVersion ?? __GLASSUI_VERSION__}
          {view.installedVersion ? ` · ${t('updateInstalledVersion')}: ${view.installedVersion}` : ''}
        </p>
        <p
          role={
            ['failed', 'blocked'].includes(view.status) ||
            view.reason === 'restore-failed' ||
            view.reason === 'restore-pending' ||
            view.reason === 'restore-limit'
              ? 'alert'
              : 'status'
          }
        >
          {t(
            view.reason === 'restore-pending' || view.reason === 'restore-offer' || view.reason === 'restore-limit'
              ? (`updateReason_${view.reason}` as CopyKey)
              : UPDATE_MESSAGES[view.status],
          )}
        </p>
        {view.reason &&
        view.reason !== 'restore-pending' &&
        view.reason !== 'restore-offer' &&
        view.reason !== 'restore-limit' ? (
          <p className="glassui-note">{t(reason)}</p>
        ) : null}
        {view.checkedAt ? (
          <p className="glassui-note">
            {t('updateChecked')}: {new Date(view.checkedAt).toLocaleString()}
          </p>
        ) : null}
        {view.candidate ? (
          <>
            <p>
              {view.runtimeVersion} → {view.candidate.version} · DSH {view.candidate.compatibility}
            </p>
            <p className="glassui-update__notes">{view.candidate.notes}</p>
          </>
        ) : view.version ? (
          <p>
            {view.runtimeVersion} → {view.version}
          </p>
        ) : null}
        <div className="glassui-actions">
          <button
            type="button"
            className="glassui-button"
            disabled={busy || view.status === 'unknown' || view.status === 'restart-required'}
            onClick={() => {
              void controller.check()
            }}
          >
            {t('updateCheck')}
          </button>
          {view.status === 'available' ? (
            <button
              type="button"
              className="glassui-button"
              onClick={() => {
                void controller.begin()
              }}
            >
              {t('updateInstall')}
            </button>
          ) : null}
          {view.status === 'unknown' ? (
            <button
              type="button"
              className="glassui-button"
              onClick={() => {
                void controller.load()
              }}
            >
              {t('updateReconcile')}
            </button>
          ) : null}
          {view.reason === 'restore-offer' || view.reason === 'restore-limit' ? (
            <button
              type="button"
              className="glassui-button"
              disabled={busy}
              onClick={() => {
                void controller.restore()
              }}
            >
              {t('updateRestore')}
            </button>
          ) : null}
          <a href="https://github.com/Aero123421/dsh-glassui/releases" target="_blank" rel="noopener noreferrer">
            {t('updateManual')}
          </a>
        </div>
        {view.result ? (
          <p className="glassui-note">
            {t('updateStage')}: {view.result.stage}
            {view.result.error ? ` · ${view.result.error.code}` : ''}
          </p>
        ) : null}
      </div>
    </section>
  )
}

/**
 * Render the settings section.
 * @param props - controller, copy and environment.
 * @returns the page.
 */
export function SettingsPage(props: SettingsPageProps) {
  const state = useController(props.controller)
  const update = useSyncExternalStore(props.updates.subscribe, props.updates.getSnapshot)
  const t = useTranslate(props.locale)
  const scheme = useScheme()
  const setWallpaper = useCallback(
    (value: WallpaperChoice) => props.controller.update('wallpaper', value),
    [props.controller],
  )
  const id = useId()
  const mount = useRef<HTMLDivElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const [narrow, setNarrow] = useState(false)
  const close = useCallback(() => props.close?.(), [props.close])
  useEffect(() => {
    const element = mount.current
    if (!element) return
    const measure = (): void => setNarrow(element.clientWidth > 0 && element.clientWidth < 240)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  useEffect(() => {
    if (!narrow) return
    const root = dialog.current
    if (!root) return
    const previous = document.activeElement
    if (previous instanceof HTMLElement && root.contains(previous)) return
    root.querySelector<HTMLButtonElement>('button')?.focus()
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected) previous.focus()
    }
  }, [narrow])
  const { settings, diagnostics } = state
  const set = <K extends keyof GlassSettings>(field: K, value: GlassSettings[K]): void =>
    props.controller.update(field, value)

  useEffect(() => {
    const timer = setInterval(() => props.controller.refreshDiagnostics(), DIAGNOSTICS_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [props.controller])

  const surfaceCount = SURFACE_KINDS.filter(kind => kind !== 'backdrop').reduce(
    (sum, kind) => sum + diagnostics.surfaces[kind],
    0,
  )
  const status = diagnostics.running
    ? `${t('status.on')} · ${t('status.surfaces', { count: surfaceCount })}`
    : diagnostics.idle === 'forced-colors'
      ? t('status.forced')
      : t('status.off')

  const content = (
    <div className="glassui-page" data-testid="glassui-settings">
      <header className="glassui-hero">
        <div
          className="glassui-hero__art"
          aria-hidden="true"
          style={{ backgroundImage: wallpaperImage(preset(settings.wallpaper) ?? 'bay', scheme) }}
        >
          <span className="glassui-hero__pane" />
        </div>
        <div className="glassui-hero__text">
          <h2 className="glassui-hero__title">{t('title')}</h2>
          <p className="glassui-hero__subtitle">{t('subtitle')}</p>
          <span className="glassui-status" data-on={diagnostics.running}>
            {status}
          </span>
        </div>
      </header>

      {state.save === 'local' || state.save === 'error' ? (
        <p className="glassui-banner" role="status">
          {t(state.save === 'local' ? 'save.local' : 'save.error')}
        </p>
      ) : null}

      <fieldset
        className="glassui-settings-controls"
        disabled={state.updating || ['settling', 'starting', 'preparing', 'installing'].includes(update.status)}
      >
        <section className="glassui-section" aria-labelledby={`${id}-material`}>
          <h3 className="glassui-section__title" id={`${id}-material`}>
            {t('section.material')}
          </h3>
          <div className="glassui-card">
            <Row label={t('enable.label')} hint={t('enable.hint')}>
              <Switch checked={settings.enabled} label={t('enable.label')} onChange={value => set('enabled', value)} />
            </Row>
            <RangeControl
              id={`${id}-tint`}
              label={t('tint.label')}
              value={settings.tint}
              left={t('tint.clear')}
              right={t('tint.tinted')}
              field="tint"
              controller={props.controller}
              scheme={scheme}
              previewLabel={t('tint.preview')}
              hint={t('slider.hint')}
            />
          </div>
        </section>

        <section className="glassui-section" aria-labelledby={`${id}-wallpaper`}>
          <h3 className="glassui-section__title" id={`${id}-wallpaper`}>
            {t('section.wallpaper')}
          </h3>
          <div className="glassui-card">
            <WallpaperPicker value={settings.wallpaper} scheme={scheme} t={t} onChange={setWallpaper} />
            {settings.wallpaper === 'auto' ? <p className="glassui-note">{t('wallpaper.auto.hint')}</p> : null}
            {settings.wallpaper !== 'auto' && isAnimated(preset(settings.wallpaper) ?? 'bay') ? (
              <p className="glassui-note">{t('wallpaper.live.hint')}</p>
            ) : null}
            {settings.wallpaper === 'custom' ? (
              <Row label={t('wallpaper.url.label')} htmlFor={`${id}-url`}>
                <TextField
                  id={`${id}-url`}
                  value={settings.wallpaperUrl}
                  placeholder={t('wallpaper.url.placeholder')}
                  invalid={settings.wallpaperUrl !== '' && !isSafeWallpaperUrl(settings.wallpaperUrl)}
                  message={t('wallpaper.url.invalid')}
                  validate={isSafeWallpaperUrl}
                  onCommit={value => set('wallpaperUrl', value)}
                />
              </Row>
            ) : null}
          </div>
        </section>

        <section className="glassui-section" aria-labelledby={`${id}-layout`}>
          <h3 className="glassui-section__title" id={`${id}-layout`}>
            {t('section.layout')}
          </h3>
          <div className="glassui-card">
            <Row label={t('sidebar.label')}>
              <Segmented
                label={t('sidebar.label')}
                value={settings.sidebar}
                options={[
                  { value: 'floating', label: t('sidebar.floating') },
                  { value: 'docked', label: t('sidebar.docked') },
                ]}
                onChange={value => set('sidebar', value)}
              />
            </Row>
            <Row label={t('code.label')} hint={t('code.hint')}>
              <Segmented
                label={t('code.label')}
                value={settings.codeBlocks}
                options={[
                  { value: 'glass', label: t('code.glass') },
                  { value: 'solid', label: t('code.solid') },
                ]}
                onChange={value => set('codeBlocks', value)}
              />
            </Row>
            <div className="glassui-inline-settings">
              <RangeControl
                id={`${id}-inline-opacity`}
                label={t('inline.label')}
                value={settings.inlineCodeOpacity}
                left={t('tint.clear')}
                right={t('inline.readable')}
                describedBy={`${id}-inline-hint`}
                field="inlineCodeOpacity"
                controller={props.controller}
                scheme={scheme}
                previewLabel={t('inline.preview')}
                hint={t('slider.hint')}
              />
              <p className="glassui-note" id={`${id}-inline-hint`}>
                {t('inline.hint')}
              </p>
              <div className="glassui-inline-preview" aria-label={t('inline.preview')}>
                <p>
                  {t('inline.example')} <code>grep</code> · <code>path</code> · <code>@deepseek-ai/dsh</code>
                </p>
              </div>
            </div>
            <Row
              label={t('refraction.label')}
              hint={props.refractionSupported ? t('refraction.hint') : t('refraction.unavailable')}
            >
              <Switch
                checked={settings.refraction && props.refractionSupported}
                label={t('refraction.label')}
                disabled={!props.refractionSupported}
                onChange={value => set('refraction', value)}
              />
            </Row>
            <Row label={t('highlights.label')} hint={t('highlights.hint')}>
              <Switch
                checked={settings.highlights}
                label={t('highlights.label')}
                onChange={value => set('highlights', value)}
              />
            </Row>
          </div>
        </section>

        <section className="glassui-section" aria-labelledby={`${id}-compat`}>
          <h3 className="glassui-section__title" id={`${id}-compat`}>
            {t('section.compat')}
          </h3>
          <div className="glassui-card">
            <div className="glassui-stack">
              <label className="glassui-row__label" htmlFor={`${id}-exclude`}>
                {t('exclude.label')}
              </label>
              <span className="glassui-row__hint">{t('exclude.hint')}</span>
              <TextField
                id={`${id}-exclude`}
                value={settings.exclude}
                placeholder={t('exclude.placeholder')}
                invalid={diagnostics.invalidExclude}
                message={t('exclude.invalid')}
                onCommit={value => set('exclude', value)}
              />
            </div>
            <div className="glassui-stack">
              <span className="glassui-row__label">{t('diag.title')}</span>
              <Diagnostics state={state} t={t} version={props.version} />
            </div>
          </div>
        </section>
      </fieldset>
      <UpdatesRow controller={props.updates} t={t} />
      <footer className="glassui-footer">
        {state.save === 'saving' ? t('save.saving') : t('footer', { version: props.version })}
      </footer>
    </div>
  )
  return (
    <div className="glassui-mount" ref={mount}>
      <div className={narrow ? 'glassui-narrow' : undefined}>
        <div
          ref={dialog}
          className={narrow ? 'glassui-narrow__dialog' : undefined}
          role={narrow ? 'dialog' : undefined}
          aria-modal={narrow ? true : undefined}
          aria-label={narrow ? t('title') : undefined}
          onKeyDown={event => {
            if (!narrow) return
            if (event.key === 'Escape') {
              event.stopPropagation()
              close()
            }
            if (event.key !== 'Tab') return
            const elements = [
              ...event.currentTarget.querySelectorAll<HTMLElement>(
                'button:not(:disabled),input:not(:disabled),a[href],textarea:not(:disabled)',
              ),
            ].filter(element => element.tabIndex >= 0 && element.getClientRects().length > 0)
            const first = elements[0],
              last = elements.at(-1)
            if (event.shiftKey && document.activeElement === first) {
              event.preventDefault()
              last?.focus()
            } else if (!event.shiftKey && document.activeElement === last) {
              event.preventDefault()
              first?.focus()
            }
          }}
        >
          {narrow ? (
            <div className="glassui-narrow__header">
              <strong>{t('title')}</strong>
              <button type="button" className="glassui-button" onClick={close}>
                {t('settings.close')}
              </button>
            </div>
          ) : null}
          {content}
        </div>
      </div>
    </div>
  )
}
