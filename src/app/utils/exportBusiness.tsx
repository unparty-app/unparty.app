// UTIL. TO EXPORT LEAN CANVAS DATA AS STANDALONE HTML
// Matches convert.sh styling patterns for consistency across tools

export interface BusinessExportData {
  answers: Record<string, string | string[]>;
  categories: {
    id: string;
    label: string;
    questions: Array<{
      id: string;
      text: string;
      type: string;
    }>;
  }[];
  completionPercentage: number;
}

export interface ExportOptions {
  title?: string;
  author?: string;
  includeMetadata?: boolean;
}

// Embedded CSS - matches convert.css core styles
const EMBEDDED_CSS = `
/* Convert.css aligned styles for Business Worksheet exports */
@import url('https://fonts.googleapis.com/css2?family=Geist+Mono:wght@100..900&family=Nunito:ital,wght@0,200..1000;1,200..1000&display=swap');

:root {
  --user-brand-primary: #F9C22E;
  --user-brand-secondary: #E7B12E;
  --user-brand-accent: #E4C014;
  --user-brand-highlight: #00FFFF;
  --user-brand-text: #0C0032;
  --page-bg-light: #FFFFFF;
  --page-fg-light: #000000;
  --page-bg-dark: #0a0a0a;
  --page-fg-dark: #ededed;
  --page-background: var(--page-bg-light);
  --page-foreground: var(--page-fg-light);
  --page-secondary: #666666;
  --page-border: #cccccc;
  --page-code-bg: #f5f5f5;
  --page-code-fg: #333333;
}

[data-theme="dark"] {
  --page-background: var(--page-bg-dark);
  --page-foreground: var(--page-fg-dark);
  --page-secondary: #999999;
  --page-border: #333333;
  --page-code-bg: #1a1a1a;
  --page-code-fg: #e0e0e0;
}

* { box-sizing: border-box; }

body {
  font-family: "Nunito", -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  font-size: 11pt;
  line-height: 1.6;
  color: var(--page-foreground);
  max-width: 900px;
  margin: 0 auto;
  padding: 40px 80px 40px 60px;
  background: var(--page-background);
  transition: background-color 0.3s ease, color 0.3s ease;
}

h1 {
  font-size: 20pt;
  font-weight: 700;
  margin: 0 0 16pt 0;
  color: var(--user-brand-primary);
  border-bottom: 2pt solid var(--page-border);
  padding-bottom: 8pt;
  text-transform: uppercase;
}

h2 {
  font-size: 16pt;
  font-weight: 600;
  margin: 20pt 0 12pt 0;
  color: var(--user-brand-text);
}

h3 {
  font-size: 14pt;
  font-weight: 600;
  margin: 16pt 0 8pt 0;
  color: var(--user-brand-secondary);
}

p {
  margin: 0 0 10pt 0;
  text-align: left;
}

ul, ol {
  margin: 8pt 0 12pt 20pt;
  padding: 0;
}

li {
  margin: 4pt 0;
}

.title {
  font-size: 24pt;
  font-weight: 700;
  margin: 0 0 12pt 0;
  color: var(--user-brand-primary);
  text-transform: uppercase;
  text-align: left;
  border-bottom: 3pt solid var(--user-brand-primary);
  padding-bottom: 12pt;
}

.author {
  font-size: 12pt;
  color: var(--user-brand-secondary);
  text-align: center;
  margin: 8pt 0;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 1pt;
}

.date {
  font-size: 11pt;
  color: var(--page-secondary);
  text-align: center;
  margin: 8pt 0 20pt 0;
  font-style: italic;
  text-transform: uppercase;
}

.completion, .generated {
  font-size: 10pt;
  color: var(--user-brand-accent);
  text-align: center;
  margin: 4pt 0;
  font-weight: 600;
  text-transform: uppercase;
}

.completion::before { content: "COMPLETION: "; color: var(--page-secondary); font-weight: 400; }
.generated::before { content: "GENERATED: "; color: var(--page-secondary); font-weight: 400; font-size: 8pt; }

.category-section {
  margin: 24pt 0;
  padding: 16pt;
  border: 1pt solid var(--page-border);
  border-radius: 6pt;
  background: var(--page-code-bg);
}

.category-header {
  display: flex;
  align-items: center;
  margin-bottom: 12pt;
  padding-bottom: 8pt;
  border-bottom: 1pt solid var(--page-border);
}

.category-icon {
  width: 32pt;
  height: 32pt;
  margin-right: 12pt;
  font-size: 20pt;
}

.category-title {
  font-size: 16pt;
  font-weight: 600;
  color: var(--user-brand-text);
  margin: 0;
}

.question-block {
  margin: 12pt 0;
  padding: 10pt;
  background: var(--page-background);
  border-radius: 4pt;
}

.question-text {
  font-weight: 600;
  color: var(--page-foreground);
  margin-bottom: 6pt;
}

.answer-text {
  color: var(--page-secondary);
  padding-left: 12pt;
  font-style: italic;
}

.answer-list {
  margin: 4pt 0 4pt 12pt;
  padding: 0;
}

.answer-list li {
  color: var(--page-secondary);
  margin: 2pt 0;
}

.no-answer {
  color: var(--page-border);
  font-style: italic;
  padding-left: 12pt;
}

.theme-toggle {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  background: var(--user-brand-primary);
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 50px;
  height: 50px;
  cursor: pointer;
  font-size: 24px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.theme-toggle:hover {
  transform: scale(1.1);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

.print-button {
  position: fixed;
  top: 80px;
  right: 20px;
  z-index: 1000;
  background: var(--user-brand-primary);
  color: #ffffff;
  border: none;
  border-radius: 25px;
  padding: 10px 20px;
  cursor: pointer;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.print-button:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
}

@media print {
  .theme-toggle, .print-button { display: none !important; }
  body { padding: 0; max-width: 100%; }
}

@media (max-width: 768px) {
  body { padding: 20px 15px; font-size: 10pt; }
  .theme-toggle, .print-button {
    position: relative;
    top: auto;
    right: auto;
    margin: 10px auto;
    display: block;
  }
}
`;

// Category icon emoji mapping
const getCategoryIcon = (categoryId: string): string => {
  const icons: Record<string, string> = {
    budget: '💰',
    brand: '🎨',
    product: '📦',
    risk: '🛡️',
    grow: '📈',
    core: '💡'
  };
  return icons[categoryId] || '📋';
};

export function generateBusinessWorksheetHTML(
  data: BusinessExportData,
  options: ExportOptions = {}
): string {
  const { answers, categories, completionPercentage } = data;
  const {
    title = 'Lean Canvas - Business Worksheet',
    author = 'Business Owner',
    includeMetadata = true
  } = options;

  const timestamp = new Date().toISOString().split('T')[0];
  const fullTimestamp = new Date().toISOString().replace('T', ' ').split('.')[0];

  // Calculate stats
  const totalQuestions = categories.reduce((acc, cat) => acc + cat.questions.length, 0);
  const answeredQuestions = Object.keys(answers).length;

  // The export is one self-contained file, so its styles are embedded
  const cssBlock = `<style>${EMBEDDED_CSS}</style>`;

  // Build metadata section
  const metadataHTML = includeMetadata ? `
    <p class="author">${author}</p>
    <p class="date">${timestamp}</p>
    <p class="completion">${completionPercentage}% (${answeredQuestions}/${totalQuestions} questions)</p>
    <p class="generated">${fullTimestamp}</p>
  ` : '';

  // Build category sections
  const categorySections = categories.map(category => {
    const categoryIcon = getCategoryIcon(category.id);
    const categoryAnswers = category.questions.filter(q => answers[q.id]);
    const categoryProgress = Math.round((categoryAnswers.length / category.questions.length) * 100);

    const questionBlocks = category.questions.map(question => {
      const answer = answers[question.id];

      let answerHTML = '';
      if (!answer) {
        answerHTML = '<p class="no-answer">[Not answered]</p>';
      } else if (Array.isArray(answer)) {
        if (answer.length === 0) {
          answerHTML = '<p class="no-answer">[Not answered]</p>';
        } else {
          answerHTML = `
            <ol class="answer-list">
              ${answer.map(item => `<li>${escapeHtml(item)}</li>`).join('\n              ')}
            </ol>
          `;
        }
      } else {
        answerHTML = `<p class="answer-text">${escapeHtml(answer)}</p>`;
      }

      return `
        <div class="question-block">
          <p class="question-text">${escapeHtml(question.text)}</p>
          ${answerHTML}
        </div>
      `;
    }).join('\n      ');

    return `
    <div class="category-section">
      <div class="category-header">
        <div class="category-icon">${categoryIcon}</div>
        <h2 class="category-title">${escapeHtml(category.label)} (${categoryProgress}%)</h2>
      </div>
      ${questionBlocks}
    </div>
    `;
  }).join('\n    ');

  // Build complete HTML document
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="author" content="${escapeHtml(author)}" />
  <meta name="date" content="${timestamp}" />
  <meta name="completion" content="${completionPercentage}%" />
  <meta name="generator" content="LEAN CANVAS - theunpartyapp" />
  <title>${escapeHtml(title)}</title>
  ${cssBlock}
</head>
<body data-theme="light">
  <button class="theme-toggle" onclick="toggleTheme()" title="Toggle dark/light mode">🌓</button>
  <button class="print-button" onclick="printPage()" title="Print this worksheet">🖨️ Print</button>

  <header>
    <h1 class="title">${escapeHtml(title)}</h1>
    ${metadataHTML}
  </header>

  <main>
    ${categorySections}
  </main>

  <script>
    function toggleTheme() {
      const body = document.body;
      const currentTheme = body.getAttribute("data-theme");
      const newTheme = currentTheme === "dark" ? "light" : "dark";
      body.setAttribute("data-theme", newTheme);
      localStorage.setItem("theme", newTheme);
    }

    function printPage() {
      window.print();
    }

    // Initialize theme from localStorage or system preference
    function initTheme() {
      const savedTheme = localStorage.getItem("theme");
      if (savedTheme) {
        document.body.setAttribute("data-theme", savedTheme);
      } else if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        document.body.setAttribute("data-theme", "dark");
      } else {
        document.body.setAttribute("data-theme", "light");
      }
    }

    // Listen for system theme changes
    if (window.matchMedia) {
      window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function(e) {
        if (!localStorage.getItem("theme")) {
          document.body.setAttribute("data-theme", e.matches ? "dark" : "light");
        }
      });
    }

    // Initialize theme on page load
    initTheme();
  </script>
</body>
</html>`;
}

// Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  return text.replace(/[&<>"']/g, m => map[m]);
}

// Export as downloadable file
export function downloadBusinessWorksheet(
  data: BusinessExportData,
  options: ExportOptions = {}
): void {
  const html = generateBusinessWorksheetHTML(data, options);
  const blob = new Blob([html], { type: 'text/html' });
  const url = URL.createObjectURL(blob);

  const timestamp = new Date().toISOString().split('T')[0];
  const filename = `lean-canvas-${timestamp}.html`;

  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Share worksheet - Web Share API (mobile) or open in new tab (desktop)
export interface ShareResult {
  success: boolean;
  message: string;
  method: 'webshare' | 'newtab' | 'error';
}

export async function shareBusinessWorksheet(
  data: BusinessExportData,
  options: ExportOptions = {}
): Promise<ShareResult> {
  try {
    const html = generateBusinessWorksheetHTML(data, options);
    const blob = new Blob([html], { type: 'text/html' });

    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `lean-canvas-${timestamp}.html`;

    // Try Web Share API (mobile and modern browsers)
    if (navigator.share && navigator.canShare) {
      const file = new File([blob], filename, { type: 'text/html' });
      const shareData = {
        files: [file],
        title: 'Lean Canvas - Business Worksheet',
        text: `My Lean Canvas worksheet (${data.completionPercentage}% complete)`
      };

      if (navigator.canShare(shareData)) {
        try {
          await navigator.share(shareData);
          return {
            success: true,
            message: 'Worksheet shared successfully!',
            method: 'webshare'
          };
        } catch (shareError: unknown) {
          // User cancelled share dialog
          if (shareError instanceof Error && shareError.name === 'AbortError') {
            return {
              success: false,
              message: 'Share cancelled',
              method: 'webshare'
            };
          }
          // Fall through to new tab method
        }
      }
    }

    // Fallback: Open in new tab (desktop)
    const url = URL.createObjectURL(blob);
    const newWindow = window.open(url, '_blank');

    if (newWindow) {
      // Clean up URL after window opens
      setTimeout(() => URL.revokeObjectURL(url), 1000);

      return {
        success: true,
        message: 'Worksheet opened in new tab! Share or bookmark the page.',
        method: 'newtab'
      };
    } else {
      // Popup blocked
      URL.revokeObjectURL(url);
      return {
        success: false,
        message: 'Please allow popups to share your worksheet.',
        method: 'error'
      };
    }
  } catch (error) {
    console.error('Share error:', error);
    return {
      success: false,
      message: 'Failed to share worksheet. Please try again.',
      method: 'error'
    };
  }
}
