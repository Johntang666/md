import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'
import { JSDOM } from 'jsdom'
import ts from 'typescript'

const source = readFileSync(new URL('../src/utils/referenceLinks.ts', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2020, module: ts.ModuleKind.ESNext },
})
const { renderReferenceLinks } = await import(`data:text/javascript;base64,${Buffer.from(outputText).toString('base64')}`)
const font = `'Times New Roman', SimSun, serif`

test('shows numbered sources with full upright URLs on a separate line', () => {
  const url = 'https://www.economist.com/science-and-technology/2026/09/09/a-long-article-address?source=reading&lang=en'
  const result = JSDOM.fragment(renderReferenceLinks([[1, '经济学人', url], [2, '另一个来源', 'https://example.com']], font))
  const rows = result.querySelectorAll('section section')
  assert.equal(rows.length, 2)
  assert.match(rows[0].children[0].textContent, /\[1\].*经济学人/)
  assert.equal(rows[0].children[1].textContent, url)
  assert.equal(rows[0].children[1].style.fontStyle, 'normal')
  assert.equal(result.querySelectorAll('i, code, br').length, 0)
  assert.match(rows[1].textContent, /\[2\].*另一个来源/)
})

test('escapes source text and URLs because references are appended after sanitizing', () => {
  const title = '<img src=x onerror=alert(1)>'
  const url = 'https://example.com/?q=<script>alert(1)</script>&n="1"'
  const result = JSDOM.fragment(renderReferenceLinks([[1, title, url]], font))
  assert.equal(result.querySelectorAll('img, script').length, 0)
  assert.ok(result.textContent.includes(title))
  assert.ok(result.textContent.includes(url))
})

test('uses a hostname for unnamed references and omits an empty section', () => {
  assert.equal(renderReferenceLinks([], font), '')
  const url = 'https://example.com/article'
  const result = JSDOM.fragment(renderReferenceLinks([[1, url, url], [2, '', 'invalid-url']], font))
  assert.match(result.querySelector('p').textContent, /example.com/)
  assert.match(result.textContent, /链接来源/)
  assert.ok(result.textContent.includes('invalid-url'))
})
