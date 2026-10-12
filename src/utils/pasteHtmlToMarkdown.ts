/**
 * Converts clipboard HTML data into clean Medium-style Markdown
 * preserving headers, bold, italics, code blocks, lists, links, images, and blockquotes.
 */
export function htmlToMarkdown(html: string): string {
  if (typeof window === 'undefined' || !html) return '';

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  function traverse(node: Node): string {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();
    const children = Array.from(el.childNodes).map(traverse).join('');

    switch (tag) {
      case 'h1':
      case 'h2':
        return `\n\n## ${children.trim()}\n\n`;
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        return `\n\n### ${children.trim()}\n\n`;
      case 'strong':
      case 'b':
        return `**${children.trim()}**`;
      case 'em':
      case 'i':
        return `*${children.trim()}*`;
      case 'code':
        // If parent is pre, handle in pre
        if (el.parentElement?.tagName.toLowerCase() === 'pre') {
          return children;
        }
        return `\`${children.trim()}\``;
      case 'pre': {
        const lang = el.getAttribute('data-language') || el.className.replace(/language-/, '') || '';
        return `\n\n\`\`\`${lang}\n${children.trim()}\n\`\`\`\n\n`;
      }
      case 'blockquote':
        return `\n\n> ${children.trim()}\n\n`;
      case 'ul':
        return `\n\n${children.trim()}\n\n`;
      case 'ol':
        return `\n\n${children.trim()}\n\n`;
      case 'li':
        return `- ${children.trim()}\n`;
      case 'a': {
        const href = el.getAttribute('href') || '#';
        return `[${children.trim() || href}](${href})`;
      }
      case 'img': {
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || 'Image';
        return `\n\n![${alt}](${src})\n\n`;
      }
      case 'p':
        return `\n\n${children.trim()}\n\n`;
      case 'br':
        return '\n';
      case 'hr':
        return '\n\n---\n\n';
      default:
        return children;
    }
  }

  const raw = traverse(doc.body);
  // Normalize consecutive newlines
  return raw.replace(/\n{3,}/g, '\n\n').trim();
}
