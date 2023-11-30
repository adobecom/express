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

// Define the custom audiences mapping for experience decisioning
export const AUDIENCES = {
  mobile: () => window.innerWidth < 600,
  desktop: () => window.innerWidth >= 600,
  'new-visitor': () => !localStorage.getItem('franklin-visitor-returning'),
  'returning-visitor': () => !!localStorage.getItem('franklin-visitor-returning'),
  ccentitled: async () => {
    const res = await window.alloyLoader;
    const segments = getSegmentsFromAlloyResponse(res);
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
