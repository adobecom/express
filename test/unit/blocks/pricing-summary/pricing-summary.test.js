import { readFile } from '@web/test-runner-commands';
import { expect } from '@esm-bundle/chai';

const { default: decorate } = await import('../../../../express/blocks/pricing-summary/pricing-summary.js');
document.body.innerHTML = await readFile({ path: './mocks/body.html' });

describe('Pricing Summary', () => {
  before(() => {
    window.isTestEnv = true;
  });

  it('Pricing Summary exists', () => {
    const pricingSummary = document.querySelector('.pricing-summary');
    decorate(pricingSummary);
    expect(pricingSummary).to.exist;
  });

  it('Columns to be 2 or 3', () => {
    const columns = document.querySelectorAll('.pricing-column');
    expect(columns).to.exist;
    expect(columns.length).to.be.oneOf([2, 3]);
  });

  it('Columns have correct elements', () => {
    expect(document.querySelector('.pricing-header')).to.exist;
    expect(document.querySelector('.pricing-description')).to.exist;
    expect(document.querySelector('.pricing-plan')).to.exist;
    expect(document.querySelector('.pricing-price')).to.exist;
  });

  it('Should have a free plan with correct details', () => {
    const freePlan = document.querySelector('#free');
    expect(freePlan).to.exist;

    const freeIcon = document.querySelector('.icon-free-icon');
    expect(freeIcon).to.exist;

    const firstColumn = document.querySelectorAll('.pricing-column')[0];
    const freeDescription = firstColumn.querySelector('.pricing-description');
    expect(freeDescription.textContent).to.include('Free use');
  });

  it('Should have a premium plan with correct details', () => {
    const premiumPlan = document.querySelector('#premium');
    expect(premiumPlan).to.exist;

    const premiumIcon = document.querySelector('.icon-premium-icon');
    expect(premiumIcon).to.exist;

    const secondColumn = document.querySelectorAll('.pricing-column')[1];
    const premiumDescription = secondColumn.querySelector('.pricing-description');
    expect(premiumDescription.textContent).to.include('premium features');
  });

  it('Should contain the correct billing notice', () => {
    const billingNotice = document.querySelector('.pricing-summary > div:last-child div');
    expect(billingNotice.textContent.includes('Billing begins when your free trial ends')).to.be.true;
  });
});
