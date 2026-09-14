import { useEffect, useRef, useState, type RefObject } from 'react'

/**
 * Measures a container so a layout can respond to the space it actually has,
 * rather than to the window width — the sidebar means the two differ by 220px.
 * Used where CSS alone can't express the change (a flex row that has to become
 * a stack, a grid that has to give up its emphasis ratio).
 */
export function useElementWidth<T extends HTMLElement>(): [RefObject<T>, number] {
  const ref = useRef<T>(null)
  const [width, setWidth] = useState(0)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    setWidth(el.getBoundingClientRect().width)
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) setWidth(entry.contentRect.width)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return [ref, width]
}
