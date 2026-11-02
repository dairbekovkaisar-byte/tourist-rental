/* Tourist Equipment Rental Platform — script.js
   The page works without JS (menu = native popover, validation = HTML + CSS,
   theme = CSS :has()). This file adds the rental calculator and small comforts. */

(() => {
  const DAY_MS = 24 * 60 * 60 * 1000;
  const money = new Intl.NumberFormat('ru-RU', { maximumFractionDigits: 0 });
  const tenge = (n) => `${money.format(n)} ₸`;

  /* ---------- 1. Theme: remember the visitor's choice ---------- */
  const themeInputs = document.querySelectorAll('input[name="theme"]');
  try {
    const saved = localStorage.getItem('terp-theme');
    const match = saved && document.getElementById(`theme-${saved}`);
    if (match) match.checked = true;
  } catch { /* storage blocked — the CSS default (system theme) is used */ }

  themeInputs.forEach((input) =>
    input.addEventListener('change', () => {
      try { localStorage.setItem('terp-theme', input.value); } catch { /* ignore */ }
    })
  );

  /* ---------- 2. Mobile menu: close the side panel after a link is tapped ---------- */
  const nav = document.getElementById('site-nav');
  const burger = document.querySelector('.burger');
  const desktop = window.matchMedia('(min-width: 1024px)');

  const closeNav = () => {
    if (nav.matches(':popover-open')) nav.hidePopover();
  };
  nav.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeNav));
  desktop.addEventListener('change', closeNav);
  nav.addEventListener('toggle', (event) => {
    burger.setAttribute('aria-expanded', String(event.newState === 'open'));
  });

  /* ---------- 3. Rental calculator ---------- */
  const form = document.getElementById('booking-form');
  const issue = document.getElementById('issue-date');
  const ret = document.getElementById('return-date');
  const item = document.getElementById('item');
  const qty = document.getElementById('quantity');
  const status = document.getElementById('form-status');
  const out = {
    days: document.getElementById('out-days'),
    rate: document.getElementById('out-rate'),
    discount: document.getElementById('out-discount'),
    total: document.getElementById('out-total'),
  };

  // Dates as yyyy-mm-dd in local time (toISOString would shift to UTC)
  const isoDate = (d) => {
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const today = isoDate(new Date());
  issue.min = today;
  ret.min = today;

  const discountFor = (days) => (days >= 7 ? 0.2 : days >= 3 ? 0.1 : 0);

  // Rental days: same-day return = 1 day, otherwise the number of nights
  const rentalDays = () => {
    if (!issue.value || !ret.value) return 0;
    const diff = Math.round((new Date(ret.value) - new Date(issue.value)) / DAY_MS);
    return diff < 0 ? 0 : Math.max(1, diff);
  };

  const update = () => {
    // The return date may not be earlier than the issue date (checked by the browser via min)
    ret.min = issue.value || today;

    const days = rentalDays();
    const price = Number(item.selectedOptions[0]?.dataset.price || 0);
    const count = Math.min(10, Math.max(1, Number(qty.value) || 1));
    const rate = price * count;
    const discount = discountFor(days);
    const total = Math.round(rate * days * (1 - discount));

    out.days.value = days ? `${days} ${days === 1 ? 'day' : 'days'}` : '—';
    out.rate.value = rate ? tenge(rate) : '—';
    out.discount.value = days ? (discount ? `−${discount * 100}%` : 'none') : '—';
    out.total.value = tenge(total);
  };

  form.addEventListener('input', update);
  form.addEventListener('change', update);

  /* "Rent this …" buttons on the cards pre-select the item in the form */
  document.querySelectorAll('[data-item]').forEach((button) =>
    button.addEventListener('click', () => {
      item.value = button.dataset.item;
      update();
      // focus after the smooth scroll so the keyboard user lands in the form
      setTimeout(() => issue.focus({ preventScroll: true }), 400);
    })
  );

  /* Submit: the browser blocks invalid data (required / type / pattern / min);
     this only runs for a valid form. There is no backend, so we confirm on the page. */
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const name = document.getElementById('contact-name').value.trim();
    const label = item.selectedOptions[0].textContent.split(' — ')[0];
    status.textContent =
      `Thank you, ${name}! Request for ${label} (${out.days.value}, ${out.total.value}) is saved — ` +
      `we will call you to confirm.`;
  });

  update();
})();
