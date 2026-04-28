/* Hendrix contact form
 *
 * Posts JSON to the endpoint declared on the <form data-endpoint="…">.
 * If no endpoint is configured (or the request fails) the form falls back
 * to opening the visitor's mail client so a lead is never silently lost.
 *
 * The endpoint should accept POST application/json and return any 2xx
 * response on success. An n8n webhook, HubSpot Forms API, Netlify forms
 * proxy, or a small Cloudflare Worker all work without code changes.
 */
(function () {
  const form = document.querySelector('[data-contact-form]');
  if (!form) return;

  const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  // Pre-select the interest chip(s) when the page is opened with ?intent=…
  // so a click on "Start with a small pilot" lands the user on a contact
  // form already pointed at the right thing. Multiple intents may be
  // comma-separated (e.g. ?intent=pilot,training).
  try {
    const params = new URLSearchParams(location.search);
    const intent = params.get('intent');
    if (intent) {
      const wanted = intent.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean);
      form.querySelectorAll('input[data-intent][type="checkbox"]').forEach((el) => {
        if (wanted.includes(el.dataset.intent.toLowerCase())) el.checked = true;
      });
    }
  } catch (e) { /* no-op — never block the form */ }

  const successEl = form.querySelector('.form__success');
  const errorEl   = form.querySelector('.form__server-error');
  const submitBtn = form.querySelector('button[type="submit"]');

  const setBusy = (busy) => {
    if (!submitBtn) return;
    submitBtn.disabled = busy;
    submitBtn.dataset.label = submitBtn.dataset.label || submitBtn.textContent.trim();
    submitBtn.textContent = busy ? 'Sending…' : submitBtn.dataset.label;
  };

  const validate = () => {
    let ok = true;
    form.querySelectorAll('[data-validate]').forEach((field) => {
      const input = field.querySelector('input, select, textarea');
      if (!input) return;
      const rules = field.dataset.validate.split(' ');
      const v = (input.value || '').trim();
      let bad = false;
      if (rules.includes('required') && !v) bad = true;
      if (rules.includes('email') && v && !isEmail(v)) bad = true;
      field.classList.toggle('has-error', bad);
      if (bad) ok = false;
    });
    return ok;
  };

  let submitted = false;
  form.addEventListener('input', (e) => {
    if (!submitted) return;
    const field = e.target.closest('.form__field[data-validate]');
    if (!field) return;
    const input = field.querySelector('input, select, textarea');
    const rules = field.dataset.validate.split(' ');
    const v = (input.value || '').trim();
    let bad = false;
    if (rules.includes('required') && !v) bad = true;
    if (rules.includes('email') && v && !isEmail(v)) bad = true;
    field.classList.toggle('has-error', bad);
  });

  const collect = () => {
    const data = {};
    new FormData(form).forEach((value, key) => {
      if (data[key] === undefined) { data[key] = value; return; }
      if (Array.isArray(data[key])) { data[key].push(value); return; }
      data[key] = [data[key], value];
    });
    // Multi-select interest checkboxes share the name `interest`
    const interest = form.querySelectorAll('input[name="interest"]:checked');
    if (interest.length) {
      data.interest = Array.from(interest).map((i) => i.value);
    }
    data._source = location.pathname;
    data._timestamp = new Date().toISOString();
    return data;
  };

  const mailtoFallback = (payload) => {
    const target = form.dataset.mailto || 'hello@hendrix.health';
    const lines = [
      `Name: ${payload.name || ''}`,
      `Role: ${payload.role || ''}`,
      `Organisation: ${payload.organisation || ''}`,
      `Sector: ${payload.sector || ''}`,
      `Email: ${payload.email || ''}`,
      `Phone: ${payload.phone || ''}`,
      payload.interest ? `Interested in: ${[].concat(payload.interest).join(', ')}` : '',
      '',
      payload.message || ''
    ].filter(Boolean).join('\n');
    const subject = encodeURIComponent(`Website enquiry — ${payload.organisation || payload.name || ''}`);
    const body = encodeURIComponent(lines);
    window.location.href = `mailto:${target}?subject=${subject}&body=${body}`;
  };

  const showSuccess = () => {
    form.classList.add('is-success');
    if (errorEl) errorEl.hidden = true;
    form.reset();
    submitted = false;
    if (successEl) successEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const showError = (msg) => {
    if (!errorEl) return;
    errorEl.hidden = false;
    errorEl.textContent = msg;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submitted = true;
    if (!validate()) {
      const firstError = form.querySelector('.has-error input, .has-error select, .has-error textarea');
      if (firstError) firstError.focus();
      return;
    }

    const endpoint = form.dataset.endpoint;
    const payload = collect();

    if (!endpoint) {
      // No endpoint configured yet — graceful fallback to mailto so leads
      // are still captured during the deploy window.
      mailtoFallback(payload);
      showSuccess();
      return;
    }

    setBusy(true);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      showSuccess();
    } catch (err) {
      showError('Something went wrong sending your message. Please try again, or email hello@hendrix.health directly.');
    } finally {
      setBusy(false);
    }
  });
})();
