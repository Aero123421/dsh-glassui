/** Plugin version, replaced at build time from package.json. */
declare const __GLASSUI_VERSION__: string

/** Stylesheets are bundled as text. */
declare module '*.css' {
  const text: string
  export default text
}
