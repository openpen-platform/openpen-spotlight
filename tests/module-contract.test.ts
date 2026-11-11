import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it, vi } from 'vitest'
import type { ModuleSetupContext } from '@openpen/module-api'
import module, { MODULE_ID } from '../src/index'
import en from '../src/locales/en.json'
import zhHant from '../src/locales/zh-Hant.json'
import zhHans from '../src/locales/zh-Hans.json'
import ja from '../src/locales/ja.json'

describe('spotlight module contract', () => {
  it('declares the canonical scoped id', () => {
    expect(MODULE_ID).toBe('@openpen/spotlight')
    expect(module.id).toBe('@openpen/spotlight')
  })

  it('declares a version (required for plugins)', () => {
    expect(module.version).toBe('1.1.0')
  })

  it('contributes htmlOverlays, controlBar, and settingsPanels', () => {
    const c = module.contributes!
    expect(c.htmlOverlays?.map((o) => o.id)).toContain('spotlight')
    expect(c.controlBar?.map((b) => b.id)).toContain('spotlight')
    expect(c.settingsPanels?.map((p) => p.id)).toContain('spotlight-settings')
  })

  it('mounts a component on each contributed surface', () => {
    const c = module.contributes!
    expect(c.htmlOverlays?.[0]?.component).toBeTruthy()
    expect(c.controlBar?.[0]?.component).toBeTruthy()
    expect(c.settingsPanels?.[0]?.component).toBeTruthy()
  })
})

describe('settingsSchema', () => {
  it('parses an empty object into the documented defaults', () => {
    const parsed = module.settingsSchema!.parse({}) as Record<string, unknown>
    expect(parsed).toEqual({
      enabled: false,
      radius: 150,
      dimOpacity: 0.8,
      softEdge: true,
    })
  })

  it('defaults enabled to false (spec: off until the user turns it on)', () => {
    const parsed = module.settingsSchema!.parse({}) as { enabled: boolean }
    expect(parsed.enabled).toBe(false)
  })
})

/** Flatten a nested locale dictionary into dotted keys. */
function leafKeys(dict: Record<string, unknown>, prefix = ''): string[] {
  return Object.entries(dict).flatMap(([k, v]) =>
    typeof v === 'object' && v !== null
      ? leafKeys(v as Record<string, unknown>, `${prefix}${k}.`)
      : [`${prefix}${k}`],
  )
}

function leafValue(dict: Record<string, unknown>, path: string): unknown {
  return path.split('.').reduce<unknown>((o, k) => (o as Record<string, unknown>)[k], dict)
}

describe('toggle shortcut (AC#2)', () => {
  const shortcut = () => module.contributes!.shortcuts?.find((s) => s.id === 'toggle-spotlight')

  function fakeCtx(enabled: boolean) {
    let current = { enabled }
    const updateSettings = vi.fn(async (patch: Partial<typeof current>) => {
      current = { ...current, ...patch }
    })
    const ctx = {
      getSettings: () => current,
      updateSettings,
      onSettingsChange: () => () => {},
      onDispose: () => {},
    } as unknown as ModuleSetupContext
    return { ctx, updateSettings }
  }

  it('registers a rebindable shortcut with a label in all four languages', () => {
    const s = shortcut()!
    expect(s.keys).toBeTruthy()
    expect(s.userCustomizable).toBe(true)
    expect(Object.keys(s.label as Record<string, string>).sort()).toEqual(['en', 'ja', 'zh-Hans', 'zh-Hant'])
  })

  it('flips the persisted enabled flag each time it fires (off -> on -> off)', async () => {
    const { ctx, updateSettings } = fakeCtx(false)
    module.setup!(ctx)
    shortcut()!.handler()
    expect(updateSettings).toHaveBeenLastCalledWith({ enabled: true })
    await Promise.resolve()
    shortcut()!.handler()
    expect(updateSettings).toHaveBeenLastCalledWith({ enabled: false })
  })
})

describe('locales (AC#4)', () => {
  const locales = { en, 'zh-Hant': zhHant, 'zh-Hans': zhHans, ja } as Record<string, Record<string, unknown>>

  it('every language has exactly the English key set, each with a non-empty string', () => {
    const base = leafKeys(en).sort()
    expect(base).toContain('options.label')
    for (const [name, dict] of Object.entries(locales)) {
      expect(leafKeys(dict).sort(), name).toEqual(base)
      for (const key of base) {
        const v = leafValue(dict, key)
        expect(typeof v === 'string' && v.trim().length > 0, `${name}:${key}`).toBe(true)
      }
    }
  })

  it('non-English languages do not just copy the English panel strings', () => {
    for (const name of ['zh-Hant', 'zh-Hans', 'ja']) {
      expect(leafValue(locales[name], 'options.label')).not.toBe(leafValue(en, 'options.label'))
    }
  })
})

describe('release metadata (AC#7)', () => {
  const read = (f: string) => JSON.parse(readFileSync(resolve(process.cwd(), f), 'utf8'))

  it('module, plugin.json and package.json all say 1.1.0', () => {
    expect(module.version).toBe('1.1.0')
    expect(read('plugin.json').version).toBe('1.1.0')
    expect(read('package.json').version).toBe('1.1.0')
  })

  it('plugin.json carries a non-empty changelog of strings for the upgrade dialog', () => {
    const { changelog } = read('plugin.json')
    expect(Array.isArray(changelog)).toBe(true)
    expect(changelog.length).toBeGreaterThan(0)
    expect(changelog.every((l: unknown) => typeof l === 'string' && l.trim().length > 0)).toBe(true)
  })
})
