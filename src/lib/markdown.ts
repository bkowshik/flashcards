// Markdown rendering. Two layers of defence per plan §12.4:
//
// 1. `marked` parses with GFM features (tables, strikethrough, task lists) on,
//    line-break-on-newline off, AND a renderer that drops block-level raw HTML.
// 2. `DOMPurify` sanitises the resulting HTML string before we hand it back —
//    strips <script>, on* attributes, javascript: URLs, and anything else that
//    could execute.
//
// `marked` is configured at module load (one-time side-effect). All callers
// import `renderMarkdown` and get the same configured pipeline.

import { marked } from 'marked';
import DOMPurify from 'dompurify';

marked.use({
  gfm: true,
  breaks: false,
  renderer: {
    // Drop any block-level raw HTML in the source. Inline HTML like `<b>foo</b>`
    // can still slip past marked but is caught by DOMPurify below.
    html() {
      return '';
    },
  },
});

export function renderMarkdown(source: string): string {
  // marked.parse can return Promise<string> if async extensions are loaded;
  // we don't load any, so the cast is safe.
  const rawHtml = marked.parse(source) as string;
  return DOMPurify.sanitize(rawHtml);
}
