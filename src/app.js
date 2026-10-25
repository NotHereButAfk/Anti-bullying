/* Browser presentation and storage. The story simulation lives in engine.js. */
(function () {
  'use strict';
  const E = window.BellEngine;
  const B = window.BellContent;
  const $ = id => document.getElementById(id);
  const PREFIX = 'after-the-bell-v3:';
  let state = null;
  let notebook = 'people';
  const form = $('character-form');
  function element(tag, text, className) {
    const el = document.createElement(tag);
    if (text !== undefined) el.textContent = text;
    if (className) el.className = className;
    return el;
  }
  function notify(message) { $('status').textContent = message; }
  function read(key) {
    try { return localStorage.getItem(PREFIX + key); }
    catch { notify('Browser storage is unavailable. You can still play and export your story.'); return null; }
  }
  function write(key, value) {
    try {
      const old = localStorage.getItem(PREFIX + key);
      if (old && key !== 'settings') {
        try { E.deserialize(old, B); localStorage.setItem(PREFIX + key + ':backup', old); }
        catch { /* Do not replace a valid backup with an invalid save. */ }
      }
      localStorage.setItem(PREFIX + key, value);
      return true;
    } catch {
      notify('Your story is still in memory, but saving failed. Export a copy from Save & load.');
      return false;
    }
  }
  function persist() { return state ? write('auto', E.serialize(state)) : false; }
  function profileInput() {
    const data = Object.fromEntries(new FormData(form));
    if (!data.seed.trim()) {
      data.seed = window.crypto?.getRandomValues
        ? crypto.getRandomValues(new Uint32Array(1))[0]
        : Math.floor(Math.random() * 4294967295);
    }
    return E.normalizeProfile(data);
  }
  function avatar(id, profile) {
    for (const key of ['skin', 'hair', 'outfit']) $(id).dataset[key] = profile[key];
  }
  function preview() {
    const p = E.normalizeProfile(Object.fromEntries(new FormData(form)));
    $('preview-name').textContent = p.name;
    $('preview-world').textContent = p.school + ' · ' + p.pronouns;
    avatar('creator-avatar', p);
  }
  function openDialog(id) {
    if (!$(id).open) $(id).showModal();
  }
  function closeDialogs() { document.querySelectorAll('dialog[open]').forEach(d => d.close()); }
  function newStory() {
    if (state && !confirm('Return to character creation? Your latest progress remains in autosave until you begin another story. Use a manual slot to keep it separately.')) return;
    state = null;
    render();
    $('resume').classList.toggle('hidden', !read('auto'));
    form.elements.name.focus();
  }
  function selectChoice(id) {
    try {
      state = E.choose(state, id, B);
      persist();
      render(true);
    } catch (error) { notify(error.message); }
  }
  function renderNotebook() {
    const panel = $('notebook');
    panel.replaceChildren();
    for (const tab of ['people', 'journal', 'route']) {
      $('tab-' + tab).setAttribute('aria-selected', String(notebook === tab));
      $('tab-' + tab).tabIndex = notebook === tab ? 0 : -1;
    }
    panel.setAttribute('aria-labelledby', 'tab-' + notebook);
    if (!state) return;
    if (notebook === 'people') {
      for (const [id, person] of Object.entries(E.CAST)) {
        const card = element('section', undefined, 'person');
        card.append(element('h3', person.name), element('p', person.role));
        const memories = state.people[id].memories;
        if (!memories.length) card.append(element('p', 'No shared memory recorded yet.'));
        else {
          const details = element('details');
          details.append(element('summary', memories.length + ' remembered moment' + (memories.length === 1 ? '' : 's')));
          const list = element('ul');
          memories.forEach(memory => list.append(element('li', memory.text)));
          details.append(list);
          card.append(details);
        }
        panel.append(card);
      }
    } else if (notebook === 'journal') {
      panel.append(element('p', 'Private notes and follow-through. Only events from your route appear here.', 'hint'));
      const list = element('ul', undefined, 'notebook-list');
      state.facts.forEach(fact => list.append(element('li', fact)));
      state.updates.forEach(update => {
        const li = element('li', update.text);
        li.append(element('small', 'After choice ' + update.step));
        list.append(li);
      });
      if (!list.children.length) panel.append(element('p', 'Your notebook will fill as you make choices.', 'hint'));
      panel.append(list);
    } else {
      panel.append(element('p', 'The route you actually took. Rewind restores memories and consequences together.', 'hint'));
      for (const h of state.history) {
        const stop = element('div', undefined, 'path-stop');
        stop.append(element('strong', h.step + '. ' + B.scenes[h.from].title), element('span', E.interpolate(h.label, state)));
        panel.append(stop);
      }
      if (!state.history.length) panel.append(element('p', 'Your first decision is still ahead.', 'hint'));
    }
  }
  function render(focus = false) {
    $('creator').classList.toggle('hidden', !!state);
    $('play').classList.toggle('hidden', !state);
    if (!state) { preview(); return; }
    const scene = B.scenes[state.scene];
    $('chapters').replaceChildren();
    B.chapters.forEach((name, i) => {
      const li = element('li', undefined, scene.chapter === i + 1 ? 'current' : '');
      if (scene.chapter === i + 1) li.setAttribute('aria-current', 'step');
      li.append(element('span', String(i + 1).padStart(2, '0')), element('div', name));
      $('chapters').append(li);
    });
    $('school-label').textContent = state.profile.school;
    $('seed-label').textContent = 'Seed ' + state.profile.seed;
    $('scene-meta').textContent = 'Chapter ' + scene.chapter + ' / ' + scene.place;
    $('scene-title').textContent = scene.title;
    $('identity-name').textContent = state.profile.name;
    $('identity-description').textContent = state.profile.pronouns + ' · ' + state.profile.personality;
    avatar('game-avatar', state.profile);
    $('rewind').disabled = state.history.length === 0;
    $('indicators').replaceChildren();
    for (const [key, name] of [['energy', 'Energy'], ['voice', 'Confidence expressing yourself']]) {
      const box = element('div', undefined, 'indicator');
      const label = element('div', undefined, 'indicator-label');
      label.append(element('span', name), element('span', state.stats[key] + '/100'));
      const bar = element('div', undefined, 'track');
      const fill = element('span');
      fill.style.width = state.stats[key] + '%';
      bar.append(fill); box.append(label, bar); $('indicators').append(box);
    }
    $('consequences').replaceChildren();
    state.updates.filter(u => u.step >= state.step - 1).forEach(update => {
      const card = element('section', undefined, 'consequence');
      card.append(element('strong', 'AN EARLIER CHOICE RETURNS'), element('p', update.text));
      $('consequences').append(card);
    });
    $('passages').replaceChildren();
    E.passages(state, B).forEach(passage => {
      if (passage.speaker) {
        const block = element('blockquote', undefined, 'dialogue');
        block.append(element('span', E.interpolate(passage.speaker, state), 'speaker'), element('p', passage.text));
        $('passages').append(block);
      } else $('passages').append(element('p', passage.text));
    });
    $('choices').replaceChildren();
    $('choice-heading').classList.toggle('hidden', state.finished);
    E.available(state, B).forEach((choice, index) => {
      const button = element('button', undefined, 'choice');
      button.dataset.choice = choice.id;
      button.append(element('span', String(index + 1).padStart(2, '0'), 'number'),
        element('span', E.interpolate(choice.label, state)), element('span', '↗', 'arrow'));
      button.addEventListener('click', () => selectChoice(choice.id));
      $('choices').append(button);
    });
    $('epilogues').replaceChildren();
    $('epilogues').classList.toggle('hidden', !state.finished);
    if (state.finished) {
      $('epilogues').append(element('h2', 'What people remember'));
      E.epilogues(state).forEach(person => {
        $('epilogues').append(element('h3', person.name), element('p', person.text));
      });
      const again = element('button', 'Explore a different life', 'primary');
      again.addEventListener('click', newStory);
      $('epilogues').append(again);
    }
    $('scene-count').textContent = state.visited.length + ' scenes visited · ' + state.history.length + ' choices made';
    renderNotebook();
    if (focus) {
      $('scene-title').focus({ preventScroll: true });
      window.scrollTo({ top: Math.max(0, $('play').offsetTop - 15), behavior: 'instant' });
    }
  }
  function loadSlot(slot) {
    try {
      const raw = read(slot);
      if (!raw) throw new Error('There is no saved story in this slot.');
      try { state = E.deserialize(raw, B); }
      catch (error) {
        const backup = read(slot + ':backup');
        if (!backup) throw error;
        state = E.deserialize(backup, B);
        notify('The latest save was invalid. Your last valid backup was recovered.');
      }
      persist(); closeDialogs(); render(true);
    } catch (error) { notify(error.message); }
  }
  function renderSaves() {
    const host = $('save-slots'); host.replaceChildren();
    for (const slot of ['auto', 'slot1', 'slot2', 'slot3']) {
      const card = element('section', undefined, 'save-slot');
      card.append(element('strong', slot === 'auto' ? 'Autosave' : 'Story slot ' + slot.slice(-1)));
      const raw = read(slot);
      let saved = null;
      if (raw) {
        try { saved = E.deserialize(raw, B); }
        catch { card.append(element('p', 'Unreadable save. Loading will try the last valid backup.')); }
      }
      if (saved) card.append(element('p', saved.profile.name + ' · ' + B.scenes[saved.scene].title));
      else if (!raw) card.append(element('p', 'Empty'));
      if (slot !== 'auto') {
        const save = element('button', 'Save here'); save.disabled = !state;
        save.onclick = () => {
          if (raw && !confirm('Replace this manual save? A last-known-good backup will be kept when possible.')) return;
          if (write(slot, E.serialize(state))) { notify('Story saved in ' + slot + '.'); renderSaves(); }
        };
        card.append(save);
      }
      const load = element('button', 'Load'); load.disabled = !raw;
      load.onclick = () => {
        if (state && !confirm('Load this story? Save your current route in another slot first to keep both.')) return;
        loadSlot(slot);
      };
      card.append(load); host.append(card);
    }
    $('export-save').disabled = !state;
  }
  function downloadSave() {
    if (!state) return;
    const blob = new Blob([E.serialize(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = element('a'); link.href = url; link.download = 'after-the-bell-save.json';
    link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  function applySettings(settings) {
    const size = ['1', '1.15', '1.3'].includes(settings?.size) ? settings.size : '1';
    $('text-size').value = size;
    $('reduce-motion').checked = settings?.motion === true;
    document.documentElement.style.setProperty('--reading', size);
    document.body.classList.toggle('reduced-motion', settings?.motion === true);
  }
  form.addEventListener('input', preview);
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (read('auto') && !confirm('Begin a new story and replace autosave? Manual slots and previous-edition saves will stay intact.')) return;
    state = E.create(profileInput(), B); persist(); render(true);
  });
  $('new-game').onclick = newStory;
  $('brand').onclick = event => { event.preventDefault(); newStory(); };
  $('resume').onclick = () => loadSlot('auto');
  $('save-menu').onclick = () => { renderSaves(); openDialog('save-dialog'); };
  $('settings-button').onclick = () => openDialog('settings-dialog');
  $('pause').onclick = () => openDialog('pause-dialog');
  $('about-button').onclick = () => openDialog('about-dialog');
  $('export-save').onclick = downloadSave;
  $('rewind').onclick = () => {
    if (!state?.history.length) return;
    const history = state.history.slice(0, -1);
    let rebuilt = E.create(state.profile, B);
    history.forEach(h => { rebuilt = E.choose(rebuilt, h.choice, B); });
    state = rebuilt; persist(); render(true);
  };
  $('import-save').addEventListener('change', async event => {
    const file = event.target.files[0];
    if (!file) return;
    try {
      if (file.size > 500000) throw new Error('Save file exceeds the 500 KB limit.');
      const candidate = E.deserialize(await file.text(), B);
      if (state && !confirm('Import this route and replace autosave? Manual slots are unchanged.')) return;
      state = candidate; persist(); closeDialogs(); render(true);
      notify('Imported ' + state.profile.name + '’s story.');
    } catch (error) { notify(error.message); }
    finally { event.target.value = ''; }
  });
  $('legacy-profile').onclick = () => {
    try {
      const old = JSON.parse(localStorage.getItem('after-the-bell-world-v2') || localStorage.getItem('after-the-bell-save-v1'));
      if (!old || ![1, 2].includes(old.version)) throw new Error('No previous character was found in this browser.');
      const compatible = { ...old, conflict: old.incident, seed: old.seed ?? 1701 };
      const profile = E.normalizeProfile(compatible);
      for (const [key, value] of Object.entries(profile)) if (form.elements[key]) form.elements[key].value = value;
      preview(); notify('Imported character settings only. The earlier story and save have not been changed.');
    } catch (error) { notify(error.message); }
  };
  for (const tab of ['people', 'journal', 'route']) {
    $('tab-' + tab).onclick = () => { notebook = tab; renderNotebook(); };
    $('tab-' + tab).onkeydown = event => {
      if (!['ArrowLeft', 'ArrowRight'].includes(event.key)) return;
      const tabs = ['people', 'journal', 'route'];
      notebook = tabs[(tabs.indexOf(tab) + (event.key === 'ArrowRight' ? 1 : 2)) % 3];
      renderNotebook(); $('tab-' + notebook).focus(); event.preventDefault();
    };
  }
  document.querySelectorAll('[data-close]').forEach(button => {
    button.onclick = () => button.closest('dialog').close();
  });
  for (const id of ['text-size', 'reduce-motion']) $(id).onchange = () => {
    const settings = { size: $('text-size').value, motion: $('reduce-motion').checked };
    applySettings(settings); write('settings', JSON.stringify(settings));
  };
  document.addEventListener('keydown', event => {
    if (!state || state.finished || event.repeat || event.ctrlKey || event.altKey || event.metaKey ||
        document.querySelector('dialog[open]') || event.target.closest('input,select,textarea,button,[contenteditable]')) return;
    if (/^[1-9]$/.test(event.key)) {
      const option = E.available(state, B)[Number(event.key) - 1];
      if (option) { event.preventDefault(); selectChoice(option.id); }
    }
  });
  try { applySettings(JSON.parse(read('settings') || '{}')); } catch { applySettings({}); }
  $('content-count').textContent = Object.keys(B.scenes).length + ' authored scenes, five chapters, six closing scenes, and individual relationship epilogues. Each playthrough visits only part of that content.';
  $('resume').classList.toggle('hidden', !read('auto'));
  render();
})();
