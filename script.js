(() => {
  const search = document.getElementById('search');
  const expandBtn = document.getElementById('expand-all');
  const collapseBtn = document.getElementById('collapse-all');
  const items = Array.from(document.querySelectorAll('details.q'));

  // Cache plain-text content for fast search
  items.forEach(el => {
    el.dataset.text = el.textContent.toLowerCase();
  });

  const normalize = s => s.toLowerCase().trim();

  function filter(query) {
    const q = normalize(query);
    if (!q) {
      items.forEach(el => {
        el.classList.remove('hidden');
        clearHighlights(el);
      });
      return;
    }
    items.forEach(el => {
      if (el.dataset.text.includes(q)) {
        el.classList.remove('hidden');
        highlight(el, q);
      } else {
        el.classList.add('hidden');
      }
    });
  }

  function clearHighlights(el) {
    el.querySelectorAll('mark').forEach(m => {
      const parent = m.parentNode;
      parent.replaceChild(document.createTextNode(m.textContent), m);
      parent.normalize();
    });
  }

  function highlight(el, q) {
    clearHighlights(el);
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
      acceptNode: (node) => {
        if (!node.nodeValue.toLowerCase().includes(q)) return NodeFilter.FILTER_REJECT;
        if (node.parentNode && node.parentNode.tagName === 'SCRIPT') return NodeFilter.FILTER_REJECT;
        return NodeFilter.FILTER_ACCEPT;
      }
    });
    const matches = [];
    let n;
    while ((n = walker.nextNode())) matches.push(n);
    matches.forEach(node => {
      const text = node.nodeValue;
      const lower = text.toLowerCase();
      const frag = document.createDocumentFragment();
      let i = 0;
      while (i < text.length) {
        const idx = lower.indexOf(q, i);
        if (idx === -1) {
          frag.appendChild(document.createTextNode(text.slice(i)));
          break;
        }
        if (idx > i) frag.appendChild(document.createTextNode(text.slice(i, idx)));
        const mark = document.createElement('mark');
        mark.textContent = text.slice(idx, idx + q.length);
        frag.appendChild(mark);
        i = idx + q.length;
      }
      node.parentNode.replaceChild(frag, node);
    });
  }

  let timer;
  search.addEventListener('input', (e) => {
    clearTimeout(timer);
    timer = setTimeout(() => filter(e.target.value), 80);
  });

  expandBtn.addEventListener('click', () => {
    items.forEach(el => { if (!el.classList.contains('hidden')) el.open = true; });
  });
  collapseBtn.addEventListener('click', () => {
    items.forEach(el => el.open = false);
  });

  // Allow ctrl+f-style focus via '/'
  document.addEventListener('keydown', (e) => {
    if (e.key === '/' && document.activeElement !== search) {
      e.preventDefault();
      search.focus();
    }
    if (e.key === 'Escape' && document.activeElement === search) {
      search.value = '';
      filter('');
      search.blur();
    }
  });
})();
