import { getLocale } from './utils.js';
import fetchAllTemplatesMetadata from './all-templates-metadata.js';

async function existsTemplatePage(url) {
  const allTemplatesMetadata = await fetchAllTemplatesMetadata();
  return allTemplatesMetadata.some((e) => e.url === url);
}

export default async function redirectToExistingPage() {
  // TODO: check if the search query points to an existing page. If so, redirect.
  const { topics, tasks, tasksx } = new Proxy(new URLSearchParams(window.location.search), {
    get: (searchParams, prop) => searchParams.get(prop),
  });
  const sanitizedTopics = topics && topics !== "''" ? `/${topics}` : '';
  const sanitizedTasks = tasks && tasks !== "''" ? `/${tasks}` : '';
  const sanitizedTasksX = tasksx && tasksx !== "''" ? `/${tasksx}` : '';
  const slash = !(sanitizedTasks || sanitizedTasksX) && !sanitizedTopics ? '/' : '';
  const targetPath = `/express/templates${slash}${sanitizedTasks || sanitizedTasksX}${sanitizedTopics}`;
  const locale = getLocale(window.location);
  const pathToMatch = locale === 'us' ? targetPath : `/${locale}${targetPath}`;
  if (await existsTemplatePage(pathToMatch)) {
    window.location.assign(`${window.location.origin}${pathToMatch}`);
    document.body.style.display = 'none'; // hide the page until the redirect happens
  }
}
