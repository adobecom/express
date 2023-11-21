import { getHelixEnv } from './utils.js';

export const DEFAULT_EXPERIMENT_OPTIONS = {
  // Generic properties
  rumSamplingRate: 10, // 1 in 10 requests

  // Audiences related properties
  audiences: {},
  audiencesMetaTagPrefix: 'audience',
  audiencesQueryParameter: 'audience',

  // Experimentation related properties
  experimentsRoot: '/experiments',
  experimentsConfigFile: 'manifest.json',
  experimentsMetaTag: 'experiment',
  experimentsQueryParameter: 'experiment',
};

function getCCEntitledUsersSegmentId() {
  const { name } = getHelixEnv();
  if (name === 'prod') {
    return 'bf632803-4412-463d-83c5-757dda3224ee';
  }
  return '2a537e84-b35f-4158-8935-170c22b8ae87';
}

function getSegmentsFromAlloyResponse(response) {
  const segments = [];
  if (response && response.destinations) {
    Object.values(response.destinations).forEach((destination) => {
      if (destination.segments) {
        Object.values(destination.segments).forEach((segment) => {
          segments.push(segment.id);
        });
      }
    });
  }
  return segments;
}

async function getSegmentsFromAlloy() {
  if (!window.alloy) {
    return [];
  }
  if (window.rtcdpSegments) {
    return window.rtcdpSegments;
  }
  await window.alloyLoader;
  let result;
  // avoid multiple calls to alloy for render decisions from different audiences
  if (window.renderDecisionsResult) {
    result = await window.renderDecisionsResult;
  } else {
    // eslint-disable-next-line no-undef
    window.renderDecisionsResult = alloy('sendEvent', {
      renderDecisions: true,
    }).catch((error) => {
      // eslint-disable-next-line no-console
      console.error('Error sending event to alloy:', error);
      return [];
    });
    result = await window.renderDecisionsResult;
  }
  window.rtcdpSegments = getSegmentsFromAlloyResponse(result);
  return window.rtcdpSegments;
}

/**
 * Returns script that initializes a queue for each alloy instance,
 * in order to be ready to receive events before the alloy library is loaded
 * Documentation
 * https://experienceleague.adobe.com/docs/experience-platform/edge/fundamentals/installing-the-sdk.html?lang=en#adding-the-code
 * @type {string}
 */
function getAlloyInitScript() {
  return `!function(n,o){o.forEach(function(o){n[o]||((n.__alloyNS=n.__alloyNS||[]).push(o),n[o]=
  function(){var u=arguments;return new Promise(function(i,l){n[o].q.push([i,l,u])})},n[o].q=[])})}(window,["alloy"]);`;
}

/**
 * Returns datastream id to use as edge configuration id
 * Custom logic can be inserted here in order to support
 * different datastream ids for different environments (non-prod/prod)
 * @returns {{edgeConfigId: string, orgId: string}}
 */
function getDatastreamConfiguration() {
  const orgId = '9E1005A551ED61CA0A490D45@AdobeOrg';
  const edgeConfigIds = {
    prod: '913eac4d-900b-45e8-9ee7-306216765cd2',
    stage: '72b074a6-76d2-43de-a210-124acc734f1c',
  };
  return {
    edgeConfigId: edgeConfigIds[getHelixEnv.name],
    orgId,
  };
}

/**
 * Returns alloy configuration
 * Documentation https://experienceleague.adobe.com/docs/experience-platform/edge/fundamentals/configuring-the-sdk.html
 */
function getAlloyConfiguration(document) {
  const { hostname } = document.location;

  return {
    // enable while debugging
    debugEnabled: hostname.startsWith('localhost') || hostname.includes('--'),
    // disable when clicks are also tracked via sendEvent with additional details
    clickCollectionEnabled: true,
    // adjust default based on customer use case
    defaultConsent: 'in',
    ...getDatastreamConfiguration(),
  };
}

/**
 * Create inline script
 * @param document
 * @param element where to create the script element
 * @param innerHTML the script
 * @param type the type of the script element
 * @returns {HTMLScriptElement}
 */
function createInlineScript(document, element, innerHTML, type) {
  const script = document.createElement('script');
  script.type = type;
  script.innerHTML = innerHTML;
  element.appendChild(script);
  return script;
}

async function loadAlloy() {
  if (window.alloyLoaded) {
    return;
  }
  if (window.alloyLoader) {
    await window.alloyLoader;
    return;
  }
  // create a promise that will be resolved when alloy is loaded
  // this is used to avoid multiple alloy loads
  let alloyLoadingResolver;
  window.alloyLoader = new Promise((resolve) => {
    alloyLoadingResolver = resolve;
  });
  createInlineScript(document, document.body, getAlloyInitScript(), 'text/javascript');
  await import('./libs/alloy.min.js');
  // eslint-disable-next-line no-undef
  await alloy('configure', getAlloyConfiguration(document));
  window.allloyLoaded = true;
  // resolve the window.alloyLoading promise
  alloyLoadingResolver();
}

// Define the custom audiences mapping for experience decisioning
export const AUDIENCES = {
  mobile: () => window.innerWidth < 600,
  desktop: () => window.innerWidth >= 600,
  'new-visitor': () => !localStorage.getItem('franklin-visitor-returning'),
  'returning-visitor': () => !!localStorage.getItem('franklin-visitor-returning'),
  ccentitled: async () => {
    await loadAlloy();
    const segments = await getSegmentsFromAlloy();
    return segments.includes(getCCEntitledUsersSegmentId());
  },
};

/**
 * Checks if any of the configured audiences on the page can be resolved.
 * @param {string[]} applicableAudiences a list of configured audiences for the page
 * @param {object} options the plugin options
 * @returns Returns the names of the resolved audiences, or `null` if no audience is configured
 */
export async function getResolvedAudiences(applicableAudiences, options) {
  if (!applicableAudiences.length || !Object.keys(options.audiences).length) {
    return null;
  }
  // If we have a forced audience set in the query parameters (typically for simulation purposes)
  // we check if it is applicable
  const usp = new URLSearchParams(window.location.search);
  const forcedAudience = usp.has(options.audiencesQueryParameter)
    ? this.toClassName(usp.get(options.audiencesQueryParameter))
    : null;
  if (forcedAudience) {
    return applicableAudiences.includes(forcedAudience) ? [forcedAudience] : [];
  }

  // Otherwise, return the list of audiences that are resolved on the page
  const results = await Promise.all(
    applicableAudiences
      .map((key) => {
        if (options.audiences[key] && typeof options.audiences[key] === 'function') {
          return options.audiences[key]();
        }
        return false;
      }),
  );
  return applicableAudiences.filter((_, i) => results[i]);
}
