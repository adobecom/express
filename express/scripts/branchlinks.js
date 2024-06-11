import { fetchPlaceholders, getCachedMetadata, toCamelCase, } from './utils.js';

function getPlacement(btn) {
  const parentBlock = btn.closest('.block');
  let placement = 'outside-blocks';

  if (parentBlock) {
    const blockName = parentBlock.dataset.blockName || parentBlock.classList[0];
    const sameBlocks = btn.closest('main')?.querySelectorAll(`.${blockName}`);

    if (sameBlocks && sameBlocks.length > 1) {
      sameBlocks.forEach((b, i) => {
        if (b === parentBlock) {
          placement = `${blockName}-${i + 1}`;
        }
      });
    } else {
      placement = blockName;
    }

    if (['template-list', 'template-x'].includes(blockName) && btn.classList.contains('placeholder')) {
      placement = 'blank-template-cta';
    }
  }

  return placement;
}

const setBasicBranchMetadata = new Set([
  'search-term',
  'canvas-height',
  'canvas-width',
  'canvas-unit',
  'sceneline',
  'task-id',
  'asset-collection',
  'category',
  'search-category',
  'loadprintaddon',
  'tab',
  'action',
  'prompt',
]);

export default async function trackBranchParameters(links) {
  const placeholders = await fetchPlaceholders();
  const rootUrl = new URL(window.location.href);
  const params = rootUrl.searchParams;
  const pageUrl = window.location.pathname;

  const { experiment } = window.hlx;
  const { referrer } = window.document;
  const experimentStatus = experiment ? experiment.status.toLocaleLowerCase() : null;

  const listBranchMetadataNodes = [...document.head.querySelectorAll('meta[name^=branch-]')];
  const listAdditionalBranchMetadataNodes = listBranchMetadataNodes.filter((e) => !setBasicBranchMetadata.has(e.name.replace(/^branch-/, '')));

  const [
    searchTerm,
    canvasHeight,
    canvasWidth,
    canvasUnit,
    sceneline,
    taskID,
    assetCollection,
    category,
    searchCategory,
    loadPrintAddon,
    tab,
    action,
    prompt,
    sdid,
    mv,
    mv2,
    sKwcId,
    efId,
    promoId,
    trackingId,
    cgen,
  ] = [
      getCachedMetadata('branch-search-term'),
      getCachedMetadata('branch-canvas-height'),
      getCachedMetadata('branch-canvas-width'),
      getCachedMetadata('branch-canvas-unit'),
      getCachedMetadata('branch-sceneline'),
      getCachedMetadata('branch-task-id'),
      getCachedMetadata('branch-asset-collection'),
      getCachedMetadata('branch-category'),
      getCachedMetadata('branch-search-category'),
      getCachedMetadata('branch-loadprintaddon'),
      getCachedMetadata('branch-tab'),
      getCachedMetadata('branch-action'),
      getCachedMetadata('branch-prompt'),
      params.get('sdid'),
      params.get('mv'),
      params.get('mv2'),
      params.get('s_kwcid'),
      params.get('ef_id'),
      params.get('promoid'),
      params.get('trackingid'),
      params.get('cgen'),
    ];

  links.forEach((a) => {
    if (a.href && a.href.match(/adobesparkpost(-web)?\.app\.link/)) {
      a.rel = 'nofollow';
      const btnUrl = new URL(a.href);
      const isSearchBranchLink = placeholders['search-branch-links']?.replace(/\s/g, '').split(',').includes(`${btnUrl.origin}${btnUrl.pathname}`);
      const urlParams = btnUrl.searchParams;
      const setParams = (k, v) => {
        if (v) urlParams.set(k, encodeURIComponent(v));
      };
      if (urlParams.has('acomx-dno')) {
        urlParams.delete('acomx-dno');
        btnUrl.search = urlParams.toString();
        a.href = decodeURIComponent(btnUrl.toString());
        return;
      }
      const placement = getPlacement(a);

      if (isSearchBranchLink) {
        setParams('category', category || 'templates');
        setParams('taskID', taskID);
        setParams('assetCollection', assetCollection);
        setParams('height', canvasHeight);
        setParams('width', canvasWidth);
        setParams('unit', canvasUnit);
        setParams('sceneline', sceneline);

        if (searchCategory) {
          setParams('searchCategory', searchCategory);
        } else if (searchTerm) {
          setParams('q', searchTerm);
        }
        if (loadPrintAddon) setParams('loadPrintAddon', loadPrintAddon);
        setParams('tab', tab);
        setParams('action', action);
        setParams('prompt', prompt);
      }

      for (const { name, content } of listAdditionalBranchMetadataNodes) {
        const paramName = toCamelCase(name.replace(/^branch-/, ''));
        setParams(paramName, content);
      }
      
      setParams('referrer', referrer);
      setParams('url', pageUrl);
      setParams('sdid', sdid);
      setParams('mv', mv);
      setParams('mv2', mv2);
      setParams('efid', efId);
      setParams('promoid', promoId);
      setParams('trackingid', trackingId);
      setParams('cgen', cgen);
      setParams('placement', placement);

      if (sKwcId) {
        const sKwcIdParameters = sKwcId.split('!');

        if (typeof sKwcIdParameters[2] !== 'undefined' && sKwcIdParameters[2] === '3') {
          setParams('customer_placement', 'Google%20AdWords');
        }

        if (typeof sKwcIdParameters[8] !== 'undefined' && sKwcIdParameters[8] !== '') {
          setParams('keyword', sKwcIdParameters[8]);
        }
      }

      experimentStatus === 'active' && setParams('expid', `${experiment.id}-${experiment.selectedVariant}`);

      btnUrl.search = urlParams.toString();
      a.href = decodeURIComponent(btnUrl.toString());
    }
  });
}
