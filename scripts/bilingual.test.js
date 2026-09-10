import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/bilingual.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
})
const { formatBilingualHtml } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const doc = new JSDOM('').window.document
const render = markdown => formatBilingualHtml(marked.parse(markdown), doc)
const fragment = html => JSDOM.fragment(html)

test('groups original, translation and vocabulary without losing inline content', () => {
  const result = fragment(render('## 段落 1\n\n[EN] **Ideas** in 2026, [source](https://example.com).\n\n[CN] 2026 年的**观点**。\n\n**词汇提示：** **ideas** → 观点'))
  const pair = result.querySelector('[data-bilingual]')
  assert.equal(pair.children.length, 3)
  assert.match(pair.textContent, /EN · 原文Ideas in 2026/)
  assert.match(pair.textContent, /CN · 译文2026 年的观点/)
  assert.equal(pair.querySelector('a').getAttribute('href'), 'https://example.com')
  assert.deepEqual([...pair.querySelectorAll('strong')].map(node => node.textContent).filter(Boolean), ['Ideas', '观点', 'ideas'])
  assert.equal(pair.querySelector('[lang=en]').style.letterSpacing, 'normal')
  assert.equal(pair.children[2].style.fontSize, '14px')
  assert.equal(result.querySelector('h2').style.textAlign, 'left')
})

test('only pairs adjacent top-level paragraphs', () => {
  for (const html of [
    '<p>[EN] Alone</p>',
    '<p>[CN] 译文在前</p><p>[EN] Original</p>',
    '<p>[EN] Original</p><hr><p>[CN] 译文</p>',
    '<blockquote><p>[EN] Example</p><p>[CN] 示例</p></blockquote>',
    '<pre><code>[EN] code\n[CN] 代码</code></pre>',
    '<p>Ordinary prose</p>',
  ]) {
    assert.equal(formatBilingualHtml(html, doc), html)
  }
})

test('supports several groups and keeps their order', () => {
  const result = fragment(render('[EN] First\n\n[CN] 第一\n\n[EN] Second\n\n[CN] 第二'))
  assert.equal(result.querySelectorAll('[data-bilingual]').length, 2)
  assert.deepEqual([...result.querySelectorAll('[lang=en]')].map(p => p.textContent), ['EN · 原文First', 'EN · 原文Second'])
})

test('preserves heading anchors and author-supplied symbols', () => {
  const result = fragment(formatBilingualHtml('<h2 id="3" data-heading="true">段落 2</h2><p>[EN] ✨ Hello</p><p>[CN] 你好 🤖</p>', doc))
  assert.equal(result.querySelector('h2').id, '3')
  assert.equal(result.querySelector('h2').dataset.heading, 'true')
  assert.match(result.textContent, /✨ Hello/)
  assert.match(result.textContent, /你好 🤖/)
})

test('handles formatted markers and does not restyle unrelated notes', () => {
  const result = fragment(render('**[EN]** Hello\n\n**[CN]** 你好\n\n普通备注'))
  assert.equal(result.querySelector('[data-bilingual]').children.length, 2)
  assert.equal(result.lastElementChild.textContent, '普通备注')
  assert.doesNotMatch(result.textContent, /\[EN\]|\[CN\]/)
})

test('formatting is idempotent and new styles are inline for export', () => {
  const html = render('[EN] Hello\n\n[CN] 你好\n\n词汇提示：hello → 你好')
  assert.equal(formatBilingualHtml(html, doc), html)
  const result = fragment(html)
  assert.equal(result.querySelectorAll('style').length, 0)
  assert.equal(result.querySelector('[data-bilingual]').style.height, 'auto')
  assert.ok([...result.querySelectorAll('[data-bilingual] p')].every(p => p.hasAttribute('style')))
})
