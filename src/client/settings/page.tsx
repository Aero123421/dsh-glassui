/**
 * The "Glass UI" section of DSH's settings. Controls write through the
 * controller, which applies a change at once and saves it in the background.
 * Styling uses DSH's own tokens (styles.css), so the page matches DSH and turns
 * to glass with the rest of the app.
 */
import {
  useEffect,
  useId,
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
import type { CopyKey } from './locales.ts'

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
  locale: LocaleSource
  version: string
  /** Whether this browser can render refraction. */
  refractionSupported: boolean
}

const DIAGNOSTICS_INTERVAL_MS = 1000

function useController(controller: GlassController): ControllerState {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot)
}

function useTranslate(locale: LocaleSource): Translate {
  useSyncExternalStore(locale.subscribe, locale.revision)
  return locale.translate
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

function WallpaperPicker(props: {
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
}

function Diagnostics(props: { state: ControllerState; t: Translate; version: string }) {
  const { state, t } = props
  const { diagnostics } = state
  const [copied, setCopied] = useState<'idle' | 'done' | 'failed'>('idle')
  const report = JSON.stringify(
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
    try {
      await navigator.clipboard.writeText(report)
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
          <textarea className="glassui-report" readOnly value={report} aria-label={t('diag.title')} />
        </>
      ) : null}
    </div>
  )
}

/**
 * Render the settings section.
 * @param props - controller, copy and environment.
 * @returns the page.
 */
export function SettingsPage(props: SettingsPageProps) {
  const state = useController(props.controller)
  const t = useTranslate(props.locale)
  const scheme = useScheme()
  const id = useId()
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

  return (
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

      <section className="glassui-section" aria-labelledby={`${id}-material`}>
        <h3 className="glassui-section__title" id={`${id}-material`}>
          {t('section.material')}
        </h3>
        <div className="glassui-card">
          <Row label={t('enable.label')} hint={t('enable.hint')}>
            <Switch checked={settings.enabled} label={t('enable.label')} onChange={value => set('enabled', value)} />
          </Row>
          <div className="glassui-slider">
            <div className="glassui-slider__head">
              <label className="glassui-row__label" htmlFor={`${id}-tint`}>
                {t('tint.label')}
              </label>
              <span className="glassui-slider__value">{settings.tint}</span>
            </div>
            <input
              id={`${id}-tint`}
              type="range"
              min={0}
              max={100}
              step={1}
              value={settings.tint}
              className="glassui-range"
              style={{ '--glassui-progress': `${settings.tint}%` } as CSSProperties}
              onChange={event => set('tint', Number(event.target.value))}
            />
            <div className="glassui-slider__ends" aria-hidden="true">
              <span>{t('tint.clear')}</span>
              <span>{t('tint.tinted')}</span>
            </div>
          </div>
        </div>
      </section>

      <section className="glassui-section" aria-labelledby={`${id}-wallpaper`}>
        <h3 className="glassui-section__title" id={`${id}-wallpaper`}>
          {t('section.wallpaper')}
        </h3>
        <div className="glassui-card">
          <WallpaperPicker
            value={settings.wallpaper}
            scheme={scheme}
            t={t}
            onChange={value => set('wallpaper', value)}
          />
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

      <footer className="glassui-footer">
        {state.save === 'saving' ? t('save.saving') : t('footer', { version: props.version })}
      </footer>
    </div>
  )
}
