"""Chromium DOM smoke test. Uses an in-memory Storage shim when URL navigation is unavailable.
This validates actual game scripts and interactions, NOT native browser disk persistence.
Run: python tests/browser_smoke.py (requires Playwright and Chromium).
Set CHROMIUM_PATH when the browser executable is not /usr/bin/chromium.
"""
from pathlib import Path
import json
import os
import re
from playwright.sync_api import sync_playwright, expect

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = Path(os.environ.get('TEST_OUTPUT', str(ROOT / 'test-output')))
OUTPUT.mkdir(exist_ok=True)


def mount(page, data=None, denied=False):
    html = (ROOT / 'index.html').read_text()
    html = html.replace('<link rel="stylesheet" href="src/styles.css">', '<style>' + (ROOT / 'src/styles.css').read_text() + '</style>')
    html = re.sub(r'<script defer src="[^"]+"></script>', '', html)
    page.set_content(html)
    page.evaluate('''({data, denied}) => {
      const values = {...data};
      const store = {
        getItem(k) { if (denied) throw new DOMException('Storage unavailable', 'SecurityError'); return values[k] ?? null; },
        setItem(k,v) { if (denied) throw new DOMException('Storage unavailable', 'SecurityError'); values[k] = String(v); },
        removeItem(k) { delete values[k]; }, clear() { for (const k of Object.keys(values)) delete values[k]; }
      };
      Object.defineProperty(window, 'localStorage', {configurable:true, value:store});
      window.__testStorage = values;
    }''', {'data': data or {}, 'denied': denied})
    for script in ['src/engine.js', 'stories/semester.js', 'src/app.js']:
        page.add_script_tag(content=(ROOT / script).read_text())


def current(page):
    return page.evaluate('JSON.parse(localStorage.getItem("after-the-bell-v3:auto")).state')


def begin(page, profile=None):
    for key, value in (profile or {}).items():
        field = page.locator(f'[name="{key}"]')
        if field.evaluate('(el) => el.tagName') == 'SELECT':
            field.select_option(value)
        else:
            field.fill(str(value))
    page.get_by_text('Story seed & previous character', exact=True).click()
    page.locator('input[name="seed"]').fill('13')
    page.get_by_role('button', name='Step into your story').click()


def click(page, choice):
    page.locator(f'[data-choice="{choice}"]').click()


def run():
    results = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(headless=True, executable_path=os.environ.get('CHROMIUM_PATH', '/usr/bin/chromium'), args=['--no-sandbox'])
        context = browser.new_context(viewport={'width': 1440, 'height': 1050}, reduced_motion='reduce', accept_downloads=True)
        page = context.new_page()
        errors = []
        page.on('pageerror', lambda error: errors.append(str(error)))
        page.on('dialog', lambda dialog: dialog.accept())
        mount(page)
        page.screenshot(path=str(OUTPUT / 'creator.png'), full_page=True)
        begin(page, {'name': 'Alex', 'role': 'target', 'setting': 'city', 'conflict': 'rumors'})
        path = ['help', 'morgan', 'listen', 'write', 'check', 'record', 'pause', 'company', 'club', 'consent', 'promise', 'keep', 'continue']
        for choice in path:
            click(page, choice)
        assert current(page)['flags']['reliable']
        page.screenshot(path=str(OUTPUT / 'story.png'), full_page=True)
        results.append('desktop: creator and delayed-consequence route')
        before = current(page)
        page.locator('#rewind').click()
        assert current(page)['step'] == before['step'] - 1
        click(page, 'continue')
        assert current(page) == before
        results.append('rewind: reconstructs identical state')
        page.locator('#save-menu').click()
        page.get_by_role('button', name='Save here').first.click()
        saved = current(page)
        page.locator('#save-dialog [data-close]').click()
        click(page, 'check')
        page.locator('#save-menu').click()
        page.locator('.save-slot').nth(1).get_by_role('button', name='Load', exact=True).click()
        assert current(page) == saved
        results.append('manual slot: saves and restores full state using Storage shim')
        page.locator('#tab-journal').click()
        assert 'promised' in page.locator('#notebook').inner_text()
        page.locator('#tab-route').click()
        assert page.locator('.path-stop').count() == saved['step']
        results.append('notebook: journal and route match current playthrough')
        storage = page.evaluate('window.__testStorage')
        recovered_page = context.new_page()
        recovered_page.on('dialog', lambda d: d.accept())
        mount(recovered_page, storage)
        recovered_page.locator('#resume').click()
        assert current(recovered_page) == saved
        results.append('fresh document: resumes exported Storage state (native persistence not tested)')
        while not current(page)['finished']:
            page.locator('[data-choice]').first.click()
        end = current(page)
        page.keyboard.press('1')
        assert current(page) == end
        assert page.locator('#epilogues h3').count() == 5
        results.append('ending: epilogues present; stray keys are harmless')
        page.locator('#save-menu').click()
        with page.expect_download() as download:
            page.locator('#export-save').click()
        export_path = OUTPUT / 'exported-save.json'
        download.value.save_as(str(export_path))
        assert json.loads(export_path.read_text())['state'] == end
        malformed = OUTPUT / 'bad.json'
        malformed.write_text('{"not":"a story"}')
        page.locator('#import-save').set_input_files(str(malformed))
        assert current(page) == end
        expect(page.locator('#status')).to_contain_text('another version')
        page.locator('#import-save').set_input_files(str(export_path))
        expect(page.locator('#status')).to_contain_text('Imported')
        assert current(page) == end
        results.append('import/export: valid round-trip; invalid save leaves current state intact')
        # A separate completed route for each other perspective.
        for role, conflict in [('bystander', 'online'), ('former', 'intimidation')]:
            other = context.new_page()
            other.on('pageerror', lambda error: errors.append(str(error)))
            mount(other)
            begin(other, {'role': role, 'conflict': conflict, 'support': 'sibling'})
            while not current(other)['finished']:
                other.locator('[data-choice]').first.click()
            assert other.locator('#epilogues').is_visible()
            results.append(role + ': complete browser playthrough')
            other.close()
        # Names must remain plain text, never markup.
        safe = context.new_page(); mount(safe)
        begin(safe, {'name': '<img src=x onerror=1>', 'school': '<script>BAD</script>'})
        assert safe.locator('#identity-name img').count() == 0
        assert safe.locator('#identity-name').inner_text() == '<img src=x onerror=1>'
        results.append('user input: character/school text is not interpreted as HTML')
        denied = context.new_page(); mount(denied, denied=True)
        begin(denied)
        assert 'saving failed' in denied.locator('#status').inner_text()
        assert denied.locator('[data-choice]').count() > 0
        results.append('unavailable storage: error visible and game remains playable')
        mobile = context.new_page()
        mobile.set_viewport_size({'width': 390, 'height': 844})
        mount(mobile)
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
        begin(mobile, {'setting': 'academy', 'role': 'bystander'})
        mobile.locator('#settings-button').click()
        mobile.locator('#text-size').select_option('1.3')
        mobile.locator('#settings-dialog [data-close]').click()
        assert mobile.evaluate('document.documentElement.scrollWidth <= innerWidth')
        mobile.screenshot(path=str(OUTPUT / 'mobile.png'), full_page=True)
        results.append('mobile: 390 px layout and largest reading size have no horizontal overflow')
        assert not errors, errors
        results.append('no uncaught JavaScript errors in observed sessions')
        browser.close()
    (OUTPUT / 'browser-results.json').write_text(json.dumps({'mode': 'injected DOM + Storage shim', 'checks': results, 'errors': errors}, indent=2))
    print(json.dumps(results, indent=2))


if __name__ == '__main__':
    run()
