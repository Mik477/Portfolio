window.DEMO_DATA = {
  "validate": {
    "valid": true,
    "card_count": 10,
    "errors": []
  },
  "preview": {
    "0": {
      "success": true,
      "card_index": 0,
      "total_cards": 10,
      "fields": {
        "Front": "<p>What is the <span class=\"badge badge-cyan\">Primary</span> purpose of <strong>Anki Automation</strong>?</p>\n",
        "Back": "<div class=\"info\">\n  <strong>Definition:</strong> Anki Automation is a tool that uses AI to generate professional flashcards from lecture materials, PDFs, and notes.\n</div>\n\n<p>Key benefits:</p>\n\n<ul>\n<li>Saves hours of manual card creation</li>\n<li>Ensures consistent, high-quality formatting</li>\n<li>Supports LaTeX, tables, and rich HTML styling</li>\n</ul>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-001",
      "tags": [
        "intro",
        "definition"
      ]
    },
    "1": {
      "success": true,
      "card_index": 1,
      "total_cards": 10,
      "fields": {
        "Front": "<p>Explain the difference between <mark>Supervised</mark> and <mark class=\"highlight-green\">Unsupervised</mark> Learning.</p>\n",
        "Back": "<table>\n<thead>\n<tr>\n  <th style=\"text-align:left;\">Aspect</th>\n  <th style=\"text-align:center;\">Supervised Learning</th>\n  <th style=\"text-align:center;\">Unsupervised Learning</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n  <td style=\"text-align:left;\">Data</td>\n  <td style=\"text-align:center;\">Labeled</td>\n  <td style=\"text-align:center;\">Unlabeled</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">Goal</td>\n  <td style=\"text-align:center;\">Predict outcomes</td>\n  <td style=\"text-align:center;\">Find patterns</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">Examples</td>\n  <td style=\"text-align:center;\">Classification, Regression</td>\n  <td style=\"text-align:center;\">Clustering</td>\n</tr>\n</tbody>\n</table>\n\n<div class=\"tip\">\n  <strong>Tip:</strong> Think of supervised learning as learning with a teacher!\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-002",
      "tags": [
        "machine-learning",
        "comparison"
      ]
    },
    "2": {
      "success": true,
      "card_index": 2,
      "total_cards": 10,
      "fields": {
        "Front": "<p>What is the <span class=\"badge badge-purple\">Quadratic Formula</span>?</p>\n\n<p>Hint: <span class=\"spoiler\" tabindex=\"0\">It solves ax\u00b2 + bx + c = 0</span></p>\n",
        "Back": "<p>The general form of a quadratic equation is:</p>\n\n<p>\\[ ax^2 + bx + c = 0 \\]</p>\n\n<p>The solutions are given by:</p>\n\n<p>\\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]</p>\n\n<div class=\"warning\">\n  <strong>Note:</strong> The discriminant \\( \\Delta = b^2 - 4ac \\) determines the nature of roots.\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-003",
      "tags": [
        "mathematics",
        "algebra"
      ]
    },
    "3": {
      "success": true,
      "card_index": 3,
      "total_cards": 10,
      "fields": {
        "Front": "<p>What keyboard shortcut opens the <kbd>Command Palette</kbd> in VS Code?</p>\n",
        "Back": "<p>Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (Windows/Linux)</p>\n\n<p>Or <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (macOS)</p>\n\n<div class=\"info\">\n  <strong>Pro Tip:</strong> You can also use <kbd>F1</kbd> as an alternative!\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-004",
      "tags": [
        "shortcuts",
        "vscode"
      ]
    },
    "4": {
      "success": true,
      "card_index": 4,
      "total_cards": 10,
      "fields": {
        "Front": "<p>Write a Python function for <span class=\"badge badge-green\">factorial</span>.</p>\n",
        "Back": "<pre><code>def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))  # Output: 120</code></pre>\n\n<div class=\"tip\">\n  <strong>Complexity:</strong> \\( O(n) \\) for recursive calls\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-005",
      "tags": [
        "programming",
        "python"
      ]
    },
    "5": {
      "success": true,
      "card_index": 5,
      "total_cards": 10,
      "fields": {
        "Front": "<p>What are the <span class=\"badge badge-amber\">ACID</span> properties?</p>\n\n<p>Hint: <span class=\"spoiler\" tabindex=\"0\">Atomicity, Consistency, Isolation, Durability</span></p>\n",
        "Back": "<dl>\n  <dt>Atomicity</dt>\n  <dd>All operations succeed or all fail together</dd>\n\n  <dt>Consistency</dt>\n  <dd>Database remains in a valid state</dd>\n\n  <dt>Isolation</dt>\n  <dd>Concurrent transactions don't interfere</dd>\n\n  <dt>Durability</dt>\n  <dd>Committed transactions persist after failures</dd>\n</dl>\n\n<div class=\"error\">\n  <strong>Common Mistake:</strong> Confusing Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE) with the Isolation property itself.\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-006",
      "tags": [
        "databases",
        "transactions",
        "theory"
      ]
    },
    "6": {
      "success": true,
      "card_index": 6,
      "total_cards": 10,
      "fields": {
        "Front": "<p><details class=\"spoiler-block\"><br />\n  <summary>Click to reveal the question about Neural Networks</summary><br />\n  <p>What are the three main types of layers in a neural network?</p><br />\n</details></p>\n",
        "Back": "<table>\n<thead>\n<tr>\n  <th style=\"text-align:left;\">Layer Type</th>\n  <th style=\"text-align:center;\">Function</th>\n  <th style=\"text-align:center;\">Position</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n  <td style=\"text-align:left;\"><span class=\"badge badge-blue\">Input</span></td>\n  <td style=\"text-align:center;\">Receives raw data</td>\n  <td style=\"text-align:center;\">First</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\"><span class=\"badge badge-purple\">Hidden</span></td>\n  <td style=\"text-align:center;\">Learns features and patterns</td>\n  <td style=\"text-align:center;\">Middle</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\"><span class=\"badge badge-green\">Output</span></td>\n  <td style=\"text-align:center;\">Produces final predictions</td>\n  <td style=\"text-align:center;\">Last</td>\n</tr>\n</tbody>\n</table>\n\n<blockquote>\n  \"Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction.\"\n  <cite>\u2014 Yann LeCun, Yoshua Bengio, Geoffrey Hinton</cite>\n</blockquote>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-007",
      "tags": [
        "deep-learning",
        "neural-networks",
        "architecture"
      ]
    },
    "7": {
      "success": true,
      "card_index": 7,
      "total_cards": 10,
      "fields": {
        "Front": "<p>What does <code>HTTP 404</code> status code mean?</p>\n",
        "Back": "<p><span class=\"badge badge-red\">404 Not Found</span></p>\n\n<p>The server cannot find the requested resource. This typically means:</p>\n\n<ul>\n<li>The URL is incorrect or misspelled</li>\n<li>The resource has been moved or deleted</li>\n<li>The link is broken</li>\n</ul>\n\n<div class=\"info\">\n  <strong>Related Codes:</strong>\n  *   <code>400</code> - Bad Request\n  *   <code>401</code> - Unauthorized\n  *   <code>403</code> - Forbidden\n  *   <code>500</code> - Internal Server Error\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-008",
      "tags": [
        "web-development",
        "http",
        "status-codes"
      ]
    },
    "8": {
      "success": true,
      "card_index": 8,
      "total_cards": 10,
      "fields": {
        "Front": "<p>Compare <span class=\"yes\">\u2713</span> advantages and <span class=\"no\">\u2717</span> disadvantages of <strong>SQL</strong> vs <strong>NoSQL</strong> databases.</p>\n",
        "Back": "<table>\n<thead>\n<tr>\n  <th>Feature</th>\n  <th>SQL</th>\n  <th>NoSQL</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n  <td>Schema</td>\n  <td><span class=\"no\">\u2717</span> Fixed</td>\n  <td><span class=\"yes\">\u2713</span> Flexible</td>\n</tr>\n<tr>\n  <td>Scalability</td>\n  <td>Vertical</td>\n  <td><span class=\"yes\">\u2713</span> Horizontal</td>\n</tr>\n<tr>\n  <td>ACID Compliance</td>\n  <td><span class=\"yes\">\u2713</span> Full</td>\n  <td>Partial</td>\n</tr>\n<tr>\n  <td>Complex Queries</td>\n  <td><span class=\"yes\">\u2713</span> Excellent</td>\n  <td>Limited</td>\n</tr>\n<tr>\n  <td>Speed (simple ops)</td>\n  <td>Good</td>\n  <td><span class=\"yes\">\u2713</span> Faster</td>\n</tr>\n</tbody>\n</table>\n\n<div class=\"tip\">\n  <strong>When to use SQL:</strong> Complex relationships, transactions, data integrity\n</div>\n\n<div class=\"tip\">\n  <strong>When to use NoSQL:</strong> Rapid scaling, unstructured data, real-time apps\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-009",
      "tags": [
        "databases",
        "comparison",
        "architecture"
      ]
    },
    "9": {
      "success": true,
      "card_index": 9,
      "total_cards": 10,
      "fields": {
        "Front": "<p>What is <mark class=\"highlight-yellow\">Big O Notation</mark> and why is it important?</p>\n",
        "Back": "<p>Big O notation describes the <strong>upper bound</strong> of an algorithm's time or space complexity as input size grows.</p>\n\n<p>Common complexities (best to worst):</p>\n\n<table>\n<thead>\n<tr>\n  <th style=\"text-align:left;\">Notation</th>\n  <th style=\"text-align:center;\">Name</th>\n  <th style=\"text-align:right;\">Example</th>\n</tr>\n</thead>\n<tbody>\n<tr>\n  <td style=\"text-align:left;\">\\( O(1) \\)</td>\n  <td style=\"text-align:center;\">Constant</td>\n  <td style=\"text-align:right;\">Array access</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">\\( O(\\log n) \\)</td>\n  <td style=\"text-align:center;\">Logarithmic</td>\n  <td style=\"text-align:right;\">Binary search</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">\\( O(n) \\)</td>\n  <td style=\"text-align:center;\">Linear</td>\n  <td style=\"text-align:right;\">Simple loop</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">\\( O(n \\log n) \\)</td>\n  <td style=\"text-align:center;\">Linearithmic</td>\n  <td style=\"text-align:right;\">Merge sort</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">\\( O(n^2) \\)</td>\n  <td style=\"text-align:center;\">Quadratic</td>\n  <td style=\"text-align:right;\">Nested loops</td>\n</tr>\n<tr>\n  <td style=\"text-align:left;\">\\( O(2^n) \\)</td>\n  <td style=\"text-align:center;\">Exponential</td>\n  <td style=\"text-align:right;\">Recursive Fibonacci</td>\n</tr>\n</tbody>\n</table>\n\n<div class=\"error\">\n  <strong>Important:</strong> Big O ignores constants and lower-order terms. \\( O(2n) \\) simplifies to \\( O(n) \\).\n</div>\n"
      },
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "uid": "showcase-010",
      "tags": [
        "algorithms",
        "complexity",
        "fundamentals"
      ]
    }
  },
  "parse": {
    "success": true,
    "data": {
      "deck": "Anki-Automation-Showcase",
      "model": "Anki Automation",
      "tags": [
        "showcase",
        "demo"
      ],
      "cards": [
        {
          "uid": "showcase-001",
          "fields": {
            "Front": "What is the <span class=\"badge badge-cyan\">Primary</span> purpose of **Anki Automation**?\n",
            "Back": "<div class=\"info\">\n  <strong>Definition:</strong> Anki Automation is a tool that uses AI to generate professional flashcards from lecture materials, PDFs, and notes.\n</div>\n\nKey benefits:\n*   Saves hours of manual card creation\n*   Ensures consistent, high-quality formatting\n*   Supports LaTeX, tables, and rich HTML styling\n"
          },
          "tags": [
            "intro",
            "definition"
          ]
        },
        {
          "uid": "showcase-002",
          "fields": {
            "Front": "Explain the difference between <mark>Supervised</mark> and <mark class=\"highlight-green\">Unsupervised</mark> Learning.\n",
            "Back": "| Aspect | Supervised Learning | Unsupervised Learning |\n|:-------|:-------------------:|:---------------------:|\n| Data | Labeled | Unlabeled |\n| Goal | Predict outcomes | Find patterns |\n| Examples | Classification, Regression | Clustering |\n\n<div class=\"tip\">\n  <strong>Tip:</strong> Think of supervised learning as learning with a teacher!\n</div>\n"
          },
          "tags": [
            "machine-learning",
            "comparison"
          ]
        },
        {
          "uid": "showcase-003",
          "fields": {
            "Front": "What is the <span class=\"badge badge-purple\">Quadratic Formula</span>?\n\nHint: <span class=\"spoiler\" tabindex=\"0\">It solves ax\u00b2 + bx + c = 0</span>\n",
            "Back": "The general form of a quadratic equation is:\n\n\\[ ax^2 + bx + c = 0 \\]\n\nThe solutions are given by:\n\n\\[ x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a} \\]\n\n<div class=\"warning\">\n  <strong>Note:</strong> The discriminant \\( \\Delta = b^2 - 4ac \\) determines the nature of roots.\n</div>\n"
          },
          "tags": [
            "mathematics",
            "algebra"
          ]
        },
        {
          "uid": "showcase-004",
          "fields": {
            "Front": "What keyboard shortcut opens the <kbd>Command Palette</kbd> in VS Code?\n",
            "Back": "Press <kbd>Ctrl</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (Windows/Linux)\n\nOr <kbd>Cmd</kbd> + <kbd>Shift</kbd> + <kbd>P</kbd> (macOS)\n\n<div class=\"info\">\n  <strong>Pro Tip:</strong> You can also use <kbd>F1</kbd> as an alternative!\n</div>\n"
          },
          "tags": [
            "shortcuts",
            "vscode"
          ]
        },
        {
          "uid": "showcase-005",
          "fields": {
            "Front": "Write a Python function for <span class=\"badge badge-green\">factorial</span>.\n",
            "Back": "<pre><code>def factorial(n):\n    if n == 0 or n == 1:\n        return 1\n    return n * factorial(n - 1)\n\nprint(factorial(5))  # Output: 120</code></pre>\n\n<div class=\"tip\">\n  <strong>Complexity:</strong> \\( O(n) \\) for recursive calls\n</div>\n"
          },
          "tags": [
            "programming",
            "python"
          ]
        },
        {
          "uid": "showcase-006",
          "fields": {
            "Front": "What are the <span class=\"badge badge-amber\">ACID</span> properties?\n\nHint: <span class=\"spoiler\" tabindex=\"0\">Atomicity, Consistency, Isolation, Durability</span>\n",
            "Back": "<dl>\n  <dt>Atomicity</dt>\n  <dd>All operations succeed or all fail together</dd>\n\n  <dt>Consistency</dt>\n  <dd>Database remains in a valid state</dd>\n\n  <dt>Isolation</dt>\n  <dd>Concurrent transactions don't interfere</dd>\n\n  <dt>Durability</dt>\n  <dd>Committed transactions persist after failures</dd>\n</dl>\n\n<div class=\"error\">\n  <strong>Common Mistake:</strong> Confusing Isolation levels (READ UNCOMMITTED, READ COMMITTED, REPEATABLE READ, SERIALIZABLE) with the Isolation property itself.\n</div>\n"
          },
          "tags": [
            "databases",
            "transactions",
            "theory"
          ]
        },
        {
          "uid": "showcase-007",
          "fields": {
            "Front": "<details class=\"spoiler-block\">\n  <summary>Click to reveal the question about Neural Networks</summary>\n  <p>What are the three main types of layers in a neural network?</p>\n</details>\n",
            "Back": "| Layer Type | Function | Position |\n|:-----------|:--------:|:--------:|\n| <span class=\"badge badge-blue\">Input</span> | Receives raw data | First |\n| <span class=\"badge badge-purple\">Hidden</span> | Learns features and patterns | Middle |\n| <span class=\"badge badge-green\">Output</span> | Produces final predictions | Last |\n\n<blockquote>\n  \"Deep learning allows computational models that are composed of multiple processing layers to learn representations of data with multiple levels of abstraction.\"\n  <cite>\u2014 Yann LeCun, Yoshua Bengio, Geoffrey Hinton</cite>\n</blockquote>\n"
          },
          "tags": [
            "deep-learning",
            "neural-networks",
            "architecture"
          ]
        },
        {
          "uid": "showcase-008",
          "fields": {
            "Front": "What does <code>HTTP 404</code> status code mean?\n",
            "Back": "<span class=\"badge badge-red\">404 Not Found</span>\n\nThe server cannot find the requested resource. This typically means:\n\n*   The URL is incorrect or misspelled\n*   The resource has been moved or deleted\n*   The link is broken\n\n<div class=\"info\">\n  <strong>Related Codes:</strong>\n  *   <code>400</code> - Bad Request\n  *   <code>401</code> - Unauthorized\n  *   <code>403</code> - Forbidden\n  *   <code>500</code> - Internal Server Error\n</div>\n"
          },
          "tags": [
            "web-development",
            "http",
            "status-codes"
          ]
        },
        {
          "uid": "showcase-009",
          "fields": {
            "Front": "Compare <span class=\"yes\">\u2713</span> advantages and <span class=\"no\">\u2717</span> disadvantages of **SQL** vs **NoSQL** databases.\n",
            "Back": "| Feature | SQL | NoSQL |\n|---------|-----|-------|\n| Schema | <span class=\"no\">\u2717</span> Fixed | <span class=\"yes\">\u2713</span> Flexible |\n| Scalability | Vertical | <span class=\"yes\">\u2713</span> Horizontal |\n| ACID Compliance | <span class=\"yes\">\u2713</span> Full | Partial |\n| Complex Queries | <span class=\"yes\">\u2713</span> Excellent | Limited |\n| Speed (simple ops) | Good | <span class=\"yes\">\u2713</span> Faster |\n\n<div class=\"tip\">\n  <strong>When to use SQL:</strong> Complex relationships, transactions, data integrity\n</div>\n\n<div class=\"tip\">\n  <strong>When to use NoSQL:</strong> Rapid scaling, unstructured data, real-time apps\n</div>\n"
          },
          "tags": [
            "databases",
            "comparison",
            "architecture"
          ]
        },
        {
          "uid": "showcase-010",
          "fields": {
            "Front": "What is <mark class=\"highlight-yellow\">Big O Notation</mark> and why is it important?\n",
            "Back": "Big O notation describes the **upper bound** of an algorithm's time or space complexity as input size grows.\n\nCommon complexities (best to worst):\n\n| Notation | Name | Example |\n|:---------|:----:|--------:|\n| \\( O(1) \\) | Constant | Array access |\n| \\( O(\\log n) \\) | Logarithmic | Binary search |\n| \\( O(n) \\) | Linear | Simple loop |\n| \\( O(n \\log n) \\) | Linearithmic | Merge sort |\n| \\( O(n^2) \\) | Quadratic | Nested loops |\n| \\( O(2^n) \\) | Exponential | Recursive Fibonacci |\n\n<div class=\"error\">\n  <strong>Important:</strong> Big O ignores constants and lower-order terms. \\( O(2n) \\) simplifies to \\( O(n) \\).\n</div>\n"
          },
          "tags": [
            "algorithms",
            "complexity",
            "fundamentals"
          ]
        }
      ]
    },
    "card_count": 10,
    "reverse_count": 0,
    "total_cards": 10
  },
  "subjects": {
    "success": true,
    "subjects": [
      {
        "name": "Basic",
        "folder_name": "Basic",
        "prompt_count": 5,
        "created_at": "2025-11-14T23:15:27.309129"
      },
      {
        "name": "Enhanced",
        "folder_name": "Enhanced",
        "prompt_count": 5,
        "created_at": "2025-12-05T20:46:07.442663"
      },
      {
        "name": "Minimal",
        "folder_name": "Minimal",
        "prompt_count": 5,
        "created_at": "2025-12-05T20:46:07.425935"
      }
    ],
    "total_count": 3
  },
  "prompts": {
    "Basic": {
      "success": true,
      "prompts": [
        {
          "number": 1,
          "preview": "You are to assume the role of an expert academic a...",
          "file_size": 4607,
          "modified_at": "2025-12-05T21:07:10.842381"
        },
        {
          "number": 2,
          "preview": "Phase 2 (25 Cards per Day): Content Analysis & **C...",
          "file_size": 10567,
          "modified_at": "2025-12-06T11:51:42.490607"
        },
        {
          "number": 3,
          "preview": "Phase 3: Anki Card Generation.  The Anki Blueprint...",
          "file_size": 11327,
          "modified_at": "2025-12-06T20:15:57.471196"
        },
        {
          "number": 4,
          "preview": "Great, proceed with the next at most 10 cards from...",
          "file_size": 191,
          "modified_at": "2025-12-05T21:07:10.842381"
        },
        {
          "number": 5,
          "preview": "Excellent. We will now restart the entire process...",
          "file_size": 1406,
          "modified_at": "2025-12-05T21:07:10.846572"
        }
      ],
      "total_count": 5,
      "subject": "Basic"
    },
    "Enhanced": {
      "success": true,
      "prompts": [
        {
          "number": 1,
          "preview": "You are to assume the role of an expert academic a...",
          "file_size": 4677,
          "modified_at": "2025-12-05T21:07:10.846572"
        },
        {
          "number": 2,
          "preview": "Phase 2 (25 Cards per Day): Content Analysis & **F...",
          "file_size": 10226,
          "modified_at": "2025-12-05T21:27:03.441832"
        },
        {
          "number": 3,
          "preview": "Phase 3: Anki Card Generation.  The Anki Blueprint...",
          "file_size": 14566,
          "modified_at": "2025-12-06T20:15:57.471196"
        },
        {
          "number": 4,
          "preview": "Great, proceed with the next at most 10 cards from...",
          "file_size": 249,
          "modified_at": "2025-12-05T21:07:10.846572"
        },
        {
          "number": 5,
          "preview": "Excellent. We will now restart the entire process...",
          "file_size": 1607,
          "modified_at": "2025-12-05T21:07:10.846572"
        }
      ],
      "total_count": 5,
      "subject": "Enhanced"
    },
    "Minimal": {
      "success": true,
      "prompts": [
        {
          "number": 1,
          "preview": "You are to assume the role of an expert academic a...",
          "file_size": 4156,
          "modified_at": "2025-12-05T21:07:10.846572"
        },
        {
          "number": 2,
          "preview": "Phase 2 (25 Cards per Day): Content Analysis & **C...",
          "file_size": 7999,
          "modified_at": "2025-12-06T11:48:55.360018"
        },
        {
          "number": 3,
          "preview": "Phase 3: Anki Card Generation.  The Anki Blueprint...",
          "file_size": 5450,
          "modified_at": "2025-12-06T20:16:11.137793"
        },
        {
          "number": 4,
          "preview": "Great, proceed with the next at most 10 cards from...",
          "file_size": 157,
          "modified_at": "2025-12-05T21:07:10.846572"
        },
        {
          "number": 5,
          "preview": "Excellent. We will now restart the entire process...",
          "file_size": 1167,
          "modified_at": "2025-12-05T21:07:10.846572"
        }
      ],
      "total_count": 5,
      "subject": "Minimal"
    }
  },
  "prompt_content": {
    "Basic": {
      "1": {
        "success": true,
        "content": "You are to assume the role of an expert academic assistant and study partner. Your designated name for this role is **`Anki-Architect`**. Your sole purpose is to help me, a university student, study for my exams by creating perfect, high-yield Anki flashcards from my course materials.\n\nOur collaboration will follow a structured, multi-phase process for each lecture I provide.\n\n**Phase 1: The \"Anki Blueprint\" (Your Immediate Task)**\n\n1.  **Acknowledge and Wait:** After I give you this Master Prompt, you will simply acknowledge it and wait. I will then provide you with the materials for a specific lecture: a PDF file of the slides and a raw text transcript of the professor's spoken words. I may also provide mock exam questions or a list of key topics for the final exam to help you focus.\n\n2.  **Analyze and Plan:** Once you receive the materials, your first and only task for this phase is to conduct a thorough analysis and produce a structured **\"Anki Blueprint.\"** This blueprint is a strategic plan for creating the flashcards. It must NOT contain the final flashcard content itself.\n\n3.  **Blueprint Requirements:** Your Anki Blueprint must be structured as a detailed, hierarchical list. For each major topic or concept in the lecture, you must:\n    *   **Identify the Core Idea:** State the main headline or concept (e.g., \"Porter's Five Forces,\" \"Definition of an Information System,\" \"Turing Machine Halting Problem\").\n    *   **Pinpoint the Source:** Provide precise references to where this information is located in the provided materials. The primary reference should always be the slides (e.g., `VL 01, Slides 14-16`). The transcript should only be referenced if it provides critical clarification, examples, or information not present on the slides. When referencing the transcript, quote the first few words of the relevant sentence for easy lookup (e.g., `Transcript, starting: \"Now, it's crucial to remember that...\"`).\n    *   **Estimate Card Count:** Provide a specific number of recommended Anki cards for that topic. For example, if a slide lists 5 key characteristics of a concept, you should recommend 5 cards, not just one.\n    *   **Outline Card Content:** Briefly sketch out what each card or group of cards should cover. For example: \"One card for the definition, one card for each of the three components, and one card explaining the main advantage.\"\n    *   **Identify Visuals:** If a slide contains a particularly important diagram, chart, or visual model, note this in the blueprint (e.g., `Note: Slide 22 has a key diagram of the client-server model that should be screenshotted for the card.`).\n    *   **Suggest Enhancements:** Identify opportunities to use formatting features that would aid learning:\n        *   Tables for comparisons (e.g., \"Use a comparison table for X vs. Y\")\n        *   Hints for difficult recall (e.g., \"Include a spoiler hint for this definition\")\n        *   Callouts for common mistakes or tips (e.g., \"Add a warning callout about this common misconception\")\n\n**Phase 2: Anki Card Generation (To Be Initiated by Me Later)**\n\nAfter you have delivered the Anki Blueprint, I will review it. I will then send a *second, highly specific prompt* that instructs you on the exact YAML format and feature syntax for generating the cards. You will then generate a maximum of 10 cards at a time, based on the blueprint, until all planned cards for the lecture are complete. Do not begin this phase until I explicitly prompt you for it.\n\n**Guiding Principles for Your Analysis:**\n\n*   **Exam-Oriented Focus:** Always prioritize content that is likely to be on an exam. Definitions, enumerations (lists), comparisons, process steps, and foundational concepts are more important than anecdotal stories or minor details. Use any mock exam questions I provide as your primary guide for what is essential.\n*   **Language Adaptation:** You must automatically detect the primary language of the lecture slides (German or English) and conduct your entire analysis and all subsequent card generation in that language.\n*   **The \"One Thing\" Rule:** Your card estimations should be guided by the principle that a great flashcard tests exactly one piece of information.\n*   **Purposeful Enhancement:** Only suggest formatting features (tables, callouts, hints) when they genuinely improve learning\u2014not for decoration.\n\nTo begin, please confirm you have understood these instructions by responding with: **\"Anki-Architect protocol initiated. Ready to receive phase 2 prompt and lecture materials.\"** Do not say anything else.",
        "number": 1,
        "subject": "Basic"
      },
      "2": {
        "success": true,
        "content": "Phase 2 (25 Cards per Day): Content Analysis & **Consolidated** Blueprint Generation. Your task is to analyze the provided lecture materials for **[Insert Course Name] - Lecture [Insert Lecture Number or Topic]**, the conversation with the student about said material and lessons learned from that and create a high-yield, efficient \"Anki Blueprint.\"\n\n**Provided Materials:**\nYou are being given access to the following files:\n1.  **Lecture Slides**\n\n---\n\n**Prime Directive: The Principle of Surgical Consolidation**\n\nYour absolute primary goal is to design a blueprint that results in **a maximum of 25 Anki cards** for the entire lecture. This is a hard constraint. To achieve this, you might need to shift your strategy from granular detail to high-level synthesis for certain aspects. Your success on this task will be measured by your ability to create a powerful and comprehensive study set *within this limit*.\n\nThis does **not** mean making every card simplistic. It means adopting a **surgical approach**. Your goal is to preserve high-detail, high-quality cards for core, examinable knowledge while efficiently grouping or summarizing less critical, supporting information.\n\nTo achieve this balance, you must follow this hierarchy:\n\n1.  **Protect the Core (Keep Detailed):** Prioritize detailed, atomic, and high-quality cards for the most important information. This includes:\n    *   **Formal Definitions** of key terms (e.g., \"What is a transaction system?\").\n    *   **Core Frameworks and Models** (e.g., Porter's Five Forces, Technology Acceptance Model).\n    *   **Fundamental Principles** or theories.\n    *   **Crucial Distinctions** between two or more concepts (e.g., Data vs. Information).\n\n2.  **Consolidate the Support (Group & Summarize):** Apply high-level synthesis and grouping strategies primarily to secondary or illustrative information. This is where you will save space to meet the 25-card limit. This includes:\n    *   **Lists of Examples:** Instead of one card per example, create one card asking for \"3 key examples of B2C business models.\"\n    *   **Enumerations of Features/Characteristics:** Instead of one card per feature, create one card asking \"What are the main characteristics of a transformation system?\"\n    *   **Redundant Explanations:** If multiple slides explain the same concept with different visuals, create a single card that captures the central idea.\n\n**Your Consolidation Toolkit:**\n\n*   **To group lists:** Use questions like \"List the 4 components of...\"\n*   **To summarize concepts:** Use questions like \"Explain the core idea of the Long-Tail-Strategie.\"\n*   **To capture comparisons:** Use \"Compare and contrast X and Y based on [criteria].\"\n*   **To handle case studies/examples:** Use \"What is the key takeaway from the [Company] example regarding [Concept]?\"\n\n---\n\n### **Core Philosophical Shift: Strategic Violation of the Atomic Principle**\n\nNormally, Anki cards should be \"atomic\" (one fact per card). For this task, you **MUST** strategically violate this principle. Your goal is not to capture every single detail, but to create cards that summarize key concepts, group related information, and test the connections between ideas.\n\n**Your Consolidation Strategies MUST Include:**\n\n1.  **Grouping Lists & Enumerations:** Instead of creating a separate card for each item in a list (e.g., \"Porter's 5 Forces\"), create **one single card** that asks for the entire list.\n2.  **Synthesizing Concepts:** Instead of defining two related concepts on separate cards, create **one card** that asks to \"Compare and Contrast\" them.\n3.  **Creating High-Level Questions:** Instead of making cards for minor details on a slide, create one card that asks for the main takeaway. For example: \"What is the central argument of the 'Transaction vs. Transformation Systems' slide?\"\n4.  **Combining Definitions:** If a slide defines several closely related terms, group them on the back of a single card.\n\n---\n\n### **Enhanced Learning Features: Strategic Use**\n\nYour cards support rich formatting. Plan the use of these features **purposefully**\u2014only when they genuinely enhance learning, not for decoration.\n\n**Available Features & When to Use Them:**\n\n| Feature | When to Use | When NOT to Use |\n|---------|-------------|-----------------|\n| **Tables** | Comparing 2+ items on 2+ criteria; structured data | Simple lists; single comparisons |\n| **Callout: Tip** (green) | Memory aids, mnemonics, study shortcuts | General information |\n| **Callout: Warning** (amber) | Common mistakes, exam pitfalls, misconceptions | Minor notes |\n| **Callout: Info** (blue) | Additional context, \"good to know\" details | Core examinable content |\n| **Callout: Error** (red) | Critical errors that cost exam points | Preferences or opinions |\n| **Hint (Spoiler)** | Difficult recall cards; first-letter hints | Easy cards; obvious answers |\n| **Code blocks** | Technical terms, commands, syntax, formulas | Regular text |\n| **Badges** | Topic categorization across large decks | Individual cards |\n| **Highlights** | 1-2 key terms per card maximum | Entire sentences |\n\n**Feature Planning Rule:** In your blueprint, explicitly note which features you plan to use for each card section and *why*. This ensures intentional, not random, enhancement.\n\n---\n\n### **Reverse Cards: When to Use Them**\n\nSome cards benefit from being tested in **both directions**. Mark a card for reversal when:\n\n| Use Reverse | Don't Use Reverse |\n|-------------|-------------------|\n| **Term \u2194 Definition** (e.g., \"What is SaaS?\" \u2194 \"What term describes software delivered via internet?\") | Explanatory questions (\"Why does X happen?\") |\n| **Acronym \u2194 Full name** (e.g., `API` \u2194 \"Application Programming Interface\") | Lists or enumerations |\n| **Symbol \u2194 Meaning** (e.g., `O(n)` \u2194 \"Linear time complexity\") | Compare/contrast questions |\n| **Foreign term \u2194 Translation** | Process or step-based questions |\n| **Formula \u2194 Name** (e.g., \\(E=mc^2\\) \u2194 \"Mass-energy equivalence\") | \"Explain...\" or \"Describe...\" questions |\n\n**Critical Rule for Reverse Cards:** The Front and Back must be **symmetrically meaningful**. Both directions must form valid, natural questions.\n\n\u2705 **Good for reverse:** Front: `HTTP` \u2192 Back: `Hypertext Transfer Protocol`  \n\u274c **Bad for reverse:** Front: `What are the 3 components of X?` \u2192 Back: `A, B, C` (reversed makes no sense)\n\nIn your blueprint, mark cards with `(Reverse: Yes)` when appropriate.\n\n---\n\n### **Blueprint Requirements**\n\nGenerate a structured list that outlines the key information, but now with a focus on consolidation.\n\n**Structure for each item in the Blueprint:**\n\n1.  **Topic/Concept Headline:** A clear title for the consolidated information block.\n2.  **Source Reference:** Cite the exact slide number(s): `(VL [Lecture Number] Slide X-Y)`.\n3.  **Content Sketch & Rationale:** Describe the **consolidated** information to be captured. Explicitly state *how* you are grouping the concepts to save space.\n4.  **Enhancement Plan:** List any formatting features to use (table, callout, hint) with brief justification.\n5.  **Recommended Card Count:** Provide the number of cards for this consolidated topic. This will almost always be `(Recommended Cards: 1)`.\n\n---\n\n### **Example of a Perfect *Consolidated* Blueprint Output:**\n\nHere is a fictional example for a lecture on \"E-Commerce Business Models,\" adapted for the 25-card limit.\n\n**Anki Blueprint: Management der Informationssysteme (VL 2: Gesch\u00e4ftsmodelle im E-Commerce)**\n\n*   **1. Core Definition of a Business Model and its Components**\n    *   **Reference:** `(VL 2 Slide 4-5)`\n    *   **Content Sketch:** This will be a single, high-level card. The front will ask for the definition of a business model. The back will provide the formal definition and then list its three core components (Value Proposition, Value Creation, Ertragsmodell) as a single, consolidated block of information.\n    *   **Enhancement Plan:** Use a **numbered list** for the three components. Add a **Tip callout** with mnemonic \"VVE\" for memorization.\n    *   **Recommended Cards:** 1 (Instead of 4 atomic cards).\n\n*   **2. Comparison of B2C, B2B, and C2C E-Commerce Models**\n    *   **Reference:** `(VL 2 Slide 8-10)`\n    *   **Content Sketch:** A single \"Compare and Contrast\" card. The front will ask to differentiate between B2C, B2B, and C2C models. The back will provide a concise definition and a key example for each.\n    *   **Enhancement Plan:** Use a **comparison table** (3 columns: Model | Definition | Example). This is ideal for 3-way comparisons.\n    *   **Recommended Cards:** 1 (Instead of 3-6 atomic cards).\n\n*   **3. The Long-Tail-Strategie: Core Concept and Preconditions**\n    *   **Reference:** `(VL 2 Slide 12-14)`\n    *   **Content Sketch:** One comprehensive card. The front will ask, \"Explain the Long-Tail-Strategie and its necessary preconditions.\" The back will define the concept (profit from niche products), explain the curve, and list the essential preconditions (e.g., centralized warehousing). This captures the entire topic.\n    *   **Enhancement Plan:** Include a **Hint (spoiler)** on the front: \"Hint: <spoiler>Think opposite of 80/20 rule</spoiler>\" for difficult recall.\n    *   **Recommended Cards:** 1 (Instead of 3 atomic cards).\n\n*   **4. Common Misconception: Platform vs. Pipeline Business Models**\n    *   **Reference:** `(VL 2 Slide 16-17)`\n    *   **Content Sketch:** Card asks about the key difference. Answer explains pipeline creates value linearly, platform facilitates value exchange.\n    *   **Enhancement Plan:** Add a **Warning callout** at the end: \"\u26a0\ufe0f Exam trap: Don't confuse platform ownership with platform facilitation.\"\n    *   **Recommended Cards:** 1\n\n*   **5. Key Acronym: SaaS**\n    *   **Reference:** `(VL 2 Slide 18)`\n    *   **Content Sketch:** Single acronym card. Front shows `SaaS`, back shows \"Software as a Service\" with brief explanation.\n    *   **Enhancement Plan:** Use **inline code** formatting for the acronym. **(Reverse: Yes)** - acronym \u2194 full name is ideal for bidirectional testing.\n    *   **Recommended Cards:** 1 (generates 2 with reverse)\n\n---\n\n**Final Instruction:**\nYour primary objective is to create an efficient and powerful Anki Blueprint that **does not exceed 25 total recommended cards**. Include your Enhancement Plan for each topic. I will review the blueprint before you generate the cards.",
        "number": 2,
        "subject": "Basic"
      },
      "3": {
        "success": true,
        "content": "Phase 3: Anki Card Generation.\n\nThe Anki Blueprint you generated is approved. You will now generate the Anki cards as planned, implementing the enhancement features you specified in your blueprint.\n\n**Command:**\nProceed with generating the cards.\n\nYour entire output must be a single YAML code block. Adherence to this protocol is paramount, as a script will parse your output directly. Do not include any conversational text, acknowledgements, or summaries.\n\n---\n\n### **YAML Format Specification**\n\n*   **`deck` (String):** The Anki deck name (`Course Name::Lecture Number`).\n*   **`model` (Required, String):** Always use `\"Anki Automation\"`.\n*   **`cards` (Required, List of Objects):** A list of card data objects.\n\n---\n\n### **CRITICAL Rules & Requirements**\n\n#### **1. UID Uniqueness**\nEvery card object **MUST** have a unique `uid` in the format `xxxx-xxxx-xxxx`. Never repeat a `uid`.\n\n#### **2. Core Formatting Requirements**\nYou **MUST** use Markdown and HTML as specified. Adherence to the following rules is essential for the cards to render correctly.\n\n*   **Lists:**\n    *   Use standard Markdown for unordered lists (`*` or `-`) and ordered lists (`1.`, `2.`).\n    *   Nested lists are fully supported and should be properly indented.\n    *   **CRITICAL:** A list **MUST** be separated from any preceding text by a blank line. Failure to do so will break the list formatting.\n\n*   **Tables:** Use **GitHub Flavored Markdown (GFM) syntax**. This is the only supported method for tables.\n\n*   **Formulas (LaTeX):** This is a standalone format and has strict rules.\n    *   **Inline Formulas:** Use `\\( ... \\)` for formulas within a line of text.\n    *   **Block Formulas:** Use `\\[ ... \\]` for formulas on their own centered line.\n    *   **CRITICAL FORBIDDEN RULE:** **NEVER** wrap LaTeX formulas in backticks (`` ` ``).\n    *   **CRITICAL FORBIDDEN SYNTAX:** You **MUST NOT** use single dollar signs (`$...$`) for inline math.\n\n---\n\n### **ENHANCED FEATURE SYNTAX REFERENCE**\n\nUse these features as planned in your blueprint. Apply them **purposefully** to enhance learning.\n\n#### **\ud83d\udcca Tables (Comparisons)**\nUse for comparing 2+ items across 2+ criteria. Always include header row.\n\n```markdown\n| Criterion | Option A | Option B |\n|-----------|----------|----------|\n| Speed     | Fast     | Slow     |\n| Cost      | High     | Low      |\n```\n\n#### **\ud83d\udca1 Callout Boxes**\nUse HTML div with appropriate class. Each type has a specific purpose:\n\n**Tip (Green)** - Memory aids, mnemonics, shortcuts:\n```html\n<div class=\"callout tip\">\n<strong>\ud83d\udca1 Tip:</strong> Remember \"VVE\" - Value proposition, Value creation, Ertragsmodell.\n</div>\n```\n\n**Warning (Amber)** - Common mistakes, exam pitfalls:\n```html\n<div class=\"callout warning\">\n<strong>\u26a0\ufe0f Exam Trap:</strong> Don't confuse correlation with causation!\n</div>\n```\n\n**Info (Blue)** - Additional context, supplementary details:\n```html\n<div class=\"callout info\">\n<strong>\u2139\ufe0f Note:</strong> This concept was introduced by Porter in 1985.\n</div>\n```\n\n**Error (Red)** - Critical mistakes to avoid:\n```html\n<div class=\"callout error\">\n<strong>\u274c Critical:</strong> Never apply this formula to non-linear systems.\n</div>\n```\n\n#### **\ud83d\udd0d Hints (Spoiler)**\nUse for difficult recall cards. Always format as \"Hint:\" followed by spoiler.\n\n**Inline hint** (hover to reveal):\n```html\nHint: <span class=\"spoiler\">First letter is \"P\" for Process</span>\n```\n\n**Block hint** (click to expand) - for longer hints:\n```html\n<details class=\"spoiler-block\">\n<summary>\ud83d\udca1 Hint: Click to reveal</summary>\nThink about the three phases: Input \u2192 Processing \u2192 Output\n</details>\n```\n\n#### **\u2328\ufe0f Keyboard Keys**\nUse for shortcuts, commands, key combinations:\n```html\nPress <kbd>Ctrl</kbd> + <kbd>C</kbd> to copy.\n```\n\n#### **\ud83d\udcdd Code Formatting**\n**Inline code** - for technical terms, commands, acronyms:\n```markdown\nThe `HTTP` protocol uses `GET` and `POST` methods.\n```\n\n**Code blocks** - for multi-line code or syntax:\n````markdown\n```python\ndef calculate_roi(gain, cost):\n    return (gain - cost) / cost\n```\n````\n\n#### **\ud83c\udff7\ufe0f Badges**\nUse sparingly for categorization in large decks:\n```html\n<span class=\"badge badge-blue\">Fundamentals</span>\n<span class=\"badge badge-green\">Easy</span>\n<span class=\"badge badge-amber\">Medium</span>\n<span class=\"badge badge-red\">Hard</span>\n<span class=\"badge badge-purple\">Advanced</span>\n```\n\n#### **\u2728 Highlights**\nUse very sparingly (1-2 per card max) for key terms:\n```html\nThe <mark>primary key</mark> uniquely identifies each record.\n```\n\nColor variants:\n```html\n<span class=\"highlight-green\">correct approach</span>\n<span class=\"highlight-red\">incorrect approach</span>\n```\n\n#### **\u2713/\u2717 Comparison Markers**\nUse in tables for feature comparisons:\n```html\n<span class=\"yes\">\u2713</span> or <span class=\"no\">\u2717</span>\n```\n\n#### **\ud83d\udcd6 Definition Lists**\nUse for term-definition pairs:\n```html\n<dl>\n<dt>Transaction</dt>\n<dd>A single unit of work that must complete entirely or not at all.</dd>\n<dt>ACID</dt>\n<dd>Atomicity, Consistency, Isolation, Durability.</dd>\n</dl>\n```\n\n#### **\ud83d\udcac Blockquotes**\nUse for formal definitions or important quotes:\n```markdown\n> \"A business model describes the rationale of how an organization creates, delivers, and captures value.\"\n> \u2014 Osterwalder & Pigneur\n```\n\n---\n\n### **FEATURE USAGE GUIDELINES**\n\n| Guideline | Rule |\n|-----------|------|\n| **Tables** | Use when comparing \u22652 items on \u22652 criteria |\n| **Callouts** | Maximum 1 per card; place at end of answer |\n| **Hints** | Only for cards with difficult recall; place on Front |\n| **Code** | Only for technical/programming content |\n| **Highlights** | Maximum 2 per card; key terms only |\n| **Badges** | Only for deck-wide categorization systems |\n\n---\n\n### **Card Object Specification**\n\nEach object in the `cards` list requires:\n\n*   **`uid` (Required, String):** A **unique** identifier.\n*   **`fields` (Required, Dictionary):**\n    *   Keys must be `\"Front\"` and `\"Back\"`.\n    *   Values **MUST** use Markdown/HTML according to the rules above. Use the `|` literal block scalar for multi-line content.\n*   **`tags` (Required, List of Strings):** Include relevant tags, including one for the lecture (e.g., `VL1`), the main concept, and the source slide (e.g., `Slide_12-14`).\n*   **`reverse` (Optional, Boolean):** Set to `true` to generate a reversed card (Back\u2192Front). Use ONLY when both directions form valid questions.\n\n---\n\n### **Reverse Cards: When and How**\n\n**When to use `reverse: true`:**\n- Term \u2194 Definition pairs\n- Acronym \u2194 Full name\n- Symbol \u2194 Meaning\n- Formula \u2194 Name\n- Foreign term \u2194 Translation\n\n**When NOT to use reverse:**\n- Lists or enumerations\n- \"Explain...\" or \"Describe...\" questions  \n- Compare/contrast questions\n- Process or step-based questions\n\n**Critical:** For reverse cards, write Front and Back so BOTH directions make sense as questions.\n\n```yaml\n# \u2705 GOOD - Both directions work\n- uid: \"a1b2-c3d4-e5f6\"\n  reverse: true\n  fields:\n    Front: |\n      `API`\n    Back: |\n      **Application Programming Interface**\n  tags: [\"Acronym\"]\n\n# \u274c BAD - Reversed direction makes no sense  \n- uid: \"x1y2-z3a4-b5c6\"\n  reverse: true  # DON'T DO THIS\n  fields:\n    Front: |\n      What are the **three pillars** of OOP?\n    Back: |\n      1. Encapsulation\n      2. Inheritance  \n      3. Polymorphism\n  tags: [\"OOP\"]\n```\n\n---\n\n### **Complete Examples**\n\n```yaml\ndeck: \"Management der Informationssysteme::VL 2 - Gesch\u00e4ftsmodelle\"\ncards:\n  # Example 1: Card with comparison table\n  - model: \"Anki Automation\"\n    uid: \"a1b2-c3d4-e5f6\"\n    fields:\n      Front: |\n        Vergleichen Sie die E-Commerce-Modelle **B2C**, **B2B** und **C2C**.\n      Back: |\n        | Modell | Beschreibung | Beispiel |\n        |--------|--------------|----------|\n        | **B2C** | Business-to-Consumer: Verkauf an Endverbraucher | Amazon, Zalando |\n        | **B2B** | Business-to-Business: Handel zwischen Unternehmen | SAP Ariba, Mercateo |\n        | **C2C** | Consumer-to-Consumer: Privatpersonen handeln untereinander | eBay, Kleinanzeigen |\n    tags: [\"VL2\", \"E-Commerce\", \"Vergleich\", \"Slide_8-10\"]\n\n  # Example 2: Card with hint and tip callout\n  - model: \"Anki Automation\"\n    uid: \"g7h8-i9j0-k1l2\"\n    fields:\n      Front: |\n        Was sind die **drei Hauptkomponenten** eines Gesch\u00e4ftsmodells?\n\n        Hint: <span class=\"spoiler\">VVE</span>\n      Back: |\n        1.  **Value Proposition:** Welchen Nutzen stiftet das Unternehmen?\n        2.  **Value Creation & Delivery:** Wie wird dieser Nutzen erzeugt und geliefert?\n        3.  **Ertragsmodell (Value Capture):** Wie verdient das Unternehmen Geld?\n\n        <div class=\"callout tip\">\n        <strong>\ud83d\udca1 Merkhilfe:</strong> VVE = Value, Value, Ertrag\n        </div>\n    tags: [\"VL2\", \"Gesch\u00e4ftsmodell\", \"Definition\", \"Slide_4-5\"]\n\n  # Example 3: Card with warning callout\n  - model: \"Anki Automation\"\n    uid: \"m3n4-o5p6-q7r8\"\n    fields:\n      Front: |\n        Was ist der Unterschied zwischen einem **Plattform-Gesch\u00e4ftsmodell** und einem **Pipeline-Gesch\u00e4ftsmodell**?\n      Back: |\n        *   **Pipeline:** Lineare Wertsch\u00f6pfung. Das Unternehmen produziert selbst Wert und verkauft ihn an Kunden (z.B. traditionelle Fertigung).\n\n        *   **Plattform:** Vermittlung von Wertaustausch. Das Unternehmen erm\u00f6glicht Interaktionen zwischen verschiedenen Nutzergruppen (z.B. Uber, Airbnb).\n\n        <div class=\"callout warning\">\n        <strong>\u26a0\ufe0f Klausurfalle:</strong> Eine Plattform muss nicht selbst produzieren \u2013 sie orchestriert!\n        </div>\n    tags: [\"VL2\", \"Gesch\u00e4ftsmodell\", \"Plattform\", \"Pipeline\", \"Slide_16-17\"]\n\n  # Example 4: Reverse card for acronym (both directions tested)\n  - model: \"Anki Automation\"\n    uid: \"s9t0-u1v2-w3x4\"\n    reverse: true\n    fields:\n      Front: |\n        `SaaS`\n      Back: |\n        **Software as a Service**\n    tags: [\"VL2\", \"Cloud\", \"Acronym\", \"Slide_18\"]\n\n  # Example 5: Difficult definition with expandable hint (NO reverse - explanation card)\n  - model: \"Anki Automation\"\n    uid: \"y5z6-a7b8-c9d0\"\n    fields:\n      Front: |\n        Was beschreibt die **Long-Tail-Strategie** und welche Voraussetzungen ben\u00f6tigt sie?\n\n        <details class=\"spoiler-block\">\n        <summary>\ud83d\udca1 Hint: Click to reveal</summary>\n        Denken Sie an das Gegenteil der 80/20-Regel: Statt wenige Bestseller, viele Nischenprodukte.\n        </details>\n      Back: |\n        **Long-Tail-Strategie:** Gewinn durch eine gro\u00dfe Anzahl von Nischenprodukten, die einzeln wenig, aber in Summe viel Umsatz generieren.\n\n        **Voraussetzungen:**\n\n        *   Zentralisierte Lagerhaltung\n        *   Niedrige Lagerkosten\n        *   Effiziente Logistik\n        *   Starke Suchfunktion/Empfehlungssysteme\n\n        <div class=\"callout tip\">\n        <strong>\ud83d\udca1 Beispiel:</strong> Amazon verdient mehr mit Millionen seltener B\u00fccher als mit wenigen Bestsellern.\n        </div>\n    tags: [\"VL2\", \"Long-Tail\", \"Strategie\", \"Slide_12-14\"]\n```\n\n---\n\n**Begin generation now.**\n",
        "number": 3,
        "subject": "Basic"
      },
      "4": {
        "success": true,
        "content": "Great, proceed with the next at most 10 cards from the blueprint. Continue using the same formatting features (tables, callouts, hints) as planned. If there are none left to generate, say so.",
        "number": 4,
        "subject": "Basic"
      },
      "5": {
        "success": true,
        "content": "Excellent. We will now restart the entire process for a new lecture.\n\nYou are now being reset to the Anki Blueprint Generation phase. Your task is to analyze the brand-new lecture materials provided below and create an Anki Blueprint.\n\n**Prime Directive:**\nYou are to follow **exactly the same method and principles** that were successfully used for the previous lecture. You must maintain the established strategy regarding:\n- The level of detail and target number of cards (e.g., adhering to the \"Max 25 Cards\" rule and its consolidation strategies)\n- The **purposeful use of formatting features** (tables, callouts, hints) as specified in the Enhancement Plan guidelines\n- Apply this logic automatically without me needing to specify it again\n\n**Feature Consistency:**\nWhen planning cards for this new lecture, follow the same feature conventions:\n- Tables for comparisons (2+ items, 2+ criteria)\n- Hints for difficult recall cards\n- Callouts for tips (green), warnings (amber), info (blue), errors (red)\n- Apply features only when they genuinely enhance learning\n\n---\n\n**New Lecture Materials:**\n*   **Lecture Slides**\n\n---\n\n**Final Instruction:**\nPlease analyze the new materials and generate the Anki Blueprint based on the previously established rules, including an Enhancement Plan for each topic. I will review the blueprint before we proceed to the YAML generation phase.",
        "number": 5,
        "subject": "Basic"
      }
    },
    "Enhanced": {
      "1": {
        "success": true,
        "content": "You are to assume the role of an expert academic assistant and study partner. Your designated name for this role is **`Anki-Architect`**. Your sole purpose is to help me, a university student, study for my exams by creating perfect, high-yield Anki flashcards from my course materials.\n\nOur collaboration will follow a structured, multi-phase process for each lecture I provide.\n\n**Phase 1: The \"Anki Blueprint\" (Your Immediate Task)**\n\n1.  **Acknowledge and Wait:** After I give you this Master Prompt, you will simply acknowledge it and wait. I will then provide you with the materials for a specific lecture: a PDF file of the slides and a raw text transcript of the professor's spoken words. I may also provide mock exam questions or a list of key topics for the final exam to help you focus.\n\n2.  **Analyze and Plan:** Once you receive the materials, your first and only task for this phase is to conduct a thorough analysis and produce a structured **\"Anki Blueprint.\"** This blueprint is a strategic plan for creating the flashcards. It must NOT contain the final flashcard content itself.\n\n3.  **Blueprint Requirements:** Your Anki Blueprint must be structured as a detailed, hierarchical list. For each major topic or concept in the lecture, you must:\n    *   **Identify the Core Idea:** State the main headline or concept (e.g., \"Porter's Five Forces,\" \"Definition of an Information System,\" \"Turing Machine Halting Problem\").\n    *   **Pinpoint the Source:** Provide precise references to where this information is located in the provided materials. The primary reference should always be the slides (e.g., `VL 01, Slides 14-16`). The transcript should only be referenced if it provides critical clarification, examples, or information not present on the slides. When referencing the transcript, quote the first few words of the relevant sentence for easy lookup (e.g., `Transcript, starting: \"Now, it's crucial to remember that...\"`).\n    *   **Estimate Card Count:** Provide a specific number of recommended Anki cards for that topic. For example, if a slide lists 5 key characteristics of a concept, you should recommend 5 cards, not just one.\n    *   **Outline Card Content:** Briefly sketch out what each card or group of cards should cover. For example: \"One card for the definition, one card for each of the three components, and one card explaining the main advantage.\"\n    *   **Identify Visuals:** If a slide contains a particularly important diagram, chart, or visual model, note this in the blueprint (e.g., `Note: Slide 22 has a key diagram of the client-server model that should be screenshotted for the card.`).\n    *   **Plan Rich Enhancements:** Proactively identify opportunities for visual and interactive features:\n        *   Tables for ALL comparisons (even 2-item comparisons benefit from structure)\n        *   Hints for definitions and recall-heavy cards\n        *   Tips for mnemonics and memory aids\n        *   Warnings for common exam mistakes\n        *   Color-coded highlights for key terms\n        *   Badges for difficulty/topic categorization\n\n**Phase 2: Anki Card Generation (To Be Initiated by Me Later)**\n\nAfter you have delivered the Anki Blueprint, I will review it. I will then send a *second, highly specific prompt* that instructs you on the exact YAML format and full feature syntax for generating the cards. You will then generate a maximum of 10 cards at a time, based on the blueprint, until all planned cards for the lecture are complete. Do not begin this phase until I explicitly prompt you for it.\n\n**Guiding Principles for Your Analysis:**\n\n*   **Exam-Oriented Focus:** Always prioritize content that is likely to be on an exam. Definitions, enumerations (lists), comparisons, process steps, and foundational concepts are more important than anecdotal stories or minor details. Use any mock exam questions I provide as your primary guide for what is essential.\n*   **Language Adaptation:** You must automatically detect the primary language of the lecture slides (German or English) and conduct your entire analysis and all subsequent card generation in that language.\n*   **The \"One Thing\" Rule:** Your card estimations should be guided by the principle that a great flashcard tests exactly one piece of information.\n*   **Maximize Engagement:** Use all available formatting features to create visually engaging, memorable cards that leverage multiple learning channels.\n\nTo begin, please confirm you have understood these instructions by responding with: **\"Anki-Architect protocol initiated. Ready to receive phase 2 prompt and lecture materials.\"** Do not say anything else.\n",
        "number": 1,
        "subject": "Enhanced"
      },
      "2": {
        "success": true,
        "content": "Phase 2 (25 Cards per Day): Content Analysis & **Feature-Rich** Blueprint Generation. Your task is to analyze the provided lecture materials for **[Insert Course Name] - Lecture [Insert Lecture Number or Topic]**, the conversation with the student about said material and lessons learned from that and create a high-yield, visually engaging \"Anki Blueprint.\"\n\n**Provided Materials:**\nYou are being given access to the following files:\n1.  **Lecture Slides**\n\n---\n\n**Prime Directive: The Principle of Surgical Consolidation**\n\nYour absolute primary goal is to design a blueprint that results in **a maximum of 25 Anki cards** for the entire lecture. This is a hard constraint. To achieve this, you might need to shift your strategy from granular detail to high-level synthesis for certain aspects. Your success on this task will be measured by your ability to create a powerful and comprehensive study set *within this limit*.\n\nThis does **not** mean making every card simplistic. It means adopting a **surgical approach**. Your goal is to preserve high-detail, high-quality cards for core, examinable knowledge while efficiently grouping or summarizing less critical, supporting information.\n\nTo achieve this balance, you must follow this hierarchy:\n\n1.  **Protect the Core (Keep Detailed):** Prioritize detailed, atomic, and high-quality cards for the most important information. This includes:\n    *   **Formal Definitions** of key terms (e.g., \"What is a transaction system?\").\n    *   **Core Frameworks and Models** (e.g., Porter's Five Forces, Technology Acceptance Model).\n    *   **Fundamental Principles** or theories.\n    *   **Crucial Distinctions** between two or more concepts (e.g., Data vs. Information).\n\n2.  **Consolidate the Support (Group & Summarize):** Apply high-level synthesis and grouping strategies primarily to secondary or illustrative information. This is where you will save space to meet the 25-card limit. This includes:\n    *   **Lists of Examples:** Instead of one card per example, create one card asking for \"3 key examples of B2C business models.\"\n    *   **Enumerations of Features/Characteristics:** Instead of one card per feature, create one card asking \"What are the main characteristics of a transformation system?\"\n    *   **Redundant Explanations:** If multiple slides explain the same concept with different visuals, create a single card that captures the central idea.\n\n**Your Consolidation Toolkit:**\n\n*   **To group lists:** Use questions like \"List the 4 components of...\"\n*   **To summarize concepts:** Use questions like \"Explain the core idea of the Long-Tail-Strategie.\"\n*   **To capture comparisons:** Use \"Compare and contrast X and Y based on [criteria].\"\n*   **To handle case studies/examples:** Use \"What is the key takeaway from the [Company] example regarding [Concept]?\"\n\n---\n\n### **Core Philosophical Shift: Strategic Violation of the Atomic Principle**\n\nNormally, Anki cards should be \"atomic\" (one fact per card). For this task, you **MUST** strategically violate this principle. Your goal is not to capture every single detail, but to create cards that summarize key concepts, group related information, and test the connections between ideas.\n\n**Your Consolidation Strategies MUST Include:**\n\n1.  **Grouping Lists & Enumerations:** Instead of creating a separate card for each item in a list (e.g., \"Porter's 5 Forces\"), create **one single card** that asks for the entire list.\n2.  **Synthesizing Concepts:** Instead of defining two related concepts on separate cards, create **one card** that asks to \"Compare and Contrast\" them.\n3.  **Creating High-Level Questions:** Instead of making cards for minor details on a slide, create one card that asks for the main takeaway. For example: \"What is the central argument of the 'Transaction vs. Transformation Systems' slide?\"\n4.  **Combining Definitions:** If a slide defines several closely related terms, group them on the back of a single card.\n\n---\n\n### **Enhanced Learning Features: Maximize Engagement**\n\nYour cards support rich formatting. You should **actively use these features** to create memorable, visually engaging cards that leverage multiple learning channels.\n\n**Feature Usage Guide - Use Liberally:**\n\n| Feature | When to Use | Target Frequency |\n|---------|-------------|------------------|\n| **Tables** | ANY comparison (even 2 items); structured data; feature lists | 30-40% of cards |\n| **Callout: Tip** (green) | Memory aids, mnemonics, study shortcuts | Every 2-3 cards |\n| **Callout: Warning** (amber) | Common mistakes, exam pitfalls, misconceptions | For tricky topics |\n| **Callout: Info** (blue) | Additional context, historical notes, examples | Supplementary info |\n| **Callout: Error** (red) | Critical errors, absolute prohibitions | Rare but impactful |\n| **Hint (Spoiler)** | ALL definition cards; recall-heavy cards | 40-50% of cards |\n| **Highlights** | 2-3 key terms per card | Most cards |\n| **Badges** | Topic/difficulty categorization | Consider for deck |\n| **Code blocks** | Technical terms, formulas, commands | When relevant |\n| **Definition Lists** | Multiple related terms | Term-heavy topics |\n\n**Feature Planning Mandate:** In your blueprint, you MUST specify at least 2-3 enhancement features for each card topic. This ensures visually rich, engaging cards.\n\n---\n\n### **Reverse Cards: Bidirectional Learning**\n\nSome cards benefit from being tested in **both directions**. Actively identify these opportunities:\n\n| Use Reverse (`reverse: true`) | Don't Use Reverse |\n|-------------------------------|-------------------|\n| **Term \u2194 Definition** | Explanatory questions (\"Why/How...\") |\n| **Acronym \u2194 Full name** | Lists or enumerations |\n| **Symbol \u2194 Meaning** | Compare/contrast questions |\n| **Formula \u2194 Name** | Process or step-based questions |\n| **Foreign term \u2194 Translation** | \"Explain...\" or \"Describe...\" questions |\n\n**Critical Rule:** Both directions must form valid, natural questions. The Front and Back must be **symmetrically meaningful**.\n\nIn your Enhancement Plan, mark applicable cards with **`(Reverse: Yes)`** and ensure the content is worded for bidirectional testing.\n\n---\n\n### **Blueprint Requirements**\n\nGenerate a structured list that outlines the key information with comprehensive feature planning.\n\n**Structure for each item in the Blueprint:**\n\n1.  **Topic/Concept Headline:** A clear title for the consolidated information block.\n2.  **Source Reference:** Cite the exact slide number(s): `(VL [Lecture Number] Slide X-Y)`.\n3.  **Content Sketch & Rationale:** Describe the **consolidated** information to be captured. Explicitly state *how* you are grouping the concepts to save space.\n4.  **Enhancement Plan (REQUIRED):** List ALL formatting features to use:\n    *   Primary format (table, list, definition list)\n    *   Hint type (inline spoiler or expandable)\n    *   Callout type if applicable\n    *   Highlight targets (which terms)\n5.  **Recommended Card Count:** Provide the number of cards for this consolidated topic.\n\n---\n\n### **Example of a Perfect *Enhanced* Blueprint Output:**\n\n**Anki Blueprint: Management der Informationssysteme (VL 2: Gesch\u00e4ftsmodelle im E-Commerce)**\n\n*   **1. Core Definition of a Business Model and its Components**\n    *   **Reference:** `(VL 2 Slide 4-5)`\n    *   **Content Sketch:** This will be a single, high-level card. The front will ask for the definition of a business model. The back will provide the formal definition and then list its three core components.\n    *   **Enhancement Plan:**\n        *   Format: Numbered list for components\n        *   Hint: Inline spoiler \"VVE\" on front\n        *   Callout: Green Tip with mnemonic explanation\n        *   Highlights: \"Value Proposition\", \"Value Creation\", \"Ertragsmodell\"\n    *   **Recommended Cards:** 1\n\n*   **2. Comparison of B2C, B2B, and C2C E-Commerce Models**\n    *   **Reference:** `(VL 2 Slide 8-10)`\n    *   **Content Sketch:** A single comparison card covering all three models with definitions and examples.\n    *   **Enhancement Plan:**\n        *   Format: Comparison table (Model | Description | Example)\n        *   Callout: Blue Info with real-world context\n        *   Highlights: Model names in table headers\n        *   Badge consideration: \"Core Concept\"\n    *   **Recommended Cards:** 1\n\n*   **3. The Long-Tail-Strategie: Core Concept and Preconditions**\n    *   **Reference:** `(VL 2 Slide 12-14)`\n    *   **Content Sketch:** Comprehensive card covering definition and prerequisites.\n    *   **Enhancement Plan:**\n        *   Format: Bullet list for preconditions\n        *   Hint: Expandable spoiler with detailed hint about 80/20 rule\n        *   Callout: Green Tip with Amazon example\n        *   Highlights: \"Long-Tail\", \"Nischenprodukte\"\n    *   **Recommended Cards:** 1\n\n*   **4. Platform vs. Pipeline Business Models**\n    *   **Reference:** `(VL 2 Slide 16-17)`\n    *   **Content Sketch:** Comparison of two business model types.\n    *   **Enhancement Plan:**\n        *   Format: Two-column comparison table\n        *   Callout: Amber Warning about exam trap (confusing orchestration vs. production)\n        *   Checkmark/Cross markers for key distinctions\n        *   Highlights: \"Plattform\", \"Pipeline\", \"orchestriert\"\n    *   **Recommended Cards:** 1\n\n*   **5. Cloud Service Model: SaaS**\n    *   **Reference:** `(VL 2 Slide 18)`\n    *   **Content Sketch:** Single acronym card optimized for bidirectional learning.\n    *   **Enhancement Plan:**\n        *   Code formatting for acronym\n        *   Clean Front/Back for reversal\n        *   **(Reverse: Yes)** - acronym \u2194 full name is perfect for bidirectional testing\n    *   **Recommended Cards:** 1 (generates 2 cards with reverse)\n\n---\n\n**Final Instruction:**\nYour primary objective is to create an efficient and powerful Anki Blueprint that **does not exceed 25 total recommended cards** while **maximizing visual engagement** through rich formatting features. Every card should have a detailed Enhancement Plan. I will review the blueprint before you generate the cards.\n",
        "number": 2,
        "subject": "Enhanced"
      },
      "3": {
        "success": true,
        "content": "Phase 3: Anki Card Generation.\n\nThe Anki Blueprint you generated is approved. You will now generate **feature-rich, visually engaging** Anki cards as planned, implementing ALL enhancement features specified in your blueprint.\n\n**Command:**\nProceed with generating the cards.\n\nYour entire output must be a single YAML code block. Adherence to this protocol is paramount, as a script will parse your output directly. Do not include any conversational text, acknowledgements, or summaries.\n\n---\n\n### **YAML Format Specification**\n\n*   **`deck` (String):** The Anki deck name (`Course Name::Lecture Number`).\n*   **`model` (Required, String):** Always use `\"Anki Automation\"`.\n*   **`cards` (Required, List of Objects):** A list of card data objects.\n\n---\n\n### **CRITICAL Rules & Requirements**\n\n#### **1. UID Uniqueness**\nEvery card object **MUST** have a unique `uid` in the format `xxxx-xxxx-xxxx`. Never repeat a `uid`.\n\n#### **2. Core Formatting Requirements**\nYou **MUST** use Markdown and HTML as specified. Adherence to the following rules is essential for the cards to render correctly.\n\n*   **Lists:**\n    *   Use standard Markdown for unordered lists (`*` or `-`) and ordered lists (`1.`, `2.`).\n    *   Nested lists are fully supported and should be properly indented.\n    *   **CRITICAL:** A list **MUST** be separated from any preceding text by a blank line. Failure to do so will break the list formatting.\n\n*   **Tables:** Use **GitHub Flavored Markdown (GFM) syntax**. This is the only supported method for tables.\n\n*   **Formulas (LaTeX):** This is a standalone format and has strict rules.\n    *   **Inline Formulas:** Use `\\( ... \\)` for formulas within a line of text.\n    *   **Block Formulas:** Use `\\[ ... \\]` for formulas on their own centered line.\n    *   **CRITICAL FORBIDDEN RULE:** **NEVER** wrap LaTeX formulas in backticks (`` ` ``).\n    *   **CRITICAL FORBIDDEN SYNTAX:** You **MUST NOT** use single dollar signs (`$...$`) for inline math.\n\n---\n\n### **COMPLETE FEATURE SYNTAX REFERENCE**\n\nImplement ALL features from your Enhancement Plan. Use these features liberally to create engaging, memorable cards.\n\n---\n\n#### **\ud83d\udcca Tables (Use Frequently)**\nUse for ANY comparison\u2014even two items benefit from tabular structure.\n\n```markdown\n| Criterion | Option A | Option B |\n|-----------|----------|----------|\n| Speed     | Fast     | Slow     |\n| Cost      | High     | Low      |\n```\n\n**With checkmarks for feature comparisons:**\n```markdown\n| Feature | System A | System B |\n|---------|----------|----------|\n| Real-time | <span class=\"yes\">\u2713</span> | <span class=\"no\">\u2717</span> |\n| Scalable | <span class=\"yes\">\u2713</span> | <span class=\"yes\">\u2713</span> |\n```\n\n---\n\n#### **\ud83d\udca1 Callout Boxes (Use on Most Cards)**\nEach callout type has a specific semantic meaning:\n\n**Tip (Green)** - Memory aids, mnemonics, shortcuts:\n```html\n<div class=\"callout tip\">\n<strong>\ud83d\udca1 Merkhilfe:</strong> VVE = Value, Value, Ertrag. Drei Vs f\u00fcr drei Komponenten!\n</div>\n```\n\n**Warning (Amber)** - Common mistakes, exam pitfalls:\n```html\n<div class=\"callout warning\">\n<strong>\u26a0\ufe0f Klausurfalle:</strong> Plattformen produzieren nicht selbst \u2013 sie orchestrieren nur!\n</div>\n```\n\n**Info (Blue)** - Additional context, examples, history:\n```html\n<div class=\"callout info\">\n<strong>\u2139\ufe0f Beispiel:</strong> Amazon, Netflix und Spotify nutzen alle die Long-Tail-Strategie.\n</div>\n```\n\n**Error (Red)** - Critical mistakes to avoid:\n```html\n<div class=\"callout error\">\n<strong>\u274c Kritisch:</strong> NIEMALS diese Formel auf nicht-lineare Systeme anwenden!\n</div>\n```\n\n---\n\n#### **\ud83d\udd0d Hints (Use on 40-50% of Cards)**\nAlways format as \"Hint:\" followed by spoiler. Use generously for recall support.\n\n**Inline hint** (hover to reveal) - for short hints:\n```html\nHint: <span class=\"spoiler\">Anfangsbuchstabe \"P\" wie Prozess</span>\n```\n\n**Block hint** (click to expand) - for detailed hints:\n```html\n<details class=\"spoiler-block\">\n<summary>\ud83d\udca1 Hint: Click to reveal</summary>\nDenken Sie an die drei Phasen: Eingabe \u2192 Verarbeitung \u2192 Ausgabe. \nDas Akronym EVA hilft beim Merken!\n</details>\n```\n\n---\n\n#### **\u2728 Highlights (Use 2-3 per Card)**\nMark key terms to draw attention. Use color coding meaningfully.\n\n**Default yellow** - key terms:\n```html\nThe <mark>primary key</mark> uniquely identifies each record.\n```\n\n**Green highlight** - correct/positive:\n```html\n<span class=\"highlight-green\">Best Practice</span>\n```\n\n**Red highlight** - incorrect/negative:\n```html\n<span class=\"highlight-red\">Anti-Pattern</span>\n```\n\n**Cyan highlight** - technical terms:\n```html\n<span class=\"highlight-cyan\">REST API</span>\n```\n\n---\n\n#### **\ud83c\udff7\ufe0f Badges (Use for Categorization)**\nAdd visual categorization for large decks:\n\n```html\n<span class=\"badge badge-cyan\">Core Concept</span>\n<span class=\"badge badge-blue\">Fundamentals</span>\n<span class=\"badge badge-green\">Easy</span>\n<span class=\"badge badge-amber\">Medium</span>\n<span class=\"badge badge-red\">Hard</span>\n<span class=\"badge badge-purple\">Advanced</span>\n<span class=\"badge badge-gray\">Optional</span>\n```\n\n---\n\n#### **\u2328\ufe0f Keyboard Keys**\nFor shortcuts and commands:\n```html\nPress <kbd>Ctrl</kbd> + <kbd>S</kbd> to save.\n```\n\n---\n\n#### **\ud83d\udcdd Code Formatting**\n**Inline code** - for technical terms:\n```markdown\nThe `HTTP` protocol uses `GET` and `POST` methods.\n```\n\n**Code blocks** - for multi-line code:\n````markdown\n```python\ndef calculate_roi(gain, cost):\n    return (gain - cost) / cost\n```\n````\n\n---\n\n#### **\ud83d\udcd6 Definition Lists**\nPerfect for multiple related terms:\n```html\n<dl>\n<dt>SaaS</dt>\n<dd><strong>Software as a Service</strong> \u2013 Anwendungen \u00fcber Internet (z.B. Google Docs)</dd>\n<dt>PaaS</dt>\n<dd><strong>Platform as a Service</strong> \u2013 Entwicklungsplattformen (z.B. Heroku)</dd>\n<dt>IaaS</dt>\n<dd><strong>Infrastructure as a Service</strong> \u2013 Virtuelle Server (z.B. AWS EC2)</dd>\n</dl>\n```\n\n---\n\n#### **\ud83d\udcac Blockquotes**\nFor formal definitions or important quotes:\n```markdown\n> \"Ein Gesch\u00e4ftsmodell beschreibt die Grundlogik, wie eine Organisation Werte schafft, vermittelt und erfasst.\"\n> \u2014 Osterwalder & Pigneur\n```\n\n---\n\n### **FEATURE USAGE TARGETS**\n\n| Feature | Target Usage |\n|---------|--------------|\n| **Tables** | 30-40% of cards |\n| **Callouts** | 1 per card average |\n| **Hints** | 40-50% of cards (on Front) |\n| **Highlights** | 2-3 per card |\n| **Code** | When technical content present |\n\n---\n\n### **Card Object Specification**\n\nEach object in the `cards` list requires:\n\n*   **`uid` (Required, String):** A **unique** identifier.\n*   **`fields` (Required, Dictionary):**\n    *   Keys must be `\"Front\"` and `\"Back\"`.\n    *   Values **MUST** use Markdown/HTML according to the rules above. Use the `|` literal block scalar for multi-line content.\n*   **`tags` (Required, List of Strings):** Include relevant tags, including one for the lecture (e.g., `VL1`), the main concept, and the source slide (e.g., `Slide_12-14`).\n*   **`reverse` (Optional, Boolean):** Set to `true` to generate a reversed card (Back\u2192Front). Use for term\u2194definition, acronym\u2194name, symbol\u2194meaning pairs.\n\n---\n\n### **Reverse Cards: Maximizing Bidirectional Learning**\n\nActively use `reverse: true` for cards where both directions provide learning value:\n\n**When to use `reverse: true`:**\n- Term \u2194 Definition pairs\n- Acronym \u2194 Full name\n- Symbol \u2194 Meaning\n- Formula \u2194 Name\n- Foreign term \u2194 Translation\n\n**When NOT to use reverse:**\n- Lists or enumerations\n- \"Explain...\" or \"Describe...\" questions\n- Compare/contrast questions\n- Cards with hints/callouts (keep these one-directional)\n\n**For reverse cards:** Keep Front and Back clean and symmetric. Avoid callouts and complex formatting that only makes sense in one direction.\n\n```yaml\n# \u2705 Perfect reverse card\n- uid: \"a1b2-c3d4-e5f6\"\n  reverse: true\n  fields:\n    Front: |\n      `API`\n    Back: |\n      **Application Programming Interface**\n  tags: [\"Acronym\"]\n```\n\n---\n\n### **Complete Feature-Rich Examples**\n\n```yaml\ndeck: \"Management der Informationssysteme::VL 2 - Gesch\u00e4ftsmodelle\"\ncards:\n  # Example 1: Definition card with hint, highlights, and tip callout\n  - model: \"Anki Automation\"\n    uid: \"a1b2-c3d4-e5f6\"\n    fields:\n      Front: |\n        <span class=\"badge badge-cyan\">Core Concept</span>\n\n        Was sind die **drei Hauptkomponenten** eines <mark>Gesch\u00e4ftsmodells</mark>?\n\n        Hint: <span class=\"spoiler\">VVE</span>\n      Back: |\n        1.  **<span class=\"highlight-cyan\">Value Proposition</span>:** Welchen Nutzen stiftet das Unternehmen?\n        2.  **<span class=\"highlight-cyan\">Value Creation & Delivery</span>:** Wie wird dieser Nutzen erzeugt und geliefert?\n        3.  **<span class=\"highlight-cyan\">Ertragsmodell (Value Capture)</span>:** Wie verdient das Unternehmen Geld?\n\n        <div class=\"callout tip\">\n        <strong>\ud83d\udca1 Merkhilfe:</strong> VVE = <strong>V</strong>alue, <strong>V</strong>alue, <strong>E</strong>rtrag. Drei Vs f\u00fcr drei Komponenten!\n        </div>\n    tags: [\"VL2\", \"Gesch\u00e4ftsmodell\", \"Definition\", \"Core\", \"Slide_4-5\"]\n\n  # Example 2: Comparison with table, info callout, and highlights\n  - model: \"Anki Automation\"\n    uid: \"g7h8-i9j0-k1l2\"\n    fields:\n      Front: |\n        Vergleichen Sie die E-Commerce-Modelle **B2C**, **B2B** und **C2C**.\n      Back: |\n        | Modell | Beschreibung | Beispiel |\n        |--------|--------------|----------|\n        | **<mark>B2C</mark>** | Business-to-Consumer: Verkauf an Endverbraucher | Amazon, Zalando |\n        | **<mark>B2B</mark>** | Business-to-Business: Handel zwischen Unternehmen | SAP Ariba, Mercateo |\n        | **<mark>C2C</mark>** | Consumer-to-Consumer: Privatpersonen handeln untereinander | eBay, Kleinanzeigen |\n\n        <div class=\"callout info\">\n        <strong>\u2139\ufe0f Kontext:</strong> Der E-Commerce-Markt wird von B2C dominiert (Amazon), aber B2B hat das h\u00f6chste Transaktionsvolumen.\n        </div>\n    tags: [\"VL2\", \"E-Commerce\", \"Vergleich\", \"Slide_8-10\"]\n\n  # Example 3: Card with warning callout and expandable hint\n  - model: \"Anki Automation\"\n    uid: \"m3n4-o5p6-q7r8\"\n    fields:\n      Front: |\n        Was ist der Unterschied zwischen einem **<mark>Plattform-Gesch\u00e4ftsmodell</mark>** und einem **<mark>Pipeline-Gesch\u00e4ftsmodell</mark>**?\n\n        <details class=\"spoiler-block\">\n        <summary>\ud83d\udca1 Hint: Click to reveal</summary>\n        Denken Sie an: Wer <strong>produziert</strong> den Wert? Pipeline = selbst. Plattform = andere.\n        </details>\n      Back: |\n        | Aspekt | Pipeline | Plattform |\n        |--------|----------|-----------|\n        | **Wertsch\u00f6pfung** | Linear, eigene Produktion | Vermittlung zwischen Gruppen |\n        | **Rolle** | Produzent | Orchestrator |\n        | **Beispiel** | Traditionelle Fertigung | Uber, Airbnb, Amazon Marketplace |\n\n        <div class=\"callout warning\">\n        <strong>\u26a0\ufe0f Klausurfalle:</strong> Eine <span class=\"highlight-red\">Plattform muss nicht selbst produzieren</span> \u2013 sie orchestriert den Wertaustausch zwischen Nutzern!\n        </div>\n    tags: [\"VL2\", \"Gesch\u00e4ftsmodell\", \"Plattform\", \"Pipeline\", \"Slide_16-17\"]\n\n  # Example 4: Definition list for cloud models\n  - model: \"Anki Automation\"\n    uid: \"s9t0-u1v2-w3x4\"\n    fields:\n      Front: |\n        <span class=\"badge badge-purple\">Technical</span>\n\n        Erkl\u00e4ren Sie die drei Cloud-Service-Modelle: `SaaS`, `PaaS`, `IaaS`\n\n        Hint: <span class=\"spoiler\">Von oben nach unten: Software \u2192 Platform \u2192 Infrastructure</span>\n      Back: |\n        <dl>\n        <dt><code>SaaS</code> \u2013 Software as a Service</dt>\n        <dd>Anwendungssoftware \u00fcber Internet bereitgestellt. <em>Beispiele: Google Docs, Salesforce, Microsoft 365</em></dd>\n        <dt><code>PaaS</code> \u2013 Platform as a Service</dt>\n        <dd>Entwicklungs- und Deployment-Plattformen. <em>Beispiele: Heroku, Google App Engine</em></dd>\n        <dt><code>IaaS</code> \u2013 Infrastructure as a Service</dt>\n        <dd>Virtuelle Server und Speicher. <em>Beispiele: AWS EC2, Azure VMs</em></dd>\n        </dl>\n\n        <div class=\"callout tip\">\n        <strong>\ud83d\udca1 Merkhilfe:</strong> Je h\u00f6her im Stack (SaaS), desto mehr wird vom Anbieter verwaltet!\n        </div>\n    tags: [\"VL2\", \"Cloud\", \"SaaS\", \"PaaS\", \"IaaS\", \"Slide_18-22\"]\n\n  # Example 5: Reverse card for acronym (clean, symmetric for bidirectional)\n  - model: \"Anki Automation\"\n    uid: \"r1s2-t3u4-v5w6\"\n    reverse: true\n    fields:\n      Front: |\n        `REST`\n      Back: |\n        **Representational State Transfer**\n    tags: [\"VL2\", \"API\", \"Acronym\", \"Slide_24\"]\n  # Example 6: Complex card with multiple features (NO reverse - explanation card)\n  - model: \"Anki Automation\"\n    uid: \"y5z6-a7b8-c9d0\"\n    fields:\n      Front: |\n        Was beschreibt die **<mark>Long-Tail-Strategie</mark>** und welche Voraussetzungen ben\u00f6tigt sie?\n\n        <details class=\"spoiler-block\">\n        <summary>\ud83d\udca1 Hint: Click to reveal</summary>\n        Denken Sie an das <strong>Gegenteil der 80/20-Regel</strong>: Statt wenige Bestseller, viele Nischenprodukte. Der \"lange Schwanz\" der Verkaufskurve wird profitabel.\n        </details>\n      Back: |\n        **<span class=\"highlight-cyan\">Long-Tail-Strategie</span>:** Gewinn durch eine gro\u00dfe Anzahl von <mark>Nischenprodukten</mark>, die einzeln wenig, aber in Summe viel Umsatz generieren.\n\n        **Voraussetzungen:**\n\n        | Anforderung | Begr\u00fcndung |\n        |-------------|------------|\n        | Zentralisierte Lagerhaltung | Kosteneffiziente Bevorratung vieler Artikel |\n        | Niedrige Lagerkosten | Nischenprodukte m\u00fcssen lange lagern k\u00f6nnen |\n        | Effiziente Logistik | Schnelle Lieferung trotz geringer Nachfrage |\n        | Starke Suchfunktion | Kunden m\u00fcssen Nischenprodukte finden k\u00f6nnen |\n\n        <div class=\"callout tip\">\n        <strong>\ud83d\udca1 Praxisbeispiel:</strong> Amazon verdient mehr mit Millionen seltener B\u00fccher als mit wenigen Bestsellern. Netflix profitiert von Nischenfilmen, die traditionelle Videotheken nie f\u00fchrten.\n        </div>\n    tags: [\"VL2\", \"Long-Tail\", \"Strategie\", \"Slide_12-14\"]\n```\n\n---\n\n**Begin generation now. Create visually engaging, feature-rich cards as specified in your Enhancement Plan.**\n",
        "number": 3,
        "subject": "Enhanced"
      },
      "4": {
        "success": true,
        "content": "Great, proceed with the next at most 10 cards from the blueprint. Continue using ALL enhancement features (tables, callouts, hints, highlights, badges) as planned. Maintain the feature-rich visual style. If there are none left to generate, say so.\n",
        "number": 4,
        "subject": "Enhanced"
      },
      "5": {
        "success": true,
        "content": "Excellent. We will now restart the entire process for a new lecture.\n\nYou are now being reset to the Anki Blueprint Generation phase. Your task is to analyze the brand-new lecture materials provided below and create an Anki Blueprint.\n\n**Prime Directive:**\nYou are to follow **exactly the same method and principles** that were successfully used for the previous lecture. You must maintain the established strategy regarding:\n- The level of detail and target number of cards (e.g., adhering to the \"Max 25 Cards\" rule and its consolidation strategies)\n- The **feature-rich visual style** that maximizes engagement through tables, callouts, hints, highlights, and badges\n- Apply this logic automatically without me needing to specify it again\n\n**Feature Consistency Requirements:**\nWhen planning cards for this new lecture, follow the same feature conventions:\n- **Tables:** For ALL comparisons (30-40% of cards)\n- **Callouts:** At least one per card on average (Tip=green, Warning=amber, Info=blue, Error=red)\n- **Hints:** For 40-50% of cards, especially definitions\n- **Highlights:** 2-3 key terms per card\n- **Badges:** For topic/difficulty categorization where helpful\n\nEvery card topic in your blueprint MUST include a detailed Enhancement Plan.\n\n---\n\n**New Lecture Materials:**\n*   **Lecture Slides**\n\n---\n\n**Final Instruction:**\nPlease analyze the new materials and generate the Anki Blueprint based on the previously established rules, including a comprehensive Enhancement Plan for each topic. I will review the blueprint before we proceed to the YAML generation phase.\n",
        "number": 5,
        "subject": "Enhanced"
      }
    },
    "Minimal": {
      "1": {
        "success": true,
        "content": "You are to assume the role of an expert academic assistant and study partner. Your designated name for this role is **`Anki-Architect`**. Your sole purpose is to help me, a university student, study for my exams by creating perfect, high-yield Anki flashcards from my course materials.\n\nOur collaboration will follow a structured, multi-phase process for each lecture I provide.\n\n**Phase 1: The \"Anki Blueprint\" (Your Immediate Task)**\n\n1.  **Acknowledge and Wait:** After I give you this Master Prompt, you will simply acknowledge it and wait. I will then provide you with the materials for a specific lecture: a PDF file of the slides and a raw text transcript of the professor's spoken words. I may also provide mock exam questions or a list of key topics for the final exam to help you focus.\n\n2.  **Analyze and Plan:** Once you receive the materials, your first and only task for this phase is to conduct a thorough analysis and produce a structured **\"Anki Blueprint.\"** This blueprint is a strategic plan for creating the flashcards. It must NOT contain the final flashcard content itself.\n\n3.  **Blueprint Requirements:** Your Anki Blueprint must be structured as a detailed, hierarchical list. For each major topic or concept in the lecture, you must:\n    *   **Identify the Core Idea:** State the main headline or concept (e.g., \"Porter's Five Forces,\" \"Definition of an Information System,\" \"Turing Machine Halting Problem\").\n    *   **Pinpoint the Source:** Provide precise references to where this information is located in the provided materials. The primary reference should always be the slides (e.g., `VL 01, Slides 14-16`). The transcript should only be referenced if it provides critical clarification, examples, or information not present on the slides. When referencing the transcript, quote the first few words of the relevant sentence for easy lookup (e.g., `Transcript, starting: \"Now, it's crucial to remember that...\"`).\n    *   **Estimate Card Count:** Provide a specific number of recommended Anki cards for that topic. For example, if a slide lists 5 key characteristics of a concept, you should recommend 5 cards, not just one.\n    *   **Outline Card Content:** Briefly sketch out what each card or group of cards should cover. For example: \"One card for the definition, one card for each of the three components, and one card explaining the main advantage.\"\n    *   **Identify Visuals:** If a slide contains a particularly important diagram, chart, or visual model, note this in the blueprint (e.g., `Note: Slide 22 has a key diagram of the client-server model that should be screenshotted for the card.`).\n\n**Phase 2: Anki Card Generation (To Be Initiated by Me Later)**\n\nAfter you have delivered the Anki Blueprint, I will review it. I will then send a *second, highly specific prompt* that instructs you on the exact YAML format for generating the cards. You will then generate a maximum of 10 cards at a time, based on the blueprint, until all planned cards for the lecture are complete. Do not begin this phase until I explicitly prompt you for it.\n\n**Guiding Principles for Your Analysis:**\n\n*   **Exam-Oriented Focus:** Always prioritize content that is likely to be on an exam. Definitions, enumerations (lists), comparisons, process steps, and foundational concepts are more important than anecdotal stories or minor details. Use any mock exam questions I provide as your primary guide for what is essential.\n*   **Language Adaptation:** You must automatically detect the primary language of the lecture slides (German or English) and conduct your entire analysis and all subsequent card generation in that language.\n*   **The \"One Thing\" Rule:** Your card estimations should be guided by the principle that a great flashcard tests exactly one piece of information.\n*   **Clean, Minimal Design:** Focus on clarity over visual complexity. Cards should be readable and uncluttered.\n\nTo begin, please confirm you have understood these instructions by responding with: **\"Anki-Architect protocol initiated. Ready to receive phase 2 prompt and lecture materials.\"** Do not say anything else.\n",
        "number": 1,
        "subject": "Minimal"
      },
      "2": {
        "success": true,
        "content": "Phase 2 (25 Cards per Day): Content Analysis & **Consolidated** Blueprint Generation. Your task is to analyze the provided lecture materials for **[Insert Course Name] - Lecture [Insert Lecture Number or Topic]**, the conversation with the student about said material and lessons learned from that and create a high-yield, efficient \"Anki Blueprint.\"\n\n**Provided Materials:**\nYou are being given access to the following files:\n1.  **Lecture Slides**\n\n---\n\n**Prime Directive: The Principle of Surgical Consolidation**\n\nYour absolute primary goal is to design a blueprint that results in **a maximum of 25 Anki cards** for the entire lecture. This is a hard constraint. To achieve this, you might need to shift your strategy from granular detail to high-level synthesis for certain aspects. Your success on this task will be measured by your ability to create a powerful and comprehensive study set *within this limit*.\n\nThis does **not** mean making every card simplistic. It means adopting a **surgical approach**. Your goal is to preserve high-detail, high-quality cards for core, examinable knowledge while efficiently grouping or summarizing less critical, supporting information.\n\nTo achieve this balance, you must follow this hierarchy:\n\n1.  **Protect the Core (Keep Detailed):** Prioritize detailed, atomic, and high-quality cards for the most important information. This includes:\n    *   **Formal Definitions** of key terms (e.g., \"What is a transaction system?\").\n    *   **Core Frameworks and Models** (e.g., Porter's Five Forces, Technology Acceptance Model).\n    *   **Fundamental Principles** or theories.\n    *   **Crucial Distinctions** between two or more concepts (e.g., Data vs. Information).\n\n2.  **Consolidate the Support (Group & Summarize):** Apply high-level synthesis and grouping strategies primarily to secondary or illustrative information. This is where you will save space to meet the 25-card limit. This includes:\n    *   **Lists of Examples:** Instead of one card per example, create one card asking for \"3 key examples of B2C business models.\"\n    *   **Enumerations of Features/Characteristics:** Instead of one card per feature, create one card asking \"What are the main characteristics of a transformation system?\"\n    *   **Redundant Explanations:** If multiple slides explain the same concept with different visuals, create a single card that captures the central idea.\n\n**Your Consolidation Toolkit:**\n\n*   **To group lists:** Use questions like \"List the 4 components of...\"\n*   **To summarize concepts:** Use questions like \"Explain the core idea of the Long-Tail-Strategie.\"\n*   **To capture comparisons:** Use \"Compare and contrast X and Y based on [criteria].\"\n*   **To handle case studies/examples:** Use \"What is the key takeaway from the [Company] example regarding [Concept]?\"\n\n---\n\n### **Core Philosophical Shift: Strategic Violation of the Atomic Principle**\n\nNormally, Anki cards should be \"atomic\" (one fact per card). For this task, you **MUST** strategically violate this principle. Your goal is not to capture every single detail, but to create cards that summarize key concepts, group related information, and test the connections between ideas.\n\n**Your Consolidation Strategies MUST Include:**\n\n1.  **Grouping Lists & Enumerations:** Instead of creating a separate card for each item in a list (e.g., \"Porter's 5 Forces\"), create **one single card** that asks for the entire list.\n2.  **Synthesizing Concepts:** Instead of defining two related concepts on separate cards, create **one card** that asks to \"Compare and Contrast\" them.\n3.  **Creating High-Level Questions:** Instead of making cards for minor details on a slide, create one card that asks for the main takeaway. For example: \"What is the central argument of the 'Transaction vs. Transformation Systems' slide?\"\n4.  **Combining Definitions:** If a slide defines several closely related terms, group them on the back of a single card.\n\n---\n\n### **Minimal Formatting Philosophy**\n\nYour cards should prioritize **clarity and simplicity**. Avoid visual complexity.\n\n**Core formatting only:**\n\n| Feature | When to Use | Frequency |\n|---------|-------------|-----------|\n| **Bold text** | Key terms, important concepts | Freely |\n| **Numbered/Bullet lists** | Enumerations, steps, components | Freely |\n| **Tables** | Comparing 3+ items OR 2 items on 3+ criteria | Sparingly (2-3 per lecture max) |\n| **Inline code** | Technical terms, commands, acronyms | When relevant |\n\n**Avoid these features** (they add visual noise without proportional learning benefit for most content):\n- Callout boxes\n- Spoiler hints\n- Badges\n- Highlights\n- Complex HTML formatting\n\n**Exception:** Use a table ONLY when information is inherently comparative and would be confusing without tabular structure.\n\n---\n\n### **Reverse Cards: When to Use Them**\n\nMark a card for reversal when **both directions form valid questions**:\n\n| Use Reverse | Don't Use Reverse |\n|-------------|-------------------|\n| Term \u2194 Definition | Explanatory questions |\n| Acronym \u2194 Full name | Lists or enumerations |\n| Symbol \u2194 Meaning | Compare/contrast questions |\n| Formula \u2194 Name | Process-based questions |\n\nIn your blueprint, mark applicable cards with `(Reverse: Yes)`.\n\n---\n\n### **Blueprint Requirements**\n\nGenerate a structured list that outlines the key information, but now with a focus on consolidation.\n\n**Structure for each item in the Blueprint:**\n\n1.  **Topic/Concept Headline:** A clear title for the consolidated information block.\n2.  **Source Reference:** Cite the exact slide number(s): `(VL [Lecture Number] Slide X-Y)`.\n3.  **Content Sketch & Rationale:** Describe the **consolidated** information to be captured. Explicitly state *how* you are grouping the concepts to save space.\n4.  **Format Note:** Only note if a table is required; otherwise omit this field.\n5.  **Recommended Card Count:** Provide the number of cards for this consolidated topic. This will almost always be `(Recommended Cards: 1)`.\n\n---\n\n### **Example of a Perfect *Minimal* Blueprint Output:**\n\n**Anki Blueprint: Management der Informationssysteme (VL 2: Gesch\u00e4ftsmodelle im E-Commerce)**\n\n*   **1. Core Definition of a Business Model and its Components**\n    *   **Reference:** `(VL 2 Slide 4-5)`\n    *   **Content Sketch:** This will be a single, high-level card. The front will ask for the definition of a business model. The back will provide the formal definition and then list its three core components (Value Proposition, Value Creation, Ertragsmodell) as a clean numbered list.\n    *   **Recommended Cards:** 1\n\n*   **2. Comparison of B2C, B2B, and C2C E-Commerce Models**\n    *   **Reference:** `(VL 2 Slide 8-10)`\n    *   **Content Sketch:** A single \"Compare and Contrast\" card. The front will ask to differentiate between B2C, B2B, and C2C models.\n    *   **Format Note:** Use a table (3 models \u00d7 3 criteria = inherently comparative).\n    *   **Recommended Cards:** 1\n\n*   **3. The Long-Tail-Strategie: Core Concept and Preconditions**\n    *   **Reference:** `(VL 2 Slide 12-14)`\n    *   **Content Sketch:** One comprehensive card. The front will ask, \"Explain the Long-Tail-Strategie and its necessary preconditions.\" The back will define the concept and list preconditions as bullet points.\n    *   **Recommended Cards:** 1\n\n*   **4. Key Acronym: SaaS**\n    *   **Reference:** `(VL 2 Slide 18)`\n    *   **Content Sketch:** Single acronym card. Front shows `SaaS`, back shows \"Software as a Service\".\n    *   **(Reverse: Yes)** - acronym \u2194 full name.\n    *   **Recommended Cards:** 1\n\n---\n\n**Final Instruction:**\nYour primary objective is to create an efficient and powerful Anki Blueprint that **does not exceed 25 total recommended cards** while maintaining a **clean, minimal design** that prioritizes readability. I will review the blueprint before you generate the cards.\n",
        "number": 2,
        "subject": "Minimal"
      },
      "3": {
        "success": true,
        "content": "Phase 3: Anki Card Generation.\n\nThe Anki Blueprint you generated is approved. You will now generate the Anki cards as planned, using **minimal, clean formatting**.\n\n**Command:**\nProceed with generating the cards.\n\nYour entire output must be a single YAML code block. Adherence to this protocol is paramount, as a script will parse your output directly. Do not include any conversational text, acknowledgements, or summaries.\n\n---\n\n### **YAML Format Specification**\n\n*   **`deck` (String):** The Anki deck name (`Course Name::Lecture Number`).\n*   **`model` (Required, String):** Always use `\"Anki Automation\"`.\n*   **`cards` (Required, List of Objects):** A list of card data objects.\n\n---\n\n### **CRITICAL Rules & Requirements**\n\n#### **1. UID Uniqueness**\nEvery card object **MUST** have a unique `uid` in the format `xxxx-xxxx-xxxx`. Never repeat a `uid`.\n\n#### **2. Core Formatting Requirements**\nYou **MUST** use Markdown. Keep formatting simple and clean.\n\n*   **Lists:**\n    *   Use standard Markdown for unordered lists (`*` or `-`) and ordered lists (`1.`, `2.`).\n    *   Nested lists are fully supported and should be properly indented.\n    *   **CRITICAL:** A list **MUST** be separated from any preceding text by a blank line. Failure to do so will break the list formatting.\n\n*   **Tables:** Use **GitHub Flavored Markdown (GFM) syntax** ONLY when explicitly planned in the blueprint for comparative data.\n\n*   **Formulas (LaTeX):** This is a standalone format and has strict rules.\n    *   **Inline Formulas:** Use `\\( ... \\)` for formulas within a line of text.\n    *   **Block Formulas:** Use `\\[ ... \\]` for formulas on their own centered line.\n    *   **CRITICAL FORBIDDEN RULE:** **NEVER** wrap LaTeX formulas in backticks (`` ` ``).\n    *   **CRITICAL FORBIDDEN SYNTAX:** You **MUST NOT** use single dollar signs (`$...$`) for inline math.\n\n---\n\n### **MINIMAL FORMATTING REFERENCE**\n\n**Use freely:**\n- **Bold text** (`**text**`) for key terms\n- *Italic text* (`*text*`) for emphasis\n- Numbered lists (`1.`, `2.`, `3.`)\n- Bullet lists (`*` or `-`)\n- Inline code (`` `term` ``) for technical terms and acronyms\n\n**Use sparingly (only when blueprint specifies):**\n- Tables (for complex comparisons only)\n\n**Do NOT use:**\n- Callout boxes (`<div class=\"callout\">`)\n- Spoiler/hint elements\n- Badges\n- Highlights (`<mark>`)\n- Definition lists (`<dl>`)\n- Blockquotes (unless quoting source material)\n\n---\n\n### **Card Object Specification**\n\nEach object in the `cards` list requires:\n\n*   **`uid` (Required, String):** A **unique** identifier.\n*   **`fields` (Required, Dictionary):**\n    *   Keys must be `\"Front\"` and `\"Back\"`.\n    *   Values **MUST** use Markdown according to the rules above. Use the `|` literal block scalar for multi-line content.\n*   **`tags` (Required, List of Strings):** Include relevant tags, including one for the lecture (e.g., `VL1`), the main concept, and the source slide (e.g., `Slide_12-14`).\n*   **`reverse` (Optional, Boolean):** Set to `true` for bidirectional cards (e.g., acronyms, term-definition pairs).\n\n**Reverse Card Rule:** Only use `reverse: true` when both Front\u2192Back and Back\u2192Front make sense as questions.\n\n---\n\n### **Examples of Clean, Minimal Cards**\n\n```yaml\ndeck: \"Management der Informationssysteme::VL 2 - Gesch\u00e4ftsmodelle\"\ncards:\n  # Example 1: Standard definition card with list\n  - model: \"Anki Automation\"\n    uid: \"a1b2-c3d4-e5f6\"\n    fields:\n      Front: |\n        Was sind die **drei Hauptkomponenten** eines Gesch\u00e4ftsmodells?\n      Back: |\n        1.  **Value Proposition:** Welchen Nutzen stiftet das Unternehmen?\n        2.  **Value Creation & Delivery:** Wie wird dieser Nutzen erzeugt und geliefert?\n        3.  **Ertragsmodell (Value Capture):** Wie verdient das Unternehmen Geld?\n    tags: [\"VL2\", \"Gesch\u00e4ftsmodell\", \"Definition\", \"Slide_4-5\"]\n\n  # Example 2: Comparison card with table (only when needed)\n  - model: \"Anki Automation\"\n    uid: \"g7h8-i9j0-k1l2\"\n    fields:\n      Front: |\n        Vergleichen Sie die E-Commerce-Modelle **B2C**, **B2B** und **C2C**.\n      Back: |\n        | Modell | Beschreibung | Beispiel |\n        |--------|--------------|----------|\n        | **B2C** | Verkauf an Endverbraucher | Amazon, Zalando |\n        | **B2B** | Handel zwischen Unternehmen | SAP Ariba |\n        | **C2C** | Privatpersonen untereinander | eBay |\n    tags: [\"VL2\", \"E-Commerce\", \"Vergleich\", \"Slide_8-10\"]\n\n  # Example 3: Reverse card for acronym\n  - model: \"Anki Automation\"\n    uid: \"m3n4-o5p6-q7r8\"\n    reverse: true\n    fields:\n      Front: |\n        `SaaS`\n      Back: |\n        **Software as a Service**\n    tags: [\"VL2\", \"Cloud\", \"Acronym\", \"Slide_18\"]\n  # Example 4: Concept explanation card (NO reverse - explanation question)\n  - model: \"Anki Automation\"\n    uid: \"s9t0-u1v2-w3x4\"\n    fields:\n      Front: |\n        Was beschreibt die **Long-Tail-Strategie** und welche Voraussetzungen ben\u00f6tigt sie?\n      Back: |\n        **Long-Tail-Strategie:** Gewinn durch viele Nischenprodukte, die einzeln wenig, aber in Summe viel Umsatz generieren.\n\n        **Voraussetzungen:**\n\n        *   Zentralisierte Lagerhaltung\n        *   Niedrige Lagerkosten\n        *   Effiziente Logistik\n        *   Starke Suchfunktion\n    tags: [\"VL2\", \"Long-Tail\", \"Strategie\", \"Slide_12-14\"]\n```\n\n---\n\n**Begin generation now.**\n",
        "number": 3,
        "subject": "Minimal"
      },
      "4": {
        "success": true,
        "content": "Great, proceed with the next at most 10 cards from the blueprint. Maintain the clean, minimal formatting style. If there are none left to generate, say so.\n",
        "number": 4,
        "subject": "Minimal"
      },
      "5": {
        "success": true,
        "content": "Excellent. We will now restart the entire process for a new lecture.\n\nYou are now being reset to the Anki Blueprint Generation phase. Your task is to analyze the brand-new lecture materials provided below and create an Anki Blueprint.\n\n**Prime Directive:**\nYou are to follow **exactly the same method and principles** that were successfully used for the previous lecture. You must maintain the established strategy regarding:\n- The level of detail and target number of cards (e.g., adhering to the \"Max 25 Cards\" rule and its consolidation strategies)\n- The **minimal, clean formatting style** that avoids unnecessary visual complexity\n- Apply this logic automatically without me needing to specify it again\n\n**Formatting Reminder:**\n- Use bold, lists, and inline code freely\n- Use tables only for inherently comparative data\n- Avoid callouts, hints, badges, and highlights\n\n---\n\n**New Lecture Materials:**\n*   **Lecture Slides**\n\n---\n\n**Final Instruction:**\nPlease analyze the new materials and generate the Anki Blueprint based on the previously established rules. I will review the blueprint before we proceed to the YAML generation phase.\n",
        "number": 5,
        "subject": "Minimal"
      }
    }
  }
};