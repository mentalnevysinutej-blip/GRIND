import assert from 'node:assert/strict'
import { test } from 'node:test'

import { FLOOR, act, bondLevel, createPet, emotionOf, tick } from './engine.js'

const HOUR = 3600 * 1000
const T0 = 1_700_000_000_000

test('potřeby v čase klesají, ale nikdy pod FLOOR (avatar neumře)', () => {
  const pet = tick(createPet(T0), T0 + 1000 * HOUR)
  for (const need of ['sytost', 'energie', 'nalada', 'zdravi']) {
    assert.ok(pet[need] >= FLOOR, `${need} = ${pet[need]}`)
  }
})

test('dlouhá pauza se počítá nejvýš jako 12 hodin', () => {
  const day = tick(createPet(T0), T0 + 24 * HOUR)
  const week = tick(createPet(T0), T0 + 7 * 24 * HOUR)
  assert.deepEqual({ ...day, updatedAt: 0 }, { ...week, updatedAt: 0 })
})

test('režim dovolená potřeby zmrazí', () => {
  const { pet } = act(createPet(T0), 'pause', null, T0)
  const later = tick(pet, T0 + 10 * HOUR)
  assert.equal(later.sytost, 80)
})

test('spánek dobíjí energii a vyspalý avatar se sám probudí', () => {
  let pet = { ...createPet(T0), energie: 20 }
  pet = act(pet, 'sleep', null, T0).pet
  pet = tick(pet, T0 + 2 * HOUR)
  assert.equal(pet.asleep, true)
  assert.ok(pet.energie > 55)
  pet = tick(pet, T0 + 6 * HOUR)
  assert.equal(pet.asleep, false)
})

test('krmení přidá sytost a XP, ale XP má cooldown', () => {
  const pet0 = { ...createPet(T0), sytost: 40 }
  const a = act(pet0, 'feed', 'polevka', T0)
  assert.equal(a.pet.sytost, 70)
  assert.equal(a.xpGained, 10)
  const b = act(a.pet, 'feed', 'jablko', T0 + 1000)
  assert.equal(b.xpGained, 0)
  assert.ok(b.pet.xp === a.pet.xp)
})

test('přejedený avatar odmítne jídlo', () => {
  const { result } = act({ ...createPet(T0), sytost: 99 }, 'feed', 'jablko', T0)
  assert.equal(result, 'feedFull')
})

test('pouto nikdy neklesá, ani při zanedbání', () => {
  const pet = { ...createPet(T0), xp: 500 }
  assert.equal(tick(pet, T0 + 100 * HOUR).xp, 500)
})

test('úroveň pouta roste s XP', () => {
  assert.equal(bondLevel(0).level, 1)
  assert.equal(bondLevel(40).level, 2)
  assert.ok(bondLevel(5000).level > 10)
  assert.ok(bondLevel(1e9).level <= 50)
})

test('emoce odpovídá stavu', () => {
  assert.equal(emotionOf({ ...createPet(T0), asleep: true }), 'sleep')
  assert.equal(emotionOf({ ...createPet(T0), sytost: 10 }), 'hungry')
  assert.equal(emotionOf({ ...createPet(T0), nalada: 90 }), 'happy')
})
