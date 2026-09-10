/** Reformat the vocabulary summary, preserving the original inline markup. */
export function formatVocabularyHtml(html: string, doc: Document = document): string {
  if (!html.includes(`重点词汇对照`))
    return html
  const root = doc.createElement(`div`)
  root.innerHTML = html
  let changed = false

  // Slice by text offsets so bold text, links and phonetic symbols survive layout changes.
  function sliceContent(element: Element, start: number, end: number): DocumentFragment {
    const walker = doc.createTreeWalker(element, 4 /* SHOW_TEXT */)
    const range = doc.createRange()
    let offset = 0
    let hasStart = false
    while (true) {
      const node = walker.nextNode()
      if (!node)
        break
      const next = offset + (node.textContent?.length ?? 0)
      if (!hasStart && start <= next) {
        range.setStart(node, Math.max(0, start - offset))
        hasStart = true
      }
      if (hasStart && end <= next) {
        range.setEnd(node, Math.max(0, end - offset))
        let fragment = range.cloneContents()
        // cloneContents omits the common ancestor (e.g. a whole word inside <strong>).
        let ancestor = range.commonAncestorContainer.nodeType === 3
          ? range.commonAncestorContainer.parentElement
          : range.commonAncestorContainer as Element
        while (ancestor && ancestor !== element) {
          const wrapper = ancestor.cloneNode(false)
          wrapper.appendChild(fragment)
          fragment = doc.createDocumentFragment()
          fragment.append(wrapper)
          ancestor = ancestor.parentElement
        }
        return fragment
      }
      offset = next
    }
    return doc.createDocumentFragment()
  }

  for (const heading of Array.from(root.querySelectorAll<HTMLElement>(`h1, h2, h3, h4, h5, h6`))) {
    if (heading.parentElement !== root || !/^重点词汇对照(?:\s*[（(]\s*\d+\s*(?:个\s*)?[）)])?$/.test(heading.textContent?.trim() ?? ``))
      continue
    const list = heading.nextElementSibling as HTMLElement | null
    if (!list || ![`UL`, `OL`].includes(list.tagName) || list.querySelector(`li ul, li ol`))
      continue
    const items = Array.from(list.children).filter(item => item.tagName === `LI`)
    if (!items.length)
      continue

    Object.assign(heading.style, {
      display: `block`,
      margin: `1.25em 0 6px`,
      padding: `5px 8px`,
      textAlign: `left`,
      fontSize: `1em`,
      lineHeight: `1.5`,
      letterSpacing: `normal`,
      boxShadow: `none`,
      textShadow: `none`,
    })

    const table = doc.createElement(`table`)
    table.setAttribute(`data-vocabulary`, `true`)
    table.setAttribute(`aria-label`, heading.textContent ?? `重点词汇对照`)
    table.setAttribute(`style`, `width: 100%; table-layout: fixed; border-collapse: collapse; border-spacing: 0; margin: 0; font-size: 14px; line-height: 1.45; letter-spacing: normal; text-align: left;`)
    table.style.fontFamily = list.style.fontFamily || `inherit`
    table.style.color = list.style.color || `inherit`
    const body = doc.createElement(`tbody`)
    table.append(body)

    items.forEach((item, index) => {
      const text = item.textContent ?? ``
      const prefix = text.match(/^\s*(?:•\s*|\d+[.)]\s*)?/)?.[0].length ?? 0
      const content = text.slice(prefix)
      const separator = /\s*[—–→]\s*|\s+-\s+/.exec(content)
      const row = doc.createElement(`tr`)
      body.append(row)

      function cell() {
        const td = doc.createElement(`td`)
        td.setAttribute(`style`, `padding: 6px 0; vertical-align: top; border: 0; border-bottom: 1px solid rgba(120, 150, 130, 0.18); text-align: left; text-indent: 0; line-height: 1.45; overflow-wrap: anywhere; word-break: normal;`)
        row.append(td)
        return td
      }
      const number = doc.createElement(`span`)
      number.textContent = `${index + 1}.`
      number.setAttribute(`style`, `display: inline-block; width: 24px; text-indent: 0; color: #748078; font-weight: normal;`)

      const english = cell()
      english.style.paddingLeft = `24px`
      english.style.textIndent = `-24px`
      if (!separator) {
        english.colSpan = 2
        english.append(sliceContent(item, prefix, text.length))
      }
      else {
        // Keep widths on cells: rich-text editors may discard colgroup on paste.
        english.setAttribute(`width`, `52%`)
        english.style.width = `52%`
        english.style.paddingRight = `10px`
        const left = content.slice(0, separator.index)
        const phonetic = /\s+(\/[^/]+\/)\s*$/.exec(left)
        const wordEnd = prefix + (phonetic?.index ?? left.length)
        english.append(sliceContent(item, prefix, wordEnd))
        english.style.fontWeight = `bold`
        if (phonetic) {
          const pronunciation = doc.createElement(`span`)
          pronunciation.textContent = phonetic[1]
          pronunciation.setAttribute(`style`, `display: block; margin: 2px 0 0; text-indent: 0; font-size: 12px; font-weight: normal; font-style: normal; line-height: 1.35; color: #758079;`)
          english.append(pronunciation)
        }
        const chinese = cell()
        chinese.setAttribute(`width`, `48%`)
        chinese.style.width = `48%`
        chinese.append(sliceContent(item, prefix + separator.index + separator[0].length, text.length))
      }
      if (english.firstElementChild?.tagName === `P`)
        english.firstElementChild.prepend(number)
      else
        english.prepend(number)
      // The renderer applies base font sizes and line heights to inline elements.
      for (const child of Array.from(row.querySelectorAll<HTMLElement>(`strong, em, a, code`))) {
        child.style.fontSize = `inherit`
        child.style.lineHeight = `inherit`
      }
      for (const paragraph of Array.from(row.querySelectorAll<HTMLElement>(`p`))) {
        Object.assign(paragraph.style, { margin: `0`, padding: `0`, fontSize: `inherit`, lineHeight: `inherit`, textIndent: `inherit` })
      }
    })
    list.replaceWith(table)
    changed = true
  }
  return changed ? root.innerHTML : html
}
