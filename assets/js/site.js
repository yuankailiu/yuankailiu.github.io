/* Sidebar splitter: drag to resize the left column, double-click to reset. */
(function () {
  var wrapper = document.querySelector('.wrapper');
  var bar = document.querySelector('.splitter');
  var header = wrapper && wrapper.querySelector('header');
  if (!wrapper || !bar || !header) return;

  var MIN = 180;
  var MAX = 480;
  var KEY = 'sidebarWidth';

  function setWidth(w) {
    w = Math.max(MIN, Math.min(MAX, Math.round(w)));
    wrapper.style.setProperty('--sidebar-w', w + 'px');
    bar.setAttribute('aria-valuenow', w);
    return w;
  }

  function save(w) {
    try { localStorage.setItem(KEY, String(w)); } catch (e) {}
  }

  try {
    var saved = parseInt(localStorage.getItem(KEY), 10);
    if (saved) setWidth(saved);
  } catch (e) {}

  var dragging = false;
  var pendingX = 0;
  var frame = 0;
  var width = header.getBoundingClientRect().width;

  bar.addEventListener('pointerdown', function (e) {
    dragging = true;
    bar.setPointerCapture(e.pointerId);
    document.body.classList.add('resizing');
    e.preventDefault();
  });

  bar.addEventListener('pointermove', function (e) {
    if (!dragging) return;
    pendingX = e.clientX;
    if (frame) return;
    frame = requestAnimationFrame(function () {
      frame = 0;
      var left = header.getBoundingClientRect().left;
      var half = bar.getBoundingClientRect().width / 2;
      width = setWidth(pendingX - left - half);
    });
  });

  function stop() {
    if (!dragging) return;
    dragging = false;
    document.body.classList.remove('resizing');
    save(width);
  }
  bar.addEventListener('pointerup', stop);
  bar.addEventListener('pointercancel', stop);

  bar.addEventListener('keydown', function (e) {
    var step = e.shiftKey ? 60 : 20;
    var current = header.getBoundingClientRect().width;
    if (e.key === 'ArrowLeft') width = setWidth(current - step);
    else if (e.key === 'ArrowRight') width = setWidth(current + step);
    else return;
    save(width);
    e.preventDefault();
  });

  bar.addEventListener('dblclick', function () {
    wrapper.style.removeProperty('--sidebar-w');
    try { localStorage.removeItem(KEY); } catch (e) {}
  });
})();

/* Tabs: turn each h2 block of a page with `tabs: true` into a tab panel. */
(function () {
  var section = document.querySelector('section.tabbed');
  if (!section) return;

  var headings = [];
  for (var i = 0; i < section.children.length; i++) {
    if (section.children[i].tagName === 'H2') headings.push(section.children[i]);
  }
  if (headings.length < 2) return;

  var end = section.querySelector('.tabs-end');
  var tablist = document.createElement('div');
  tablist.className = 'tabs';
  tablist.setAttribute('role', 'tablist');

  var panels = [];
  var tabs = [];

  headings.forEach(function (h, n) {
    var panel = document.createElement('div');
    panel.className = 'tab-panel';
    panel.setAttribute('role', 'tabpanel');
    panel.id = h.id || ('tab-' + n);
    h.removeAttribute('id');
    section.insertBefore(panel, h);

    var node = h;
    while (node && node !== end && !(node !== h && node.tagName === 'H2')) {
      var next = node.nextSibling;
      panel.appendChild(node);
      node = next;
    }

    var tab = document.createElement('button');
    tab.type = 'button';
    tab.setAttribute('role', 'tab');
    tab.id = 'tabbtn-' + panel.id;
    tab.setAttribute('aria-controls', panel.id);
    tab.textContent = h.textContent;
    panel.setAttribute('aria-labelledby', tab.id);
    tab.addEventListener('click', function () { activate(n, true); });
    tablist.appendChild(tab);

    panels.push(panel);
    tabs.push(tab);
  });

  section.insertBefore(tablist, panels[0]);
  section.classList.add('tabs-ready');

  function activate(n, updateHash) {
    for (var k = 0; k < panels.length; k++) {
      var on = (k === n);
      panels[k].hidden = !on;
      tabs[k].setAttribute('aria-selected', on ? 'true' : 'false');
      tabs[k].tabIndex = on ? 0 : -1;
    }
    if (updateHash) history.replaceState(null, '', '#' + panels[n].id);
  }

  tablist.addEventListener('keydown', function (e) {
    var n = tabs.indexOf(document.activeElement);
    if (n < 0) return;
    if (e.key === 'ArrowRight') n = (n + 1) % tabs.length;
    else if (e.key === 'ArrowLeft') n = (n - 1 + tabs.length) % tabs.length;
    else return;
    activate(n, true);
    tabs[n].focus();
    e.preventDefault();
  });

  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1));
    var target = id && document.getElementById(id);
    for (var k = 0; k < panels.length; k++) {
      if (target && panels[k].contains(target)) return k;
    }
    return 0;
  }

  function openFromHash() {
    var n = fromHash();
    activate(n, false);
    // A link straight to a tab (e.g. #news) lands on the tab bar, not below it
    if (location.hash.slice(1) === panels[n].id) tablist.scrollIntoView({ block: 'start' });
  }

  window.addEventListener('hashchange', openFromHash);
  openFromHash();
  // The browser jumps to the #anchor after this script runs, so redo the scroll once loaded
  window.addEventListener('load', function () { setTimeout(openFromHash, 0); });
})();
