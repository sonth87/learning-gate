/**
 * Returns the active `.pylearn-root` container width (or `window.innerWidth` fallback).
 * Works accurately both on real mobile viewports and inside `@sonth87/device-layout`
 * phone/tablet frames or resized desktop windows.
 */
export function getAppContainerWidth(): number {
  if (typeof window === 'undefined') return 1200;
  const el = document.querySelector('.pylearn-root') as HTMLElement | null;
  if (el && el.clientWidth > 0) {
    return el.clientWidth;
  }
  return window.innerWidth;
}

export function getAppContainerHeight(): number {
  if (typeof window === 'undefined') return 800;
  const el = document.querySelector('.pylearn-root') as HTMLElement | null;
  if (el && el.clientHeight > 0) {
    return el.clientHeight;
  }
  return window.innerHeight;
}
