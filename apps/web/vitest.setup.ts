import '@testing-library/jest-dom/vitest';

// The app validates NEXT_PUBLIC_APP_URL at module load (src/env.ts); tests
// need it set so importing pages does not throw.
process.env.NEXT_PUBLIC_APP_URL = 'http://localhost:3000';

// Recharts' responsive charts measure their container with ResizeObserver,
// which jsdom does not implement. Fire the callback once with a fixed size so
// charts render in unit tests.
class ResizeObserverMock implements ResizeObserver {
  private readonly callback: ResizeObserverCallback;
  private readonly observed = new Set<Element>();

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element): void {
    this.observed.add(target);
    this.callback(
      [{ target, contentRect: { width: 720, height: 240 } } as ResizeObserverEntry],
      this,
    );
  }

  unobserve(target: Element): void {
    this.observed.delete(target);
  }

  disconnect(): void {
    this.observed.clear();
  }
}

globalThis.ResizeObserver = ResizeObserverMock;

// jsdom does not implement requestAnimationFrame; Recharts throttles pointer
// events with it, so polyfill it for tests.
if (typeof globalThis.requestAnimationFrame !== 'function') {
  globalThis.requestAnimationFrame = (callback: FrameRequestCallback): number =>
    setTimeout(() => callback(performance.now()), 0) as unknown as number;
  globalThis.cancelAnimationFrame = (handle: number): void => clearTimeout(handle);
}

// jsdom does not implement matchMedia. Vitest 3 used to leave one in place and
// vitest 4 does not, so tests that spy on window.matchMedia need it defined
// before their module body runs.
if (typeof globalThis.matchMedia !== 'function') {
  globalThis.matchMedia = (query: string): MediaQueryList =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    });
}
