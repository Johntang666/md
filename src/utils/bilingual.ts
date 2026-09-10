/** Apply a portable, inline layout to adjacent EN/CN paragraphs in sanitized HTML. */
export function formatBilingualHtml(html: string, doc: Document = document): string {
  const root = doc.createElement(`div`)
  root.innerHTML = html
  let changed = false

  function removePrefix(element: HTMLElement, length: number) {
    const walker = doc.createTreeWalker(element, 4 /* SHOW_TEXT */)
    while (length > 0) {
      const node = walker.nextNode()
      if (!node)
        break
      const text = node.textContent ?? ``
      const count = Math.min(length, text.length)
      node.textContent = text.slice(count)
      length -= count
    }
  }

  function paragraph(element: HTMLElement, prefix: string, label: string, translation: boolean) {
    removePrefix(element, prefix.length)
    element.setAttribute(`lang`, translation ? `zh-CN` : `en`)
    Object.assign(element.style, {
      margin: translation ? `12px 0 0` : `0`,
      padding: `0`,
      textIndent: `0`,
      letterSpacing: `normal`,
      wordSpacing: `normal`,
      textAlign: `left`,
      lineHeight: translation ? `1.8` : `1.7`,
    })
    if (!translation) {
      Object.assign(element.style, {
        padding: `12px 14px`,
        border: `1px solid rgba(105, 155, 112, 0.28)`,
        borderRadius: `8px`,
        backgroundColor: `rgba(134, 190, 142, 0.12)`,
      })
    }
    const badge = doc.createElement(`span`)
    badge.textContent = label
    badge.setAttribute(`style`, `display: block; margin: 0 0 4px; font-family: inherit; font-size: 11px; font-weight: normal; font-style: normal; letter-spacing: normal; line-height: 1.5; color: #74828f;`)
    element.prepend(badge)
  }

  // Only pair top-level paragraphs. Examples inside quotes, lists and code stay intact.
  for (const element of Array.from(root.children)) {
    if (element.parentElement !== root || element.tagName !== `P`)
      continue
    const en = element as HTMLElement
    const enPrefix = en.textContent?.match(/^\s*\[EN\]\s*/i)?.[0]
    const cn = en.nextElementSibling as HTMLElement | null
    const cnPrefix = cn?.tagName === `P` ? cn.textContent?.match(/^\s*\[CN\]\s*/i)?.[0] : undefined
    if (!enPrefix || !cn || !cnPrefix)
      continue

    const heading = en.previousElementSibling as HTMLElement | null
    const headingText = heading?.textContent?.match(/^(段落\s*\d+)\s*$/u)?.[1]
    if (heading?.tagName === `H2` && headingText) {
      // Preserve the heading's anchor and inline markup for the table of contents.
      Object.assign(heading.style, {
        display: `block`,
        margin: `1.5em 0 0.65em`,
        padding: `0 0 0.4em`,
        background: `none`,
        border: `0`,
        borderBottom: `1px solid #dce3e8`,
        borderRadius: `0`,
        boxShadow: `none`,
        textShadow: `none`,
        textAlign: `left`,
        fontSize: `1em`,
        lineHeight: `1.5`,
        color: `inherit`,
      })
    }

    const note = cn.nextElementSibling as HTMLElement | null
    const notePrefix = note?.tagName === `P` ? note.textContent?.match(/^\s*词汇提示\s*[：:]\s*/)?.[0] : undefined
    const group = doc.createElement(`section`)
    group.setAttribute(`data-bilingual`, `pair`)
    group.setAttribute(`style`, `display: block; height: auto; margin: 0 0 24px; padding: 0;`)
    en.before(group)
    paragraph(en, enPrefix, `EN · 原文`, false)
    paragraph(cn, cnPrefix, `CN · 译文`, true)
    group.append(en, cn)

    if (note && notePrefix) {
      removePrefix(note, notePrefix.length)
      Object.assign(note.style, {
        margin: `14px 0 0`,
        padding: `10px 12px`,
        borderLeft: `2px solid #cbd5df`,
        borderRadius: `0 6px 6px 0`,
        background: `#f5f7f9`,
        color: `#4b5967`,
        fontSize: `14px`,
        lineHeight: `1.7`,
        letterSpacing: `normal`,
        textIndent: `0`,
        textAlign: `left`,
      })
      for (const child of Array.from(note.querySelectorAll<HTMLElement>(`strong, em, span`))) {
        child.style.fontSize = `inherit`
        child.style.color = `inherit`
      }
      const label = doc.createElement(`span`)
      label.textContent = `词汇提示`
      label.setAttribute(`style`, `display: block; margin-bottom: 4px; font-family: inherit; font-size: 11px; font-weight: normal; letter-spacing: normal; color: #657789;`)
      note.prepend(label)
      group.append(note)
    }
    changed = true
  }

  return changed ? root.innerHTML : html
}
