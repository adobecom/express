const BlockMediator = (() => {
  const stores = {}; // { [name]: { callbacks: [cb], value: any } }

  const initStore = (name) => {
    stores[name] = { callbacks: [], value: undefined };
  };

  const hasStore = (name) => name in stores;

  const listStores = () => Object.keys(stores);

  const get = (name) => stores[name]?.value;

  /**
   * @param {string} name
   * @param {any} value
   * @returns {Error[]}
   */
  const set = (name, value) => {
    if (!hasStore(name)) {
      initStore(name);
    }
    const oldValue = get(name);
    stores[name].value = value;
    const errors = [];
    for (const cb of stores[name].callbacks) {
      try {
        cb({ oldValue, newValue: value });
      } catch (e) {
        errors.push(e);
      }
    }
    return errors;
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
    if (store.callbacks.includes(cb)) return () => {};
    store.callbacks.push(cb);
    const unsubscribe = () => {
      store.callbacks = store.callbacks.filter((f) => f !== cb);
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

export default BlockMediator;
