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
    return '2a537e84-b35f-4158-8935-170c22b8ae87';
  }
  return 'bf632803-4412-463d-83c5-757dda3224ee';
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
  // listen on event from instrument.js to know when alloy is loaded from launch
  document.addEventListener('alloyReady', () => {
    window.alloyLoaded = true;
    // resolve the window.alloyLoading promise
    alloyLoadingResolver();
  });
  // show the control in case if there're any errors in launch,
  // which will prevent alloy from loading
  setTimeout(() => {
    if (!window.alloyLoaded) {
      // eslint-disable-next-line no-console
      console.error('Alloy failed to load');
      alloyLoadingResolver();
    }
  }, 5000);
  await window.alloyLoader;
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
