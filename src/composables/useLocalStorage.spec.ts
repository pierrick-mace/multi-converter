import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { useLocalStorage } from './useLocalStorage'

describe('useLocalStorage', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('falls back to the default when nothing is stored yet', () => {
    const value = useLocalStorage('converter:test:missing', 'default')
    expect(value.value).toBe('default')
  })

  it('reads an already-stored value on creation', () => {
    localStorage.setItem('converter:test:pair', JSON.stringify({ from: 'EUR', to: 'USD' }))
    const value = useLocalStorage('converter:test:pair', { from: 'A', to: 'B' })
    expect(value.value).toEqual({ from: 'EUR', to: 'USD' })
  })

  it('writes through to storage when the ref changes (read/write round-trip)', async () => {
    const first = useLocalStorage('converter:test:amount', 0)
    first.value = 42
    await nextTick()
    expect(localStorage.getItem('converter:test:amount')).toBe('42')

    // A fresh instance over the same key picks up the persisted value.
    const second = useLocalStorage('converter:test:amount', 0)
    expect(second.value).toBe(42)
  })

  it('persists in-place mutations of an array value via the deep watch', async () => {
    const value = useLocalStorage<string[]>('converter:test:list', [])
    value.value.push('USD')
    await nextTick()
    expect(localStorage.getItem('converter:test:list')).toBe('["USD"]')
  })

  it('falls back to the default on corrupted JSON', () => {
    localStorage.setItem('converter:test:corrupted', '{not valid json')
    const value = useLocalStorage('converter:test:corrupted', 'fallback')
    expect(value.value).toBe('fallback')
  })

  describe('when storage is unavailable', () => {
    let getItemSpy: ReturnType<typeof vi.spyOn>
    let setItemSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      getItemSpy = vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('SecurityError: storage is disabled')
      })
      setItemSpy = vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('SecurityError: storage is disabled')
      })
    })

    afterEach(() => {
      getItemSpy.mockRestore()
      setItemSpy.mockRestore()
    })

    it('falls back to the default when reading throws', () => {
      const value = useLocalStorage('converter:test:blocked', 'fallback')
      expect(value.value).toBe('fallback')
      expect(getItemSpy).toHaveBeenCalled()
    })

    it('silently skips the write when it throws, without breaking the ref', async () => {
      const value = useLocalStorage('converter:test:blocked', 'fallback')

      expect(() => {
        value.value = 'changed'
      }).not.toThrow()
      await nextTick()

      expect(value.value).toBe('changed')
      expect(setItemSpy).toHaveBeenCalled()
    })
  })
})