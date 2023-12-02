export function populateSessionStorage(payload) {
  const storagePackage = {
    configs: {},
  };

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

export function setGuideDocLocation(guideDocLocation) {
  const sessionRecord = JSON.parse(sessionStorage.getItem('qa-record'));

  if (sessionRecord) {
    sessionRecord.configs.story = guideDocLocation;
    sessionStorage.setItem('qa-record', JSON.stringify(sessionRecord));
  } else {
    sessionStorage.setItem('qa-record', JSON.stringify({
      config: {
        story: guideDocLocation,
      },
    }));
  }
}

export function getGuideDocLocation() {
  const sessionRecord = JSON.parse(sessionStorage.getItem('qa-record'));

  if (sessionRecord) {
    return sessionStorage.getItem('qa-record').configs?.story;
  }

  return null;
}
