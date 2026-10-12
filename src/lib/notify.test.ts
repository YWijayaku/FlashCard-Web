import { describe, expect, it } from 'vitest'
import { localDayKey, reminderAt, shouldNotify, shouldShowBanner } from './notify'

const at = (h: number, m = 0) => new Date(2026, 5, 15, h, m).getTime()
const base = { enabled: true, permission: 'granted' as const, pendingCount: 5, reminderTime: '19:00', lastNotifiedDay: null, now: at(20) }

describe('notify', () => {
  it('jam pengingat lokal', () => {
    expect(reminderAt('07:30', at(1))).toBe(at(7, 30))
    expect(reminderAt('rusak', at(1))).toBe(at(19))
    expect(localDayKey(at(23, 59))).toBe('2026-06-15')
  })

  it('notifikasi hanya jika semua syarat terpenuhi, sekali per hari', () => {
    expect(shouldNotify(base)).toBe(true)
    expect(shouldNotify({ ...base, now: at(18, 59) })).toBe(false)
    expect(shouldNotify({ ...base, enabled: false })).toBe(false)
    expect(shouldNotify({ ...base, permission: 'denied' })).toBe(false)
    expect(shouldNotify({ ...base, pendingCount: 0 })).toBe(false)
    expect(shouldNotify({ ...base, lastNotifiedDay: '2026-06-15' })).toBe(false)
    expect(shouldNotify({ ...base, lastNotifiedDay: '2026-06-14' })).toBe(true)
  })

  it('banner fallback', () => {
    expect(shouldShowBanner(3, '19:00', at(19))).toBe(true)
    expect(shouldShowBanner(3, '19:00', at(9))).toBe(false)
    expect(shouldShowBanner(0, '19:00', at(21))).toBe(false)
  })
})
