import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import { marked } from 'marked'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/vocabulary.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
})
const { formatVocabularyHtml } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const doc = new JSDOM('').window.document
const render = md => JSDOM.fragment(formatVocabularyHtml(marked.parse(md), doc))

test('numbers vocabulary rows and splits words, pronunciations and definitions', () => {
  const result = render('## 重点词汇对照（2 个）\n\n- **take stock of** /teɪk stɒk əv/ — **评估现状；盘点**\n- **stepping-stone** /ˈstepɪŋ stəʊn/ — 通往更高阶段的跳板')
  const rows = result.querySelectorAll('tr')
  assert.equal(rows.length, 2)
  assert.equal(rows[0].cells.length, 2)
  assert.equal(rows[0].cells[0].querySelector('span').textContent, '1.')
  assert.equal(rows[1].cells[0].querySelector('span').textContent, '2.')
  assert.equal(rows[0].cells[0].querySelector('strong').textContent, 'take stock of')
  assert.equal(rows[0].cells[0].lastElementChild.textContent, '/teɪk stɒk əv/')
  assert.equal(rows[0].cells[1].textContent, '评估现状；盘点')
  assert.match(rows[1].cells[0].textContent, /stepping-stone/)
  assert.equal(result.querySelector('colgroup'), null)
  assert.equal(rows[0].cells[0].getAttribute('width'), '52%')
  assert.equal(rows[0].cells[1].getAttribute('width'), '48%')
})

test('handles renderer-inserted bullets or numbers without duplicating them', () => {
  const html = '<h2 id="7">重点词汇对照</h2><ul><li>• <strong>capture</strong> /ˈkæptʃə/ — 捕获</li><li>2. <strong>elude</strong> → 逃避</li></ul>'
  const result = JSDOM.fragment(formatVocabularyHtml(html, doc))
  assert.equal(result.querySelector('h2').id, '7')
  assert.doesNotMatch(result.querySelector('table').textContent, /•/)
  assert.equal(result.querySelectorAll('tr')[1].cells[0].textContent, '2.elude')
})

test('preserves links, incomplete entries and content after the summary', () => {
  const result = render('## 重点词汇对照\n\n- [evidence](https://example.com) — 证据\n- **unfinished**\n\n## 后记\n\n- 普通列表')
  assert.equal(result.querySelector('a').href, 'https://example.com/')
  assert.equal(result.querySelectorAll('tr')[1].cells[0].colSpan, 2)
  assert.equal(result.querySelectorAll('tr')[1].cells[0].textContent, '2.unfinished')
  assert.equal(result.querySelector('ul').textContent.trim(), '普通列表')
})

test('leaves ordinary and nested lists unchanged, and is idempotent', () => {
  for (const md of ['## 其他内容\n\n- word — 词', '## 重点词汇对照\n\n- word — 词\n  - 嵌套说明']) {
    const html = marked.parse(md)
    assert.equal(formatVocabularyHtml(html, doc), html)
  }
  const html = formatVocabularyHtml(marked.parse('## 重点词汇对照\n\n- word — 词'), doc)
  assert.equal(formatVocabularyHtml(html, doc), html)
})
