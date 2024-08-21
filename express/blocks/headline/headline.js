// avoid using this kind of text-block unless necessary
export default function init(el) {
  const heading = el.querySelector('h1, h2, h3, h4, h5, h6');
  const cfg = el.querySelector(':scope p:last-of-type');
  try {
    if (cfg === heading) return el;
    cfg.textContent.split(',').forEach((item) => {
      const [key, value] = item.split(':').map((t) => t.trim().toLowerCase());
      heading.style[key] = value;
    });
    cfg.remove();
  } catch (e) {
    window.lana?.log(e);
  }

  return el;
}
