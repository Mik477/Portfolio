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
      Front: `<p>Explain the <span class="badge badge-purple">Scaled Dot-Product Attention</span> mechanism used in Transformers.</p>`,
      Back: `<p>The attention mechanism computes a weighted sum of values based on the compatibility of the query with corresponding keys:</p>

<p>\\[ \\text{Attention}(Q, K, V) = \\text{softmax}\\left(\\frac{QK^T}{\\sqrt{d_k}}\\right)V \\]</p>

<ul>
<li><strong>Q</strong>: Query matrix</li>
<li><strong>K</strong>: Key matrix</li>
<li><strong>V</strong>: Value matrix</li>
<li><strong>\\( d_k \\)</strong>: Dimension of keys (scaling factor to prevent vanishing gradients in softmax)</li>
</ul>`
    },
    tags: ["deep-learning", "transformers", "nlp"]
  },
  {
    uid: "showcase-002",
    fields: {
      Front: `<p>What is the objective function optimized in a <span class="badge badge-cyan">Variational Autoencoder (VAE)</span>?</p>`,
      Back: `<p>VAEs maximize the <strong>Evidence Lower Bound (ELBO)</strong>:</p>

<p>\\[ \\mathcal{L}(\\theta, \\phi; x) = \\mathbb{E}_{q_\\phi(z|x)}[\\log p_\\theta(x|z)] - D_{KL}(q_\\phi(z|x) || p(z)) \\]</p>

<div class="info">
  <strong>Components:</strong>
  <ul>
    <li>First term: <strong>Reconstruction Loss</strong> (how well we decode)</li>
    <li>Second term: <strong>KL Divergence</strong> (regularization towards prior \\( p(z) \\))</li>
  </ul>
</div>`
    },
    tags: ["generative-ai", "math", "probabilistic-models"]
  },
  {
    uid: "showcase-003",
    fields: {
      Front: `<p>Implement a Python <span class="badge badge-green">decorator</span> <code>@time_execution</code> that measures function runtime.</p>`,
      Back: `<pre><code>import time
import functools

def time_execution(func):
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        end = time.perf_counter()
        print(f"{func.__name__} took {end - start:.4f}s")
        return result
    return wrapper

@time_execution
def heavy_compute():
    # ... implementation
    pass</code></pre>`
    },
    tags: ["python", "advanced", "metaprogramming"]
  },
  {
    uid: "showcase-004",
    fields: {
      Front: `<p>Describe the update rules for the <span class="badge badge-amber">Adam</span> optimizer.</p>`,
      Back: `<p>Adam (Adaptive Moment Estimation) maintains moving averages of gradients and squared gradients:</p>

<p>\\[ m_t = \\beta_1 m_{t-1} + (1-\\beta_1)g_t \\] <br>
\\[ v_t = \\beta_2 v_{t-1} + (1-\\beta_2)g_t^2 \\]</p>

<p>Bias-corrected estimates:</p>
<p>\\[ \\hat{m}_t = \\frac{m_t}{1-\\beta_1^t}, \\quad \\hat{v}_t = \\frac{v_t}{1-\\beta_2^t} \\]</p>

<p>Parameter update:</p>
<p>\\[ \\theta_{t+1} = \\theta_t - \\frac{\\eta}{\\sqrt{\\hat{v}_t} + \\epsilon} \\hat{m}_t \\]</p>`
    },
    tags: ["optimization", "deep-learning", "math"]
  },
  {
    uid: "showcase-005",
    fields: {
      Front: `<p>How does <span class="badge badge-blue">LoRA (Low-Rank Adaptation)</span> reduce parameters during LLM fine-tuning?</p>`,
      Back: `<p>Instead of updating the full weight matrix \\( W \\), LoRA injects trainable rank decomposition matrices \\( A \\) and \\( B \\):</p>

<p>\\[ h = W_0 x + \\Delta W x = W_0 x + BAx \\]</p>

<div class="tip">
  <strong>Key Insight:</strong>
  Where \\( A \\in \\mathbb{R}^{r \\times d} \\) and \\( B \\in \\mathbb{R}^{d \\times r} \\) with rank \\( r \\ll d \\).
  This reduces trainable parameters by up to 10,000x.
</div>`
    },
    tags: ["llm", "fine-tuning", "efficiency"]
  },
  {
    uid: "showcase-006",
    fields: {
      Front: `<p>State the <span class="badge badge-red">Bellman Optimality Equation</span> for the value function \\( V^*(s) \\).</p>`,
      Back: `<p>The value of a state under an optimal policy must equal the expected return for the best action:</p>

<p>\\[ V^*(s) = \\max_{a} \\left( R(s,a) + \\gamma \\sum_{s'} P(s'|s,a) V^*(s') \\right) \\]</p>

<div class="info">
  This recursive definition is the foundation for Q-Learning and Dynamic Programming in RL.
</div>`
    },
    tags: ["reinforcement-learning", "math", "theory"]
  },
  {
    uid: "showcase-007",
    fields: {
      Front: `<p>Create a custom <span class="badge badge-green">Context Manager</span> in Python for handling resources.</p>`,
      Back: `<pre><code>class ManagedResource:
    def __enter__(self):
        print("Acquiring resource...")
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        print("Releasing resource...")
        # Return True to suppress exceptions
        return False

# Usage
with ManagedResource() as r:
    print("Using resource")</code></pre>`
    },
    tags: ["python", "patterns", "advanced"]
  },
  {
    uid: "showcase-008",
    fields: {
      Front: `<p>What is the <span class="badge badge-purple">Vanishing Gradient Problem</span> and how do Residual Connections solve it?</p>`,
      Back: `<p>In deep networks, gradients can shrink exponentially during backpropagation, preventing learning in early layers.</p>

<p><strong>Residual Connections (ResNets):</strong></p>
<p>\\[ y = \\mathcal{F}(x, \\{W_i\\}) + x \\]</p>

<p>The gradient signal can flow directly through the identity connection \\( + x \\), acting as a "gradient superhighway".</p>`
    },
    tags: ["deep-learning", "architecture", "theory"]
  },
  {
    uid: "showcase-009",
    fields: {
      Front: `<p>Explain <span class="badge badge-amber">Principal Component Analysis (PCA)</span> mathematically.</p>`,
      Back: `<p>PCA seeks orthogonal unit vectors (principal components) that maximize the variance of the projected data.</p>

<p>These are the <strong>eigenvectors</strong> of the covariance matrix \\( \\Sigma \\):</p>

<p>\\[ \\Sigma v = \\lambda v \\]</p>

<div class="tip">
  The eigenvector with the largest eigenvalue \\( \\lambda \\) corresponds to the direction of maximum variance.
</div>`
    },
    tags: ["statistics", "dimensionality-reduction", "math"]
  },
  {
    uid: "showcase-010",
    fields: {
      Front: `<p>What is the time complexity of the <span class="badge badge-cyan">Self-Attention</span> layer?</p>
<p>Hint: <span class="spoiler" tabindex="0">Sequence length n, dimension d</span></p>`,
      Back: `<p>The complexity is quadratic with respect to sequence length:</p>

<p>\\[ O(n^2 \\cdot d) \\]</p>

<p>This is because we compute the attention scores for every pair of tokens (\\( n \\times n \\) matrix).</p>

<div class="warning">
  <strong>Impact:</strong> This limits standard Transformers to relatively short context windows without optimizations like FlashAttention.
</div>`
    },
    tags: ["complexity", "transformers", "algorithms"]
  }
];

export default ankiDemoCards;
