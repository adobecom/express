import { fetchPlaceholders, createTag } from '../../scripts/utils.js';

function showToast(text) {
  const img = createTag('img', { src: '/express/icons/close-white.svg' });
  const span = createTag('span', {}, text);
  const closeBtn = createTag('button', {}, img);
  const toastBtns = createTag('div', { class: 'toast-buttons' }, closeBtn);
  const toast = createTag('div', { class: 'toast show' }, span);
  toast.appendChild(toastBtns);
  document.querySelector('header')?.append(toast);
  closeBtn.addEventListener('click', () => {
    toast.remove();
  });
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

export default async function loadNotifications(notification) {
  if (notification === 'pageDidNotExist') {
    fetchPlaceholders().then((placeholders) => {
      const text = placeholders['page-did-not-exist'] ?? 'This page did not exist for your locale.';
      showToast(text);
    });
  }
  const currentUrl = new URL(window.location.href);
  currentUrl.searchParams.delete('notification');
  window.history.pushState({}, '', currentUrl);
}
