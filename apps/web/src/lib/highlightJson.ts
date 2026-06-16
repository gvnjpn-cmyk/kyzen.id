/**
 * Tiny JSON syntax highlighter — wraps tokens in <span> with Tailwind
 * classes so JSON examples on the docs/playground pages get color without
 * pulling in a full highlighting library.
 */
export function highlightJson(value: unknown): string {
  const json = JSON.stringify(value, null, 2);
  return escapeHtml(json).replace(
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(\.\d+)?([eE][+-]?\d+)?)/g,
    (match) => {
      let cls = "text-text"; // numbers
      if (/^"/.test(match)) {
        cls = /:$/.test(match) ? "text-primary" : "text-success"; // keys vs string values
      } else if (/true|false/.test(match)) {
        cls = "text-primary";
      } else if (/null/.test(match)) {
        cls = "text-muted";
      }
      return `<span class="${cls}">${match}</span>`;
    }
  );
}

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
