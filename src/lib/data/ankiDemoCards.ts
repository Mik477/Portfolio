// src/lib/data/ankiDemoCards.ts
// Pre-loaded card data for the Anki Automation section preview
// Data extracted from the anki-demo to ensure exact visual parity

export interface AnkiCardField {
  Front: string;
  Back: string;
}

export interface AnkiCardData {
  fields: AnkiCardField;
  uid: string;
  tags?: string[];
}

/**
 * Demo showcase cards displaying various Anki Automation features.
 * These cards demonstrate:
 * - Rich HTML formatting (badges, callouts, tables)
 * - LaTeX/MathJax formulas
 * - Code blocks and syntax highlighting
 * - Spoiler/reveal interactions
 * - Various styling options
 */
export const ankiDemoCards: AnkiCardData[] = [
  {
    uid: "showcase-001",
    fields: {
      Front: `<p>What is the <span class="badge badge-cyan">Primary</span> purpose of <strong>Anki Automation</strong>?</p>`,
      Back: `<div class="info">
  <strong>Definition:</strong> Anki Automation is a tool that uses AI to generate professional flashcards from lecture materials, PDFs, and notes.
</div>

<p>Key benefits:</p>

<ul>
<li>Saves hours of manual card creation</li>
<li>Ensures consistent, high-quality formatting</li>
<li>Supports LaTeX, tables, and rich HTML styling</li>
</ul>`
    },
    tags: ["intro", "definition"]
  },
  {
    uid: "showcase-002",
    fields: {
      Front: `<p>Explain the difference between <mark>Supervised</mark> and <mark class="highlight-green">Unsupervised</mark> Learning.</p>`,
      Back: `<table>
<thead>
<tr>
  <th style="text-align:left;">Aspect</th>
  <th style="text-align:center;">Supervised Learning</th>
  <th style="text-align:center;">Unsupervised Learning</th>
</tr>
</thead>
<tbody>
<tr>
  <td style="text-align:left;">Data</td>
  <td style="text-align:center;">Labeled</td>
  <td style="text-align:center;">Unlabeled</td>
</tr>
<tr>
  <td style="text-align:left;">Goal</td>
  <td style="text-align:center;">Predict outcomes</td>
  <td style="text-align:center;">Find patterns</td>
</tr>
<tr>
  <td style="text-align:left;">Examples</td>
  <td style="text-align:center;">Classification, Regression</td>
  <td style="text-align:center;">Clustering</td>
</tr>
</tbody>
</table>

<div class="tip">
  <strong>Tip:</strong> Think of supervised learning as learning with a teacher!
</div>`
    },
    tags: ["machine-learning", "comparison"]
  },
  {
    uid: "showcase-003",
    fields: {
      Front: `<p>What is the <span class="badge badge-purple">Quadratic Formula</span>?</p>

<p>Hint: <span class="spoiler" tabindex="0">It solves ax² + bx + c = 0</span></p>`,
      Back: `<p>The general form of a quadratic equation is:</p>

<p>\\[ ax^2 + bx + c = 0 \\]</p>

<p>The solutions are given by:</p>

<p>\\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]</p>

<div class="warning">
  <strong>Note:</strong> The discriminant \\( \\Delta = b^2 - 4ac \\) determines the nature of roots.
</div>`
    },
    tags: ["mathematics", "algebra"]
  },
  {
    uid: "showcase-004",
    fields: {
      Front: `<p>What keyboard shortcut opens the <kbd>Command Palette</kbd> in VS Code?</p>`,
      Back: `<p>Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (Windows/Linux)</p>

<p>Or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (macOS)</p>

<div class="info">
  <strong>Pro Tip:</strong> You can also use <kbd>F1</kbd> as an alternative!
</div>`
    },
    tags: ["shortcuts", "vscode"]
  },
  {
    uid: "showcase-005",
    fields: {
      Front: `<p>Write a Python function for <span class="badge badge-green">factorial</span>.</p>`,
      Back: `<pre><code>def factorial(n):
    if n == 0 or n == 1:
        return 1
    return n * factorial(n - 1)

print(factorial(5))  # Output: 120</code></pre>

<div class="tip">
  <strong>Complexity:</strong> \\( O(n) \\) for recursive calls
</div>`
    },
    tags: ["programming", "python"]
  },
  {
    uid: "showcase-006",
    fields: {
      Front: `<p>What are the <span class="badge badge-amber">ACID</span> properties?</p>

<p>Hint: <span class="spoiler" tabindex="0">Atomicity, Consistency, Isolation, Durability</span></p>`,
      Back: `<dl>
  <dt>Atomicity</dt>
  <dd>All operations succeed or all fail together</dd>

  <dt>Consistency</dt>
  <dd>Database remains in a valid state</dd>

  <dt>Isolation</dt>
  <dd>Concurrent transactions don't interfere</dd>

  <dt>Durability</dt>
  <dd>Committed transactions persist after failures</dd>
</dl>

<div class="error">
  <strong>Common Mistake:</strong> Confusing Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE) with the Isolation property itself.
</div>`
    },
    tags: ["databases", "transactions", "theory"]
  },
  {
    uid: "showcase-007",
    fields: {
      Front: `<p><details class="spoiler-block">
  <summary>Click to reveal the question about Neural Networks</summary>
  <p>What are the three main types of layers in a neural network?</p>
</details></p>`,
      Back: `<table>
<thead>
<tr>
  <th style="text-align:left;">Layer Type</th>
  <th style="text-align:center;">Function</th>
  <th style="text-align:center;">Position</th>
</tr>
</thead>
<tbody>
<tr>
  <td style="text-align:left;"><span class="badge badge-blue">Input</span></td>
  <td style="text-align:center;">Receives raw data</td>
  <td style="text-align:center;">First</td>
</tr>
<tr>
  <td style="text-align:left;"><span class="badge badge-purple">Hidden</span></td>
  <td style="text-align:center;">Learns features and patterns</td>
  <td style="text-align:center;">Middle</td>
</tr>
<tr>
  <td style="text-align:left;"><span class="badge badge-green">Output</span></td>
  <td style="text-align:center;">Produces final predictions</td>
  <td style="text-align:center;">Last</td>
</tr>
</tbody>
</table>

<blockquote>
  "Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction."
  <cite>— Yann LeCun, Yoshua Bengio, Geoffrey Hinton</cite>
</blockquote>`
    },
    tags: ["deep-learning", "neural-networks", "architecture"]
  },
  {
    uid: "showcase-008",
    fields: {
      Front: `<p>What does <code>HTTP 404</code> status code mean?</p>`,
      Back: `<p><span class="badge badge-red">404 Not Found</span></p>

<p>The server cannot find the requested resource. This typically means:</p>

<ul>
<li>The URL is incorrect or misspelled</li>
<li>The resource has been moved or deleted</li>
<li>The link is broken</li>
</ul>

<div class="info">
  <strong>Related Codes:</strong>
  <ul>
    <li><code>400</code> - Bad Request</li>
    <li><code>401</code> - Unauthorized</li>
    <li><code>403</code> - Forbidden</li>
    <li><code>500</code> - Internal Server Error</li>
  </ul>
</div>`
    },
    tags: ["web-development", "http", "status-codes"]
  },
  {
    uid: "showcase-009",
    fields: {
      Front: `<p>Compare <span class="yes">✓</span> advantages and <span class="no">✗</span> disadvantages of <strong>SQL</strong> vs <strong>NoSQL</strong> databases.</p>`,
      Back: `<table>
<thead>
<tr>
  <th>Feature</th>
  <th>SQL</th>
  <th>NoSQL</th>
</tr>
</thead>
<tbody>
<tr>
  <td>Schema</td>
  <td><span class="no">✗</span> Fixed</td>
  <td><span class="yes">✓</span> Flexible</td>
</tr>
<tr>
  <td>Scalability</td>
  <td>Vertical</td>
  <td><span class="yes">✓</span> Horizontal</td>
</tr>
<tr>
  <td>ACID Compliance</td>
  <td><span class="yes">✓</span> Full</td>
  <td>Partial</td>
</tr>
<tr>
  <td>Complex Queries</td>
  <td><span class="yes">✓</span> Excellent</td>
  <td>Limited</td>
</tr>
<tr>
  <td>Speed (simple ops)</td>
  <td>Good</td>
  <td><span class="yes">✓</span> Faster</td>
</tr>
</tbody>
</table>

<div class="tip">
  <strong>When to use SQL:</strong> Complex relationships, transactions, data integrity
</div>

<div class="tip">
  <strong>When to use NoSQL:</strong> Rapid scaling, unstructured data, real-time apps
</div>`
    },
    tags: ["databases", "comparison", "architecture"]
  },
  {
    uid: "showcase-010",
    fields: {
      Front: `<p>What is <mark class="highlight-yellow">Big O Notation</mark> and why is it important?</p>`,
      Back: `<p>Big O notation describes the <strong>upper bound</strong> of an algorithm's time or space complexity as input size grows.</p>

<p>Common complexities (best to worst):</p>

<table>
<thead>
<tr>
  <th style="text-align:left;">Notation</th>
  <th style="text-align:center;">Name</th>
  <th style="text-align:right;">Example</th>
</tr>
</thead>
<tbody>
<tr>
  <td style="text-align:left;">\\( O(1) \\)</td>
  <td style="text-align:center;">Constant</td>
  <td style="text-align:right;">Array access</td>
</tr>
<tr>
  <td style="text-align:left;">\\( O(\\log n) \\)</td>
  <td style="text-align:center;">Logarithmic</td>
  <td style="text-align:right;">Binary search</td>
</tr>
<tr>
  <td style="text-align:left;">\\( O(n) \\)</td>
  <td style="text-align:center;">Linear</td>
  <td style="text-align:right;">Simple loop</td>
</tr>
<tr>
  <td style="text-align:left;">\\( O(n \\log n) \\)</td>
  <td style="text-align:center;">Linearithmic</td>
  <td style="text-align:right;">Merge sort</td>
</tr>
<tr>
  <td style="text-align:left;">\\( O(n^2) \\)</td>
  <td style="text-align:center;">Quadratic</td>
  <td style="text-align:right;">Nested loops</td>
</tr>
<tr>
  <td style="text-align:left;">\\( O(2^n) \\)</td>
  <td style="text-align:center;">Exponential</td>
  <td style="text-align:right;">Recursive Fibonacci</td>
</tr>
</tbody>
</table>

<div class="error">
  <strong>Important:</strong> Big O ignores constants and lower-order terms. \\( O(2n) \\) simplifies to \\( O(n) \\).
</div>`
    },
    tags: ["algorithms", "complexity", "fundamentals"]
  }
];

export default ankiDemoCards;
