export function populateSessionStorage(payload) {
  let storagePackage = JSON.parse(sessionStorage.getItem('qa-record'));

  if (!storagePackage) {
    storagePackage = {
      configs: {
        host: window.location.host,
        audience: document.body.dataset.device,
      },
    };
  } else {
    storagePackage.configs.host = window.location.host;
    storagePackage.configs.audience = document.body.dataset.device;
  }

  payload.forEach((page) => {
    const pagePackage = {
      checks: {},
      note: '',
    };

    page.items.forEach((item) => {
      pagePackage.checks[item.idx] = {
        value: item.text,
        result: 'pending',
      };
    });

    storagePackage[page.link] = pagePackage;
  });

  sessionStorage.setItem('qa-record', JSON.stringify(storagePackage));
}

export function updateSessionStorageChecks(page, form) {
  const allCheckboxes = form.querySelectorAll('input[type="checkbox"]');
  const noteArea = form.querySelector('textarea');
  const sessionRecord = JSON.parse(sessionStorage.getItem('qa-record'));
  const pageRecord = sessionRecord[page.link];

  allCheckboxes.forEach((checkbox) => {
    const checkRecord = pageRecord.checks[checkbox.dataset.idx];
    if (checkRecord) {
      checkRecord.result = checkbox.checked;
    }
  });

  if (noteArea?.value) {
    pageRecord.note = noteArea.value;
  }

  sessionRecord[page.link] = pageRecord;

  sessionStorage.setItem('qa-record', JSON.stringify(sessionRecord));
}

export function setQAConfig(key, val) {
  const sessionRecord = JSON.parse(sessionStorage.getItem('qa-record'));

  if (sessionRecord) {
    sessionRecord.configs[key] = val;
    sessionStorage.setItem('qa-record', JSON.stringify(sessionRecord));
  } else {
    const configObj = {
      configs: {},
    };
    configObj.configs[key] = val;

    sessionStorage.setItem('qa-record', JSON.stringify(configObj));
  }
}

export function getQAConfig(key) {
  const sessionRecord = JSON.parse(sessionStorage.getItem('qa-record'));

  if (sessionRecord) {
    return sessionRecord.configs?.[key];
  }

  return null;
}
