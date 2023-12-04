export function autoWidgetByUSP(name, callback) {
  const usp = new URLSearchParams(window.location.search);
  const qaIndex = parseInt(usp.get(name), 10);

  if (qaIndex) {
    callback();
  }
}

export default function init() {
  const sk = document.querySelector('helix-sidekick');

  const launchQAGuide = async () => {
    const { default: initQAGuide } = await import('../features/qa-guide/qa-guide.js');

    initQAGuide();
  };

  // Auto plugins
  autoWidgetByUSP('qaprogress', launchQAGuide);

  // Add plugin listeners here
  sk.addEventListener('custom:qa-guide', launchQAGuide);
}
