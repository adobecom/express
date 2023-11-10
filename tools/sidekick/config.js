// This file contains the project-specific configuration for the sidekick.
(() => {
  window.hlx.initSidekick({
    project: 'AX',
    outerHost: 'express--adobecom.hlx.live',
    host: 'www.adobe.com',
    byocdn: true,
    hlx3: true,
    pushDownSelector: '#feds-header',
    plugins: [
      // METADATA ---------------------------------------------------------------------
      {
        id: 'metadata',
        condition: (s) => s.isEditor() && s.location.href.includes('metadata.xlsx'),
        button: {
          text: 'Meta Data Inspector',
          action: (_, s) => {
            const { config } = s;
            window.open(`https://${config.innerHost}/tools/metadata/inspector.html`, 'hlx-sidekick-spark-metadata-inspector');
          },
        },
      },
      // TEMPLATES --------------------------------------------------------------------
      {
        id: 'templates',
        condition: (s) => s.isEditor()
          && (s.location.pathname.includes('/:w:/') || s.location.href.includes('doc.aspx?')),
        button: {
          text: 'Templates',
          action: (_, s) => {
            const { config } = s;
            window.open(`https://${config.innerHost}/tools/templates/picker.html`, 'hlx-sidekick-spark-templates');
          },
        },
      },
    ],
  });
})();
