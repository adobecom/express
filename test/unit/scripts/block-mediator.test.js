/* eslint-disable no-unused-expressions */
/* eslint-env mocha */

import { expect } from '@esm-bundle/chai';
import '../../../express/scripts/libs/block-mediator/block-mediator.js';

const { bmd8r: mediator } = window;

// that class is not really testable, being singleton and having private methods

const [getCnt, getNextStoreName] = (function storeNameIIFE() {
  let cnt = 0;
  return [
    () => cnt,
    () => {
      const nextName = `store${cnt}`;
      cnt += 1;
      return nextName;
    },
  ];
}());

describe('BlockMediator', () => {
  describe('hasStore', () => {
    it('hasStore should return false for non-existing stores', () => {
      expect(mediator.hasStore('non-existing-store')).to.be.false;
    });
  });

  describe('hasStore, listStores, get, set', async () => {
    const storeName = getNextStoreName();
    await mediator.set(storeName, 'value1');
    it('hasStore should return true for existing stores', () => {
      expect(mediator.hasStore(storeName)).to.be.true;
    });
    it('listStores should return an array with the existing stores', () => {
      expect(mediator.listStores()).to.deep.equal([storeName]);
    });
    it('get should return the value for existing stores', () => {
      expect(mediator.get(storeName)).to.equal('value1');
    });
  });

  describe('subscribe', () => {
    it('should create a new store when it does not exist', () => {
      const storeName = getNextStoreName();
      mediator.subscribe(storeName, () => {});
      expect(mediator.hasStore(storeName)).to.be.true;
      expect(mediator.get(storeName)).to.be.undefined;
    });

    it('should not create a new store when it already exists', async () => {
      const storeName = getNextStoreName();
      mediator.subscribe(storeName, () => {});
      const oldLen = mediator.listStores().length;
      mediator.subscribe(storeName, () => {});
      expect(mediator.listStores().length).to.equal(oldLen);
      await mediator.set(storeName, 42);
      expect(mediator.listStores().length).to.equal(oldLen);
    });

    it('should call the callback when the store is updated', async () => {
      const storeName = getNextStoreName();
      let oldV = null;
      let newV = null;
      mediator.subscribe(storeName, ({ oldValue, newValue }) => {
        oldV = oldValue;
        newV = newValue;
      });
      expect(mediator.get(storeName)).to.be.undefined;

      const errors = await mediator.set(storeName, 'value1');
      expect(errors.length === 0).to.be.true;
      expect(mediator.get(storeName)).to.equal('value1');
      expect(oldV).to.be.undefined;
      expect(newV).to.equal('value1');

      const anotherListner = { value: 1 };
      mediator.subscribe(storeName, ({ newValue }) => {
        anotherListner.value = newValue;
      });

      await mediator.set(storeName, 'value2');
      expect(mediator.get(storeName)).to.equal('value2');
      expect(oldV).to.equal('value1');
      expect(newV).to.equal('value2');
      expect(anotherListner.value).to.equal('value2');

      await mediator.set(storeName, undefined);
      expect(mediator.get(storeName)).to.be.undefined;
      expect(oldV).to.equal('value2');
      expect(newV).to.be.undefined;
    });

    it('should call the callback when the store is updated, when subscribing after the first set', async () => {
      const storeName = getNextStoreName();
      await mediator.set(storeName, 'value1');
      let newV = null;
      mediator.subscribe(storeName, ({ newValue }) => {
        newV = newValue;
      });
      expect(mediator.get(storeName)).to.equal('value1');

      await mediator.set(storeName, 'value1');
      expect(mediator.get(storeName)).to.equal('value1');
      expect(newV).to.equal('value1');
    });

    it('should have all callbacks executed despite errors', async () => {
      const storeName = getNextStoreName();
      let newV = null;
      const err1 = new Error('err1');
      const err2 = new Error('err2');
      mediator.subscribe(storeName, () => {
        throw err1;
      });
      mediator.subscribe(storeName, ({ newValue }) => {
        newV = newValue;
      });
      mediator.subscribe(storeName, () => {
        throw err2;
      });

      const errors = await mediator.set(storeName, 'value1');
      expect(mediator.get(storeName)).to.equal('value1');
      expect(errors.length === 0).to.be.false;
      expect(errors).to.deep.equal([err1, err2]);
      expect(newV).to.equal('value1');
    });

    it('should return a function to unsubscribe the callback', () => {
      const storeName = getNextStoreName();
      const unsubscribe = mediator.subscribe(storeName, () => {});
      expect(unsubscribe).to.be.an.instanceOf(Function);
    });

    it('should not call the callback after unsubscribing it', async () => {
      const storeName = getNextStoreName();
      let called = 0;
      await mediator.set(storeName, 'value1');
      const unsubscribe = mediator.subscribe(storeName, () => {
        called += 1;
      });
      expect(called).to.equal(0);
      const errors = await mediator.set(storeName, 'value2');
      expect(errors.length === 0).to.be.true;
      expect(called).to.equal(1);
      unsubscribe();
      await mediator.set(storeName, 'value3');
      expect(called).to.equal(1);
    });

    it('should have many stores now', () => {
      expect(mediator.listStores().length).to.equal(getCnt());
    });
  });
});
