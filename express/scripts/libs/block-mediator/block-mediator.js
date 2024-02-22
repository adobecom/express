// context + cross-block interactions
window.bmd8r = (() => {
  const stores = {}; // { [name]: { cbs: [cb], value: any } }

  const initStore = (name) => {
    stores[name] = { cbs: [] };
  };

  const hasStore = (name) => name in stores;

  const listStores = () => Object.keys(stores);

  const get = (name) => stores[name]?.v;

  /**
   * @param {string} name
   * @param {any} v
   * @returns {Promise<{ succeed: boolean, errors: Error[] }>}
   */
  const set = (name, v) => {
    if (!hasStore(name)) {
      initStore(name);
    }
    const oldValue = get(name);
    stores[name].v = v;
    return new Promise((resolve) => {
      const errors = [];
      for (const cb of stores[name].cbs) {
        try {
          cb({ oldValue, newValue: v });
        } catch (e) {
          errors.push(e);
        }
      }
      resolve(errors);
    });
  };

  /**
   * @param {string} name
   * @param {function({ oldValue: any, newValue: any }): void} cb
   * @returns {function(): void} unsubscribe func
   * @example
   * const unsubscribe = mediator.subscribe('storeName', ({ oldValue, newValue }) => {
   *  reactToNewValue(newValue, oldValue);
   * });
   * @notes
   * 1. It doesn't filter duplicate events
   * 2. undefined oldValue means the store was just created
   * 3. Can subscribe more than once, but unsubscribe wisely to avoid memory leaks
   * 4. Can subscribe to an nonexistent store and get notified of creation
   * 5. Simple cbs plz. Don't call set or subscribe leading to loops
   * 6. Handle errors in cb, or setter will catch them
   */
  const subscribe = (name, cb) => {
    if (!hasStore(name)) {
      initStore(name);
    }
    const store = stores[name];
    if (store.cbs.includes(cb)) return () => {};
    store.cbs.push(cb);
    const unsubscribe = () => {
      store.cbs = store.cbs.filter((f) => f !== cb);
    };
    return unsubscribe;
  };

  return {
    hasStore,
    listStores,
    get,
    set,
    subscribe,
  };
})();
