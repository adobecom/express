/* eslint-env mocha */
/* eslint-disable no-unused-vars */

import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import(
  '../../../../express/blocks/quotes/quotes.js'
);
const body = await readFile({ path: './mocks/body.html' });
const singular = await readFile({ path: './mocks/singular.html' });

describe('Quotes', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Quotes exists', () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    decorate(quotes);
    expect(quotes).to.exist;
  });

  it('All direct div children get "quote" class', () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    decorate(quotes);

    quotes.querySelectorAll(':scope>div').forEach((card) => {
      expect(card.classList.contains('quote')).to.be.true;
    });
  });

  it('Author and summary are well constructed', () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    decorate(quotes);

    quotes.querySelectorAll(':scope>div').forEach((card) => {
      document.body.innerHTML = body;
      if (card.children.length > 1) {
        const author = card.children[1];
        expect(author.classList.contains('author')).to.be.true;
        expect(author.querySelector('.summary')).to.exist;
      }
    });
  });

  it('First child of each card has "content" class', () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    decorate(quotes);

    quotes.querySelectorAll(':scope>div').forEach((card) => {
      expect(card.firstElementChild.classList.contains('content')).to.be.true;
    });
  });

  it('Picture is wrapped in div with class "image"', () => {
    document.body.innerHTML = body;
    const quotes = document.querySelector('.quotes');
    decorate(quotes);

    const image = document.querySelector('.image');
    expect(image).to.exist;
  });

  it('creates a quotes singular variant block', () => {
    document.body.innerHTML = singular;
    const quotes = document.querySelector('.quotes');
    decorate(quotes);

    const quoteContainer = document.querySelector('.quote-container');
    expect(quoteContainer).to.exist;
  });
});
