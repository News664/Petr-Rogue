let _container = null;
let _screens   = {};
let _current   = null;
let _navHook   = null;

export function initRouter(container, screens) {
  _container = container;
  _screens   = screens;
}

export function setNavHook(fn) {
  _navHook = fn;
}

export function navigate(screenName, payload = {}) {
  if (_current?.teardown) _current.teardown();
  _container.innerHTML = '';
  _current = _screens[screenName];
  if (!_current) { console.error(`Unknown screen: ${screenName}`); return; }
  _current.init(_container, payload);
  _navHook?.(screenName);
}
