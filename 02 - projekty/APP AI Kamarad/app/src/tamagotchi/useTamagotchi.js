import { useCallback, useEffect, useRef, useState } from 'react'

import { load, save } from '../lib/platform.js'
import { act as engineAct, bondLevel, createPet, tick } from './engine.js'

const KEY = 'partak.v1.pet'

export function useTamagotchi() {
  const [pet, setPet] = useState(() => tick(load(KEY, createPet())))
  const petRef = useRef(pet)

  useEffect(() => {
    const id = setInterval(() => setPet((p) => tick(p)), 10_000)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    petRef.current = pet
    save(KEY, pet)
  }, [pet])

  /** Provede akci a vrátí { result, xpGained, levelUp }. */
  const act = useCallback((action, payload) => {
    const before = bondLevel(petRef.current.xp).level
    const r = engineAct(petRef.current, action, payload)
    petRef.current = r.pet
    setPet(r.pet)
    const after = bondLevel(r.pet.xp).level
    return { ...r, levelUp: after > before ? after : null }
  }, [])

  const reset = useCallback(() => {
    const fresh = createPet()
    petRef.current = fresh
    setPet(fresh)
  }, [])

  return { pet, act, reset }
}
