// Exercise the real DSH manager through the production update helper. The
// release service is local test data; validation and package installation are real.
import assert from 'node:assert/strict'
import test from 'node:test'
import { existsSync } from 'node:fs'
import { mkdir, readFile, writeFile, cp } from 'node:fs/promises'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { gzipSync } from 'node:zlib'
import { randomUUID } from 'node:crypto'
import { chromium, request } from 'playwright'
import { installDsh, createWorld, installPlugin, startWeb, removeWorld } from './lib/dsh.mjs'
import { run, stopAll } from './lib/procs.mjs'

const root = resolve(import.meta.dirname, '../..')
const manifest = JSON.parse(await readFile(join(root, 'package.json'), 'utf8'))
const requested = process.env.DSH_VERSION || manifest.glassui.e2e.dsh
const out = process.env.GLASSUI_E2E_ARTIFACT_DIR || join(root, 'artifacts/e2e')

test(
  'verified tarball replaces an installed bundle without removing it, preserves settings and disabled state, and survives a refused install',
  { timeout: 300_000 },
  async t => {
    if (requested === 'latest' || requested === '0.2.0-rc.2') {
      t.skip('0.2.0-rc.2 omits the installation source and intentionally offers manual updates')
      return
    }
    await mkdir(out, { recursive: true })
    let world, browser, api
    try {
      const dsh = await installDsh({
        version: requested,
        dir: join(root, '.cache/e2e', `dsh-${requested}`),
        logFile: join(out, 'update-dsh.log'),
      })
      const oldTarball = join(root, '.cache/e2e/dsh-glassui-0.2.3.tgz')
      if (!existsSync(oldTarball)) {
        const saved = join(root, 'artifacts/review-2026-10-17/published-0.2.3.tgz')
        if (existsSync(saved)) await cp(saved, oldTarball)
        else
          await run('download previous release', 'curl', [
            '--fail',
            '--location',
            '--max-time',
            '60',
            '--silent',
            '--show-error',
            'https://github.com/Aero123421/dsh-glassui/releases/download/v0.2.3/dsh-glassui-0.2.3.tgz',
            '--output',
            oldTarball,
          ])
      }
      const nextTarball = join(root, 'artifacts', `${manifest.name}-${manifest.version}.tgz`)
      assert.ok(existsSync(nextTarball), 'the packed release exists')
      world = await createWorld()
      await installPlugin({ dsh, world, tarball: oldTarball, logFile: join(out, 'update-old.log') })
      // A tar stream the manifest reader can inspect but pnpm will refuse: the
      // malformed header cannot replace the profile's existing dependency.
      const badPackage = { ...manifest, version: '99.0.0', scripts: undefined, devDependencies: undefined }
      const content = Buffer.from(JSON.stringify(badPackage)),
        header = Buffer.alloc(512)
      header.write('package/package.json')
      header.write(content.length.toString(8).padStart(11, '0'), 124)
      header[156] = 48
      const badTarball = join(world.root, 'refused.tgz')
      await writeFile(
        badTarball,
        gzipSync(Buffer.concat([header, content, Buffer.alloc(512 - (content.length % 512)), Buffer.alloc(1024)])),
      )
      const helper = join(world.root, 'update-fixture')
      await mkdir(helper)
      await writeFile(
        join(helper, 'package.json'),
        JSON.stringify({
          name: 'glassui-update-fixture',
          version: '1.0.0',
          type: 'module',
          exports: { '.': './index.js' },
          dsh: { bundle: { patch: './cordis.patch.yml' } },
        }),
      )
      await writeFile(
        join(helper, 'cordis.patch.yml'),
        '- insert:\n    - id: glassui-update-fixture\n      name: glassui-update-fixture\n',
      )
      await writeFile(
        join(helper, 'index.js'),
        `
import { PluginUpdates } from ${JSON.stringify(pathToFileURL(join(root, 'src/host/updates.mjs')).href)};
import { readFile, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
export function apply(ctx) {
 ctx.inject(['connection','pluginManager'], child => {
  let broken = false;
  const version = ${JSON.stringify(manifest.version)};
  const good = ${JSON.stringify(nextTarball)}, bad = ${JSON.stringify(badTarball)};
  const fetcher = async input => {
   const candidate = broken ? '99.0.0' : version, filename = 'dsh-glassui-'+candidate+'.tgz';
   const base = 'https://github.com/Aero123421/dsh-glassui/releases/download/v'+candidate+'/';
   const bytes = await readFile(broken ? bad : good);
   const url = String(input);
   if (url.endsWith('/releases/latest')) return Response.json({id:broken ? 9002 : 9001, tag_name:'v'+candidate, html_url:'https://github.com/Aero123421/dsh-glassui/releases/tag/v'+candidate, draft:false, prerelease:false, body:'Fixture', assets:[filename,'SHA256SUMS'].map((name,i)=>({name,id:i+1,size:bytes.length,browser_download_url:base+name}))});
   if (url.endsWith('/package.json')) return Response.json({...${JSON.stringify(manifest)},version:candidate});
   if (url.endsWith('SHA256SUMS')) return new Response(createHash('sha256').update(bytes).digest('hex')+'  '+filename+'\\n');
   if (url.endsWith('.tgz')) return new Response(bytes);
   throw Error('unexpected release request');
  };
  const manager = child.pluginManager;
  const updates = new PluginUpdates({manager:()=>manager,profileDir:ctx.get('profileContext').dir, runtimeVersion:async()=>${JSON.stringify(dsh.version)},fetcher,version:'0.2.3'});
  child.effect(()=>()=>updates.dispose());
  child.connection.fetch.register({path:'/api/glassui-update-fixture',methods:['POST'],requestBody:'buffered',async fetch(request) {
   const data = await request.json();
   if(data.action==='probe') return Response.json((await manager.listBundles()).find(row=>row.name==='dsh-glassui'));
   if(data.action==='enable') return Response.json(await manager.setBundleEnabled('dsh-glassui',true));
   if(data.action==='old-disabled') { await manager.setBundleEnabled('dsh-glassui',false); const result=await manager.installBundle(${JSON.stringify(oldTarball)},{enabled:false,requestId:data.id,saveExact:true}); await rm(updates.cacheDir+'/latest.json',{force:true}); updates.version='0.2.3'; return Response.json(result); }
   if(data.action==='broken') { broken=true; updates.version=version; }
   if(data.action==='check'||data.action==='broken') return Response.json(await updates.check());
   if(data.action==='begin') return Response.json(await updates.begin(data.candidateId,data.id,updates.base().profileKey));
   if(data.action==='result') return Response.json(await updates.reconcile(data.id));
   return new Response('unknown action',{status:400});
  }});
 });
}
`,
      )
      await installPlugin({ dsh, world, tarball: helper, logFile: join(out, 'update-fixture.log') })
      let web = await startWeb({ dsh, world, port: 0, logFile: join(out, 'update-before.log') })
      api = await request.newContext()
      await api.get(web.url)
      const call = async data => {
        const response = await api.post(`${web.origin}/api/glassui-update-fixture`, { data })
        assert.equal(response.status(), 200)
        return response.json()
      }
      browser = await chromium.launch({ executablePath: process.env.GLASSUI_CHROMIUM || undefined })
      const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, locale: 'en-US' })
      const errors = []
      page.on('pageerror', error => errors.push(error.message))
      await page.goto(web.url)
      await page.waitForFunction(() => window.__DSH_GLASSUI_DEBUG__?.version === '0.2.3')
      for (let attempt = 0; attempt < 6; attempt++) {
        const proceed = page.getByRole('button', { name: 'Continue', exact: true })
        if (await proceed.isVisible()) await proceed.click()
        await page.waitForTimeout(300)
      }
      const direct = page.getByRole('button', { name: 'Settings', exact: true })
      if (await direct.isVisible()) await direct.click()
      else {
        await page.getByRole('button', { name: 'Account menu', exact: true }).click()
        await page.getByRole('menuitem', { name: 'Settings', exact: true }).click()
      }
      await page.getByRole('button', { name: 'Glass UI', exact: true }).click()
      const slider = page.getByRole('slider', { name: 'Transparency', exact: true })
      await slider.focus()
      await slider.press('Home')
      for (let n = 0; n < 61; n++) await slider.press('ArrowRight')
      await page.getByRole('radio', { name: 'Lagoon', exact: true }).click()
      await page.getByRole('radio', { name: 'Docked', exact: true }).click()
      await page.waitForTimeout(600)
      const settings = await page.evaluate(() => window.__DSH_GLASSUI_DEBUG__.settings())
      const upgrade = async (action = 'check') => {
        const checked = await call({ action })
        assert.equal(checked.status, 'available', JSON.stringify(checked))
        const id = randomUUID()
        await call({ action: 'begin', candidateId: checked.candidate.id, id })
        let result
        for (let attempt = 0; attempt < 120; attempt++) {
          result = await call({ action: 'result', id })
          if (!['preparing', 'installing'].includes(result.status)) break
          await page.waitForTimeout(250)
        }
        assert.notEqual(result.status, 'installing', JSON.stringify(result))
        assert.notEqual(result.status, 'preparing', JSON.stringify(result))
        return result
      }
      const first = await upgrade()
      await page.waitForFunction(version => window.__DSH_GLASSUI_DEBUG__?.version === version, manifest.version, {
        timeout: 60_000,
      })
      assert.deepEqual(await page.evaluate(() => window.__DSH_GLASSUI_DEBUG__.settings()), settings)
      assert.equal((await call({ action: 'probe' })).version, manifest.version)
      assert.equal((await call({ action: 'probe' })).enabled, true)
      const disabled = await call({ action: 'old-disabled', id: randomUUID() })
      assert.ok(!disabled.error, JSON.stringify(disabled))
      await upgrade()
      const off = await call({ action: 'probe' })
      assert.equal(off.version, manifest.version)
      assert.equal(off.enabled, false)
      const failure = await upgrade('broken')
      assert.equal(failure.status, 'failed', JSON.stringify(failure))
      const remaining = await call({ action: 'probe' })
      assert.equal(remaining.version, manifest.version)
      assert.equal(remaining.installed, true)
      assert.equal(remaining.enabled, false)
      await api.dispose()
      api = undefined
      await stopAll()
      web = await startWeb({ dsh, world, port: 0, logFile: join(out, 'update-restarted.log') })
      api = await request.newContext()
      await api.get(web.url)
      const restarted = await call({ action: 'probe' })
      assert.equal(restarted.version, manifest.version)
      assert.equal(restarted.installed, true)
      assert.equal(restarted.enabled, false)
      await call({ action: 'enable' })
      await page.goto(web.url)
      await page.waitForFunction(version => window.__DSH_GLASSUI_DEBUG__?.version === version, manifest.version)
      assert.deepEqual(
        await page.evaluate(() => window.__DSH_GLASSUI_DEBUG__.settings()),
        settings,
        'settings remain after disabled update, failure and restart',
      )
      await writeFile(
        join(out, 'update-result.json'),
        JSON.stringify(
          {
            dsh: dsh.version,
            first,
            off,
            failure,
            remaining: { version: remaining.version, installed: remaining.installed, enabled: remaining.enabled },
            restarted: { version: restarted.version, installed: restarted.installed, enabled: restarted.enabled },
            errors,
          },
          null,
          2,
        ),
      )
      assert.deepEqual(errors, [])
    } finally {
      await api?.dispose()
      await browser?.close()
      await stopAll()
      if (world) await removeWorld(world)
    }
  },
)
