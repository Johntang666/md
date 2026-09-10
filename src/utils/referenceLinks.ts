function escapeHtml(text: string): string {
  return text.replace(/&/g, `&amp;`).replace(/</g, `&lt;`).replace(/>/g, `&gt;`).replace(/"/g, `&quot;`).replace(/'/g, `&#39;`)
}

/** Keep complete URLs readable and copyable even where external navigation is unavailable. */
export function renderReferenceLinks(footnotes: [number, string, string][], fonts: string): string {
  if (!footnotes.length)
    return ``

  const items = footnotes.map(([index, title, link]) => {
    let source = title
    if (!source || source === link) {
      try {
        source = new URL(link).hostname || `链接来源`
      }
      catch {
        source = `链接来源`
      }
    }

    return `<section style="height: auto; margin: 10px 0 0; padding: 10px 12px; border-left: 2px solid #bdd5c2; border-radius: 0 6px 6px 0; background: rgba(134, 190, 142, 0.06);">
      <p style="margin: 0; padding: 0; font-size: 14px; line-height: 1.6; text-indent: 0; font-weight: bold; overflow-wrap: anywhere;">
        <span style="display: inline-block; margin-right: 6px; padding: 0 5px; border-radius: 3px; background: #e7f1e9; color: #50735a; font-size: 12px; font-weight: normal; vertical-align: baseline;">[${index}]</span>${escapeHtml(source)}
      </p>
      <p style="margin: 5px 0 0; padding: 0; color: #68766d; font-size: 12px; font-style: normal; font-weight: normal; line-height: 1.65; text-indent: 0; overflow-wrap: anywhere; word-wrap: break-word; word-break: break-word;">${escapeHtml(link)}</p>
    </section>`
  }).join(`\n`)

  return `<section data-reference-links="true" style="height: auto; margin: 24px 0 0; padding: 14px 0 0; border-top: 1px solid #dce5df; font-family: ${escapeHtml(fonts)}; font-style: normal; letter-spacing: normal; text-align: left;">
    <h4 style="margin: 0 0 10px; padding: 0; border: 0; background: none; font-family: inherit; font-size: 15px; font-weight: bold; line-height: 1.5; color: inherit;">引用来源</h4>
    ${items}
  </section>`
}
