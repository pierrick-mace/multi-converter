// Node 22+ ships its own `localStorage`/`Storage` globals (Web Storage API),
// gated behind `--localstorage-file`. Vitest's jsdom environment only copies
// a window property onto the global scope when that name isn't already
// present on Node's own global object (see vitest's `populateGlobal`), so
// with an unflagged Node runtime `globalThis.localStorage` resolves to
// Node's own inert implementation (reads return `undefined`, a warning is
// printed) rather than jsdom's real, working `Storage`, even though
// `window.localStorage` inside a real browser (and inside the actual app)
// works fine.
//
// Restore the real jsdom `Storage` instance so specs (and any app code
// exercised by them, e.g. `useLocalStorage`) see an ordinary, working
// `localStorage`, same as in a browser.
const jsdomWindow = (globalThis as { jsdom?: { window?: Window } }).jsdom?.window
if (jsdomWindow && !(globalThis.localStorage instanceof jsdomWindow.Storage)) {
  Object.defineProperty(globalThis, 'localStorage', {
    value: jsdomWindow.localStorage,
    configurable: true,
    writable: true,
  })
  Object.defineProperty(globalThis, 'sessionStorage', {
    value: jsdomWindow.sessionStorage,
    configurable: true,
    writable: true,
  })
}