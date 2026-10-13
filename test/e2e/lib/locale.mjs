// Test-only locale pack: catalog + foreign font style. Product code is untouched.
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
export async function localeFixture(world) {
  const dir = join(world.root, 'locale-fixture')
  await mkdir(dir)
  await writeFile(
    join(dir, 'package.json'),
    JSON.stringify({
      name: 'glassui-e2e-locale',
      version: '1.0.0',
      type: 'module',
      exports: { '.': './index.js', './client': './client.js' },
      dsh: {
        bundle: { patch: './cordis.patch.yml' },
        client: { platform: 'web', inject: ['@deepseek-ai/dsh-client-locale', '@deepseek-ai/dsh-client-ui-settings'] },
      },
    }),
  )
  await writeFile(join(dir, 'index.js'), 'export function apply() {}\n')
  await writeFile(
    join(dir, 'cordis.patch.yml'),
    '- insert:\n    - id: glassui-e2e-locale\n      name: glassui-e2e-locale\n',
  )
  await writeFile(
    join(dir, 'client.js'),
    `window.__ModuleLoader__.load({id:'glassui-e2e-locale',factory(){return {inject:['locale','configForms'],apply(ctx){
    ctx.effect(() => ctx.locale.addLanguage({id:'ja',label:'日本語',fallback:'en'}));
    const style=document.createElement('style'); style.dataset.testLocaleFont='';style.textContent='.test-foreign-font { font-family: sans-serif; }';document.head.append(style);
    const handle={async set(id){if(!await ctx.configForms.get('locale').set('preference',id))throw new Error('test locale save rejected')}};window.__GLASSUI_TEST_LOCALE__=handle;
    ctx.effect(()=>()=>{style.remove();if(window.__GLASSUI_TEST_LOCALE__===handle)delete window.__GLASSUI_TEST_LOCALE__});
  }}}});`,
  )
  return dir
}
