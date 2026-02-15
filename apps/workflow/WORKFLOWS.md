# Workflow Service

The workflow service executes declarative AI agent workflows via Redis pub/sub. Send a workflow definition and receive streaming responses.

## Quick Start

Publish to `workflow:{workflow_run_id}`:

**JSON:**

```json
{
  "type": "workflow",
  "workflow_run_id": "run-123",
  "payload": {
    "content": "Help me create a product",
    "context": { "store_id": "store_abc" },
    "workflow": {
      "name": "simple-assistant",
      "agents": {
        "assistant": {
          "description": "General assistant",
          "system_prompt": "You are a helpful assistant.",
          "input_schema": { "type": "string", "description": "User message" },
          "output_schema": { "type": "string", "description": "Response" },
          "mcp_servers": ["messaging"]
        }
      },
      "steps": [
        { "id": "respond", "agent": "assistant", "input": "${{ trigger.message }}" }
      ],
      "output": "${{ steps.respond.output }}"
    }
  }
}
```

Subscribe to `workflow:{workflow_run_id}` to receive responses.

---

## Workflow Definition Reference

Every workflow definition requires `name`, `agents`, `steps`, and `output`.

**YAML:**

```yaml
name: workflow-name
description: "Optional description"

variables:
  max_retries: 3
  mode: production

agents:
  agent-name:
    description: "What this agent does"
    system_prompt: "Agent instructions"
    model: "provider/model"
    history_group: "default"
    input_schema:
      type: string
      description: "Expected input"
    output_schema:
      type: string
      description: "Expected output"
    mcp_servers:
      - messaging
    can_call_agents:
      - other-agent
    context_reads:
      - key-name
    context_writes:
      key-name:
        type: string
        description: "What this key stores"

steps:
  - id: step-id
    agent: agent-name
    input: "${{ trigger.message }}"
    if: "${{ condition }}"
    needs:
      - other-step-id
    timeout: 120
    continue_on_error: false
    retry:
      max_attempts: 3
      backoff: exponential
      delay_seconds: 2.0
    on_failure:
      message: "Step failed"
    strategy:
      type: parallel
      items:
        - "subtask 1"
        - "subtask 2"

output: "${{ steps.step-id.output }}"
fail_fast: false
on_failure:
  agent: error-handler
```

**JSON:**

```json
{
  "name": "workflow-name",
  "description": "Optional description",
  "variables": {
    "max_retries": 3,
    "mode": "production"
  },
  "agents": {
    "agent-name": {
      "description": "What this agent does",
      "system_prompt": "Agent instructions",
      "model": "provider/model",
      "history_group": "default",
      "input_schema": { "type": "string", "description": "Expected input" },
      "output_schema": { "type": "string", "description": "Expected output" },
      "mcp_servers": ["messaging"],
      "can_call_agents": ["other-agent"],
      "context_reads": ["key-name"],
      "context_writes": {
        "key-name": { "type": "string", "description": "What this key stores" }
      }
    }
  },
  "steps": [
    {
      "id": "step-id",
      "agent": "agent-name",
      "input": "${{ trigger.message }}",
      "if": "${{ condition }}",
      "needs": ["other-step-id"],
      "timeout": 120,
      "continue_on_error": false,
      "retry": {
        "max_attempts": 3,
        "backoff": "exponential",
        "delay_seconds": 2.0
      },
      "on_failure": { "message": "Step failed" },
      "strategy": {
        "type": "parallel",
        "items": ["subtask 1", "subtask 2"]
      }
    }
  ],
  "output": "${{ steps.step-id.output }}",
  "fail_fast": false,
  "on_failure": { "agent": "error-handler" }
}
```

### Field Reference

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `name` | Yes | - | Workflow identifier |
| `description` | No | `null` | Human-readable description |
| `agents` | Yes | - | Map of agent definitions |
| `steps` | Yes | - | Ordered list of execution steps |
| `output` | Yes | - | Output template (string or object) |
| `variables` | No | `{}` | Default variables accessible via `${{ variables.* }}` |
| `fail_fast` | No | `false` | Stop workflow on first step failure |
| `on_failure` | No | `null` | Error handler for workflow-level failures |

### Agent Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `description` | Yes | - | Agent purpose (used as tool description for `can_call_agents`) |
| `system_prompt` | Yes | - | Instructions for the agent (supports expressions) |
| `model` | No | `claude-sonnet` | LLM model to use |
| `history_group` | No | `"default"` | History group name. Same value = shared history, different = isolated, `null` = stateless |
| `input_schema` | No | `{type: "string"}` | Input validation schema |
| `output_schema` | No | `{type: "string"}` | Output validation schema |
| `mcp_servers` | No | `[]` | MCP servers to connect |
| `can_call_agents` | No | `[]` | Agents this agent can invoke as tools |
| `context_reads` | No | `[]` | Shared context keys the agent can read |
| `context_writes` | No | `{}` | Shared context keys the agent can write |

### Step Fields

| Field | Required | Default | Description |
|-------|----------|---------|-------------|
| `id` | Yes | - | Unique step identifier |
| `agent` | Yes* | - | Agent to execute (*unless `sub_workflow` is set) |
| `input` | No | `${{ trigger.message }}` | Input to the agent (string or object template) |
| `if` | No | `null` | Condition expression; step skipped if false |
| `needs` | No | `[]` | Step IDs this step depends on |
| `timeout` | No | `120` | Max seconds before step times out |
| `continue_on_error` | No | `false` | Allow workflow to continue if step fails |
| `retry` | No | `null` | Retry configuration |
| `on_failure` | No | `null` | Error handler for this step |
| `strategy` | No | `null` | Execution strategy (parallel, for_each, matrix) |
| `sub_workflow` | No | `null` | Inline workflow definition (replaces `agent`) |

### Retry Config

| Field | Default | Description |
|-------|---------|-------------|
| `max_attempts` | `1` | Total attempts (1 = no retry) |
| `backoff` | `"fixed"` | `"fixed"` or `"exponential"` |
| `delay_seconds` | `1.0` | Delay between retries |

### Failure Handler

| Field | Description |
|-------|-------------|
| `agent` | Agent to invoke with the error message |
| `message` | Message to publish as `text_delta` event |

### Strategy Types

| Type | Description |
|------|-------------|
| `parallel` | Run agent on each item concurrently |
| `for_each` | Run agent on each item sequentially, passing previous result |
| `matrix` | Run agent on all combinations of matrix parameters |

### Strategy Output Shapes

Strategy steps produce a **list** as their output. Each entry contains the item/params and the agent's typed output:

**Parallel / For-Each:**

```yaml
# steps.analyze.output after parallel or for_each:
# [
#   { "item": "Market", "output": { "category": "trends", "score": 0.9 } },
#   { "item": "Tech",   "output": { "category": "analysis", "score": 0.8 } }
# ]
```

**Matrix:**

```yaml
# steps.test.output after matrix:
# [
#   { "params": { "os": "linux", "node": "18" }, "output": "PASS" },
#   { "params": { "os": "macos", "node": "18" }, "output": "PASS" }
# ]
```

---

## Expression Syntax

Use `${{ }}` for dynamic values in `input`, `if`, `system_prompt`, `strategy.items`, and `output`.

### Available Roots

| Path | Description |
|------|-------------|
| `trigger.message` | User's message |
| `trigger.*` | Any trigger data |
| `steps.<id>.output` | Step output — typed: string, dict, or list depending on the agent's `output_schema` |
| `steps.<id>.output.*` | Access fields of structured output (when output is an object) |
| `steps.<id>.status` | Step status: `success`, `failure`, `skipped` |
| `context.*` | Shared context (API-provided + agent-written) |
| `variables.*` | Workflow-level variables |

### Type Preservation

Expressions preserve their resolved type. When a template is purely a single expression (e.g. `${{ steps.x.output }}`), the result keeps its original type — string, dict, list, number, or boolean. When mixed with surrounding text (e.g. `Score: ${{ steps.x.output.score }}`), values are stringified for interpolation.

| Expression | Resolved Type | Example Result |
|------------|--------------|----------------|
| `${{ steps.x.output }}` (agent returns dict) | `dict` | `{"intent": "order", "score": 0.9}` |
| `${{ steps.x.output }}` (agent returns string) | `string` | `"Hello world"` |
| `${{ steps.x.output.score }}` | `number` | `0.9` |
| `${{ context.items }}` | `list` | `["a", "b", "c"]` |
| `Score: ${{ steps.x.output.score }}` | `string` | `"Score: 0.9"` |

### Operators

| Operator | Example |
|----------|---------|
| `==` | `steps.route.output == 'product'` |
| `!=` | `context.role != 'guest'` |
| `<` `>` `<=` `>=` | `variables.count > 5` |
| `&&` | `steps.a.status == 'success' && steps.b.status == 'success'` |
| `\|\|` | `steps.route.output == 'a' \|\| steps.route.output == 'b'` |
| `!` | `!steps.check.output.is_spam` |
| `in` | `'urgent' in trigger.message` |
| `+` `-` `*` `/` | `variables.count + 1` |
| `? :` (ternary) | `steps.a.status == 'success' ? 'yes' : 'no'` |
| `??` (nullish) | `context.name ?? 'default'` |

### Functions

| Function | Description | Example |
|----------|-------------|---------|
| `length(x)` | Length of string, array, or object | `length(context.items)` |
| `join(arr, sep?)` | Join array elements | `join(context.tags, ', ')` |
| `contains(haystack, needle)` | Check if string/array contains value | `contains(trigger.message, 'help')` |
| `toJSON(x)` | Serialize to JSON string | `toJSON(steps.a.output)` |
| `fromJSON(s)` | Parse JSON string | `fromJSON(variables.config)` |
| `upper(s)` / `lower(s)` | Case conversion | `upper(context.name)` |
| `startsWith(s, prefix)` | String starts with | `startsWith(trigger.message, 'help')` |
| `endsWith(s, suffix)` | String ends with | `endsWith(context.file, '.csv')` |

---

## Workflow Output

The `output` field is required and defines the `end_of_turn` event content.

**Single step output:**

```yaml
output: "${{ steps.respond.output }}"
```

```json
{ "output": "${{ steps.respond.output }}" }
```

**Concatenated outputs:**

```yaml
output: |
  ## Analysis
  ${{ steps.analyze.output }}

  ## Response
  ${{ steps.respond.output }}
```

```json
{ "output": "## Analysis\n${{ steps.analyze.output }}\n\n## Response\n${{ steps.respond.output }}" }
```

**Structured object:**

```yaml
output:
  response: "${{ steps.respond.output }}"
  intent: "${{ steps.analyze.output.intent }}"
  confidence: "${{ steps.analyze.output.confidence }}"
```

```json
{
  "output": {
    "response": "${{ steps.respond.output }}",
    "intent": "${{ steps.analyze.output.intent }}",
    "confidence": "${{ steps.analyze.output.confidence }}"
  }
}
```

When `output` is an object, the `end_of_turn` event `content` field contains the typed value directly (string, object, or array). The frontend renders strings as markdown and objects/arrays as formatted JSON.

---

## History Management

The `history_group` field on agents controls how conversation history is tracked across turns within a workflow run.

### Three Modes

| Mode | `history_group` value | Behavior |
|------|----------------------|----------|
| **Shared** | Same string (e.g. `"chat"`) | Agents share the same conversation history |
| **Isolated** | Different strings (e.g. `"analysis"`) | Each group tracks its own independent history |
| **Stateless** | `null` | No history — agent starts fresh every turn |

### How It Works

History is stored per group as a dict on the workflow run:

```json
{
  "chat": [/* messages for the chat group */],
  "analysis": [/* messages for the analysis group */]
}
```

When an agent runs, the executor looks up its `history_group` and passes only that group's messages as `message_history` to the LLM. After the agent responds, the group's history is updated with the full conversation.

### Example: Mixed History Strategies

```yaml
name: support-workflow
agents:
  classifier:
    description: Classify intent
    system_prompt: "Classify the message. Respond: billing, technical, or general."
    history_group: null  # stateless — no memory needed

  support-agent:
    description: User-facing support agent
    system_prompt: "You are a support agent. Use conversation history to help the user."
    history_group: chat  # remembers the conversation

  quality-reviewer:
    description: Reviews support quality
    system_prompt: "Review the support interaction for quality."
    history_group: review  # isolated — tracks its own review history

steps:
  - id: classify
    agent: classifier
    input: "${{ trigger.message }}"
  - id: respond
    agent: support-agent
    input: "${{ trigger.message }}"
    needs: [classify]
  - id: review
    agent: quality-reviewer
    input: "Review this response: ${{ steps.respond.output }}"
    needs: [respond]

output: "${{ steps.respond.output }}"
```

In this workflow:
- `classifier` is stateless — it classifies each message independently
- `support-agent` shares the `"chat"` group — it remembers the full conversation
- `quality-reviewer` has its own `"review"` group — it builds up review history without polluting the user-facing chat

---

## Examples

### 1. Simple Single Agent

**YAML:**

```yaml
name: simple-chat
agents:
  assistant:
    description: "General e-commerce assistant"
    system_prompt: |
      You are a helpful e-commerce assistant.
    input_schema:
      type: string
      description: "User's message"
    output_schema:
      type: string
      description: "Assistant's response"
    mcp_servers:
      - messaging

steps:
  - id: respond
    agent: assistant
    input: "${{ trigger.message }}"

output: "${{ steps.respond.output }}"
```

**JSON:**

```json
{
  "name": "simple-chat",
  "agents": {
    "assistant": {
      "description": "General e-commerce assistant",
      "system_prompt": "You are a helpful e-commerce assistant.",
      "input_schema": { "type": "string", "description": "User's message" },
      "output_schema": { "type": "string", "description": "Assistant's response" },
      "mcp_servers": ["messaging"]
    }
  },
  "steps": [
    { "id": "respond", "agent": "assistant", "input": "${{ trigger.message }}" }
  ],
  "output": "${{ steps.respond.output }}"
}
```

### 2. Router Pattern (Conditional Branching)

**YAML:**

```yaml
name: smart-router
agents:
  router:
    description: "Classify user intent for routing"
    system_prompt: |
      Classify the user's intent. Respond with exactly one word:
      product, order, or general.
    input_schema:
      type: string
      description: "User's message to classify"
    output_schema:
      type: string
      description: "One of: product, order, general"

  product-expert:
    description: "Product specialist"
    system_prompt: "You are a product specialist."
    input_schema:
      type: string
      description: "Product question"
    output_schema:
      type: string
      description: "Product answer"
    mcp_servers: [messaging, medusa]

  order-expert:
    description: "Order specialist"
    system_prompt: "You are an order specialist."
    input_schema:
      type: string
      description: "Order question"
    output_schema:
      type: string
      description: "Order answer"
    mcp_servers: [messaging]

  general-assistant:
    description: "General assistant"
    system_prompt: "You are a general assistant."
    input_schema:
      type: string
      description: "General question"
    output_schema:
      type: string
      description: "General answer"
    mcp_servers: [messaging]


steps:
  - id: route
    agent: router
    input: "${{ trigger.message }}"

  - id: handle-product
    agent: product-expert
    input: "${{ trigger.message }}"
    if: "${{ steps.route.output == 'product' }}"
    needs: [route]

  - id: handle-order
    agent: order-expert
    input: "${{ trigger.message }}"
    if: "${{ steps.route.output == 'order' }}"
    needs: [route]

  - id: handle-general
    agent: general-assistant
    input: "${{ trigger.message }}"
    if: "${{ steps.route.output == 'general' }}"
    needs: [route]

output: "${{ steps.handle-product.output }}${{ steps.handle-order.output }}${{ steps.handle-general.output }}"
```

**JSON:**

```json
{
  "name": "smart-router",
  "agents": {
    "router": {
      "description": "Classify user intent for routing",
      "system_prompt": "Classify the user's intent. Respond with exactly one word:\nproduct, order, or general.\n",
      "input_schema": { "type": "string", "description": "User's message to classify" },
      "output_schema": { "type": "string", "description": "One of: product, order, general" }
    },
    "product-expert": {
      "description": "Product specialist",
      "system_prompt": "You are a product specialist.",
      "input_schema": { "type": "string", "description": "Product question" },
      "output_schema": { "type": "string", "description": "Product answer" },
      "mcp_servers": ["messaging", "medusa"]
    },
    "order-expert": {
      "description": "Order specialist",
      "system_prompt": "You are an order specialist.",
      "input_schema": { "type": "string", "description": "Order question" },
      "output_schema": { "type": "string", "description": "Order answer" },
      "mcp_servers": ["messaging"]
    },
    "general-assistant": {
      "description": "General assistant",
      "system_prompt": "You are a general assistant.",
      "input_schema": { "type": "string", "description": "General question" },
      "output_schema": { "type": "string", "description": "General answer" },
      "mcp_servers": ["messaging"]
    }
  },
  "steps": [
    { "id": "route", "agent": "router", "input": "${{ trigger.message }}" },
    {
      "id": "handle-product",
      "agent": "product-expert",
      "input": "${{ trigger.message }}",
      "if": "${{ steps.route.output == 'product' }}",
      "needs": ["route"]
    },
    {
      "id": "handle-order",
      "agent": "order-expert",
      "input": "${{ trigger.message }}",
      "if": "${{ steps.route.output == 'order' }}",
      "needs": ["route"]
    },
    {
      "id": "handle-general",
      "agent": "general-assistant",
      "input": "${{ trigger.message }}",
      "if": "${{ steps.route.output == 'general' }}",
      "needs": ["route"]
    }
  ],
  "output": "${{ steps.handle-product.output }}${{ steps.handle-order.output }}${{ steps.handle-general.output }}"
}
```

### 3. Parallel Analysis

Steps without dependencies run in parallel automatically.

**YAML:**

```yaml
name: parallel-analysis
agents:
  sentiment:
    description: "Analyze sentiment"
    system_prompt: "Analyze sentiment. Respond: POSITIVE, NEGATIVE, or NEUTRAL."
    input_schema:
      type: string
      description: "Text to analyze"
    output_schema:
      type: string
      description: "Sentiment label"

  intent:
    description: "Classify intent"
    system_prompt: "Classify intent. Respond: question, request, complaint, or feedback."
    input_schema:
      type: string
      description: "Text to classify"
    output_schema:
      type: string
      description: "Intent label"

  synthesizer:
    description: "Synthesize analysis into a response"
    system_prompt: |
      You receive analysis from multiple sources.
      Synthesize into a helpful response.    input_schema:
      type: string
      description: "Combined analysis"
    output_schema:
      type: string
      description: "Final response"


steps:
  - id: sentiment
    agent: sentiment
    input: "${{ trigger.message }}"

  - id: intent
    agent: intent
    input: "${{ trigger.message }}"

  - id: respond
    agent: synthesizer
    input: |
      User: ${{ trigger.message }}
      Sentiment: ${{ steps.sentiment.output }}
      Intent: ${{ steps.intent.output }}
    needs: [sentiment, intent]

output: "${{ steps.respond.output }}"
```

**JSON:**

```json
{
  "name": "parallel-analysis",
  "agents": {
    "sentiment": {
      "description": "Analyze sentiment",
      "system_prompt": "Analyze sentiment. Respond: POSITIVE, NEGATIVE, or NEUTRAL.",
      "input_schema": { "type": "string", "description": "Text to analyze" },
      "output_schema": { "type": "string", "description": "Sentiment label" }
    },
    "intent": {
      "description": "Classify intent",
      "system_prompt": "Classify intent. Respond: question, request, complaint, or feedback.",
      "input_schema": { "type": "string", "description": "Text to classify" },
      "output_schema": { "type": "string", "description": "Intent label" }
    },
    "synthesizer": {
      "description": "Synthesize analysis into a response",
      "system_prompt": "You receive analysis from multiple sources.\nSynthesize into a helpful response.\n",
      "input_schema": { "type": "string", "description": "Combined analysis" },
      "output_schema": { "type": "string", "description": "Final response" },

    }
  },
  "steps": [
    { "id": "sentiment", "agent": "sentiment", "input": "${{ trigger.message }}" },
    { "id": "intent", "agent": "intent", "input": "${{ trigger.message }}" },
    {
      "id": "respond",
      "agent": "synthesizer",
      "input": "User: ${{ trigger.message }}\nSentiment: ${{ steps.sentiment.output }}\nIntent: ${{ steps.intent.output }}\n",
      "needs": ["sentiment", "intent"]
    }
  ],
  "output": "${{ steps.respond.output }}"
}
```

### 4. Fan-Out Strategy (Parallel Within a Step)

Run the same agent on multiple subtasks concurrently.

**YAML:**

```yaml
name: research-assistant
agents:
  researcher:
    description: "Research a topic"
    system_prompt: "Research the given topic thoroughly."
    input_schema:
      type: string
      description: "Research topic"
    output_schema:
      type: string
      description: "Research findings"

  synthesizer:
    description: "Combine research findings"
    system_prompt: "Combine research findings into a comprehensive response."
    input_schema:
      type: string
      description: "Research findings to combine"
    output_schema:
      type: string
      description: "Combined response"


steps:
  - id: research
    agent: researcher
    input: "${{ trigger.message }}"
    strategy:
      type: parallel
      items:
        - "Market trends and opportunities"
        - "Competitor analysis"
        - "Customer preferences"

  - id: synthesize
    agent: synthesizer
    input: |
      Research findings:
      ${{ steps.research.output }}
    needs: [research]

output: "${{ steps.synthesize.output }}"
```

**JSON:**

```json
{
  "name": "research-assistant",
  "agents": {
    "researcher": {
      "description": "Research a topic",
      "system_prompt": "Research the given topic thoroughly.",
      "input_schema": { "type": "string", "description": "Research topic" },
      "output_schema": { "type": "string", "description": "Research findings" }
    },
    "synthesizer": {
      "description": "Combine research findings",
      "system_prompt": "Combine research findings into a comprehensive response.",
      "input_schema": { "type": "string", "description": "Research findings to combine" },
      "output_schema": { "type": "string", "description": "Combined response" },

    }
  },
  "steps": [
    {
      "id": "research",
      "agent": "researcher",
      "input": "${{ trigger.message }}",
      "strategy": {
        "type": "parallel",
        "items": [
          "Market trends and opportunities",
          "Competitor analysis",
          "Customer preferences"
        ]
      }
    },
    {
      "id": "synthesize",
      "agent": "synthesizer",
      "input": "Research findings:\n${{ steps.research.output }}\n",
      "needs": ["research"]
    }
  ],
  "output": "${{ steps.synthesize.output }}"
}
```

### 5. Dynamic Fan-Out (From Previous Step Output)

Use expressions in `strategy.items` to fan out based on a previous step's structured output.

**YAML:**

```yaml
name: dynamic-fanout
agents:
  fetcher:
    description: "Fetch product IDs"
    system_prompt: "Return a JSON object with a product_ids array."
    input_schema:
      type: string
      description: "Query"
    output_schema:
      type: object
      description: "Product IDs"
      properties:
        product_ids:
          type: array

  analyzer:
    description: "Analyze a product"
    system_prompt: "Analyze the given product."
    input_schema:
      type: string
      description: "Product to analyze"
    output_schema:
      type: string
      description: "Analysis"

steps:
  - id: get-products
    agent: fetcher
    input: "${{ trigger.message }}"

  - id: analyze-each
    agent: analyzer
    input: "Analyze product"
    strategy:
      type: parallel
      items: "${{ steps.get-products.output.product_ids }}"
    needs: [get-products]

output: "${{ steps.analyze-each.output }}"
```

**JSON:**

```json
{
  "name": "dynamic-fanout",
  "agents": {
    "fetcher": {
      "description": "Fetch product IDs",
      "system_prompt": "Return a JSON object with a product_ids array.",
      "input_schema": { "type": "string", "description": "Query" },
      "output_schema": {
        "type": "object",
        "description": "Product IDs",
        "properties": {
          "product_ids": { "type": "array" }
        }
      }
    },
    "analyzer": {
      "description": "Analyze a product",
      "system_prompt": "Analyze the given product.",
      "input_schema": { "type": "string", "description": "Product to analyze" },
      "output_schema": { "type": "string", "description": "Analysis" }
    }
  },
  "steps": [
    { "id": "get-products", "agent": "fetcher", "input": "${{ trigger.message }}" },
    {
      "id": "analyze-each",
      "agent": "analyzer",
      "input": "Analyze product",
      "strategy": {
        "type": "parallel",
        "items": "${{ steps.get-products.output.product_ids }}"
      },
      "needs": ["get-products"]
    }
  ],
  "output": "${{ steps.analyze-each.output }}"
}
```

### 6. Sequential For-Each

Process items one by one, passing each result to the next iteration.

**YAML:**

```yaml
name: sequential-review
agents:
  reviewer:
    description: "Review an item"
    system_prompt: |
      Review the given item. If a previous result is provided, 
      build on that review for consistency.
    input_schema:
      type: string
      description: "Item to review with optional previous context"
    output_schema:
      type: string
      description: "Review"

steps:
  - id: review-all
    agent: reviewer
    input: "Review this document section"
    strategy:
      type: for_each
      items:
        - "Introduction"
        - "Methods"
        - "Results"
        - "Conclusion"

output: "${{ steps.review-all.output }}"
```

**JSON:**

```json
{
  "name": "sequential-review",
  "agents": {
    "reviewer": {
      "description": "Review an item",
      "system_prompt": "Review the given item. If a previous result is provided,\nbuild on that review for consistency.\n",
      "input_schema": { "type": "string", "description": "Item to review with optional previous context" },
      "output_schema": { "type": "string", "description": "Review" }
    }
  },
  "steps": [
    {
      "id": "review-all",
      "agent": "reviewer",
      "input": "Review this document section",
      "strategy": {
        "type": "for_each",
        "items": ["Introduction", "Methods", "Results", "Conclusion"]
      }
    }
  ],
  "output": "${{ steps.review-all.output }}"
}
```

### 7. Matrix Strategy

Run an agent across all combinations of parameters.

**YAML:**

```yaml
name: matrix-test
agents:
  tester:
    description: "Test a configuration"
    system_prompt: "Test the given configuration and report results."
    input_schema:
      type: string
      description: "Configuration to test"
    output_schema:
      type: string
      description: "Test results"

steps:
  - id: test
    agent: tester
    input: "Run compatibility test"
    strategy:
      type: matrix
      matrix:
        os: [linux, macos, windows]
        node: ["18", "20", "22"]

output: "${{ steps.test.output }}"
```

**JSON:**

```json
{
  "name": "matrix-test",
  "agents": {
    "tester": {
      "description": "Test a configuration",
      "system_prompt": "Test the given configuration and report results.",
      "input_schema": { "type": "string", "description": "Configuration to test" },
      "output_schema": { "type": "string", "description": "Test results" }
    }
  },
  "steps": [
    {
      "id": "test",
      "agent": "tester",
      "input": "Run compatibility test",
      "strategy": {
        "type": "matrix",
        "matrix": {
          "os": ["linux", "macos", "windows"],
          "node": ["18", "20", "22"]
        }
      }
    }
  ],
  "output": "${{ steps.test.output }}"
}
```

This runs 9 parallel agent calls (3 OS x 3 Node versions). Each call receives the input with the parameter values appended.

### 8. Agents as Tools (Dynamic Delegation)

An orchestrator agent can call other agents as tools at runtime. The callable agent's `description` becomes the tool description, and its `input_schema` defines the tool parameters.

**YAML:**

```yaml
name: orchestrated-workflow
agents:
  product-lookup:
    description: "Look up product details by ID or search query"
    system_prompt: "Look up product information. Return JSON matching your output_schema."
    input_schema:
      type: object
      description: "Product lookup parameters"
      properties:
        product_id:
          type: string
          description: "Product ID to look up"
        search_query:
          type: string
          description: "Search term"
    output_schema:
      type: object
      description: "Product details"
      properties:
        name:
          type: string
        price:
          type: number
        stock:
          type: number
    mcp_servers: [medusa]

  inventory-checker:
    description: "Check inventory availability for a product"
    system_prompt: "Check inventory levels. Return JSON matching your output_schema."
    input_schema:
      type: object
      description: "Inventory check parameters"
      properties:
        product_id:
          type: string
          description: "Product ID to check"
      required: [product_id]
    output_schema:
      type: object
      description: "Inventory status"
      properties:
        available:
          type: boolean
        quantity:
          type: number
    mcp_servers: [medusa]

  orchestrator:
    description: "Shopping assistant that coordinates specialists"
    system_prompt: |
      You are a shopping assistant. You have tools to look up products
      and check inventory.    input_schema:
      type: string
      description: "User's shopping request"
    output_schema:
      type: string
      description: "Response to the user"

    can_call_agents:
      - product-lookup
      - inventory-checker

steps:
  - id: assist
    agent: orchestrator
    input: "${{ trigger.message }}"

output: "${{ steps.assist.output }}"
```

**JSON:**

```json
{
  "name": "orchestrated-workflow",
  "agents": {
    "product-lookup": {
      "description": "Look up product details by ID or search query",
      "system_prompt": "Look up product information. Return JSON matching your output_schema.",
      "input_schema": {
        "type": "object",
        "description": "Product lookup parameters",
        "properties": {
          "product_id": { "type": "string", "description": "Product ID to look up" },
          "search_query": { "type": "string", "description": "Search term" }
        }
      },
      "output_schema": {
        "type": "object",
        "description": "Product details",
        "properties": {
          "name": { "type": "string" },
          "price": { "type": "number" },
          "stock": { "type": "number" }
        }
      },
      "mcp_servers": ["medusa"]
    },
    "inventory-checker": {
      "description": "Check inventory availability for a product",
      "system_prompt": "Check inventory levels. Return JSON matching your output_schema.",
      "input_schema": {
        "type": "object",
        "description": "Inventory check parameters",
        "properties": {
          "product_id": { "type": "string", "description": "Product ID to check" }
        },
        "required": ["product_id"]
      },
      "output_schema": {
        "type": "object",
        "description": "Inventory status",
        "properties": {
          "available": { "type": "boolean" },
          "quantity": { "type": "number" }
        }
      },
      "mcp_servers": ["medusa"]
    },
    "orchestrator": {
      "description": "Shopping assistant that coordinates specialists",
      "system_prompt": "You are a shopping assistant. You have tools to look up products\nand check inventory.\n",
      "input_schema": { "type": "string", "description": "User's shopping request" },
      "output_schema": { "type": "string", "description": "Response to the user" },
      "can_call_agents": ["product-lookup", "inventory-checker"]
    }
  },
  "steps": [
    { "id": "assist", "agent": "orchestrator", "input": "${{ trigger.message }}" }
  ],
  "output": "${{ steps.assist.output }}"
}
```

### 9. Structured Outputs

Agents with `output_schema` of type `object` produce typed output accessible via `steps.<id>.output.*`. The output preserves its type — when an agent returns a dict, `steps.<id>.output` is a dict, and fields are accessed via `steps.<id>.output.field`.

**YAML:**

```yaml
name: structured-workflow
agents:
  analyzer:
    description: "Analyze user request"
    system_prompt: |
      Analyze the user's request and output JSON with fields:
      intent, entities, confidence, requires_action.
    input_schema:
      type: string
      description: "User message"
    output_schema:
      type: object
      description: "Analysis result"
      properties:
        intent:
          type: string
        entities:
          type: array
        confidence:
          type: number
        requires_action:
          type: boolean
      required: [intent, confidence]

  handler:
    description: "Handle analyzed request"
    system_prompt: "Handle the request based on the analysis."
    input_schema:
      type: string
      description: "Analysis context"
    output_schema:
      type: string
      description: "Response"


steps:
  - id: analyze
    agent: analyzer
    input: "${{ trigger.message }}"

  - id: handle
    agent: handler
    input: |
      Intent: ${{ steps.analyze.output.intent }}
      Entities: ${{ steps.analyze.output.entities }}
      Confidence: ${{ steps.analyze.output.confidence }}
      Original: ${{ trigger.message }}
    if: "${{ steps.analyze.output.requires_action }}"
    needs: [analyze]

output:
  response: "${{ steps.handle.output }}"
  analysis: "${{ steps.analyze.output }}"
```

**JSON:**

```json
{
  "name": "structured-workflow",
  "agents": {
    "analyzer": {
      "description": "Analyze user request",
      "system_prompt": "Analyze the user's request and output JSON with fields:\nintent, entities, confidence, requires_action.\n",
      "input_schema": { "type": "string", "description": "User message" },
      "output_schema": {
        "type": "object",
        "description": "Analysis result",
        "properties": {
          "intent": { "type": "string" },
          "entities": { "type": "array" },
          "confidence": { "type": "number" },
          "requires_action": { "type": "boolean" }
        },
        "required": ["intent", "confidence"]
      }
    },
    "handler": {
      "description": "Handle analyzed request",
      "system_prompt": "Handle the request based on the analysis.",
      "input_schema": { "type": "string", "description": "Analysis context" },
      "output_schema": { "type": "string", "description": "Response" },

    }
  },
  "steps": [
    { "id": "analyze", "agent": "analyzer", "input": "${{ trigger.message }}" },
    {
      "id": "handle",
      "agent": "handler",
      "input": "Intent: ${{ steps.analyze.output.intent }}\nEntities: ${{ steps.analyze.output.entities }}\nConfidence: ${{ steps.analyze.output.confidence }}\nOriginal: ${{ trigger.message }}\n",
      "if": "${{ steps.analyze.output.requires_action }}",
      "needs": ["analyze"]
    }
  ],
  "output": {
    "response": "${{ steps.handle.output }}",
    "analysis": "${{ steps.analyze.output }}"
  }
}
```

### 10. Shared Context Between Agents

Agents read and write to a shared mutable context using `read_context` and `write_context` tools.

**YAML:**

```yaml
name: context-workflow
agents:
  collector:
    description: "Gather product information from user"
    system_prompt: |
      Gather product information. Use write_context to store:
      - products: array of product IDs
      - quantity: total quantity
    input_schema:
      type: string
      description: "User message"
    output_schema:
      type: string
      description: "Confirmation"

    context_writes:
      products:
        type: array
        description: "List of product IDs"
      quantity:
        type: number
        description: "Total quantity"

  calculator:
    description: "Calculate pricing"
    system_prompt: |
      Calculate pricing for the products.
      Use read_context to get products and quantity.
      Use write_context to store the total.
    input_schema:
      type: string
      description: "Calculation request"
    output_schema:
      type: string
      description: "Price summary"
    mcp_servers: [medusa]
    context_reads: [products, quantity]
    context_writes:
      total:
        type: number
        description: "Calculated total"

  presenter:
    description: "Present order summary"
    system_prompt: |
      Present the order summary using read_context.
    input_schema:
      type: string
      description: "Presentation request"
    output_schema:
      type: string
      description: "Summary"

    context_reads: [products, quantity, total]

steps:
  - id: collect
    agent: collector
    input: "${{ trigger.message }}"

  - id: calculate
    agent: calculator
    input: "Calculate pricing for the collected products"
    needs: [collect]

  - id: present
    agent: presenter
    input: "Present the order summary"
    needs: [calculate]

output:
  response: "${{ steps.present.output }}"
  order:
    products: "${{ context.products }}"
    quantity: "${{ context.quantity }}"
    total: "${{ context.total }}"
```

**JSON:**

```json
{
  "name": "context-workflow",
  "agents": {
    "collector": {
      "description": "Gather product information from user",
      "system_prompt": "Gather product information. Use write_context to store:\n- products: array of product IDs\n- quantity: total quantity\n",
      "input_schema": { "type": "string", "description": "User message" },
      "output_schema": { "type": "string", "description": "Confirmation" },
      "context_writes": {
        "products": { "type": "array", "description": "List of product IDs" },
        "quantity": { "type": "number", "description": "Total quantity" }
      }
    },
    "calculator": {
      "description": "Calculate pricing",
      "system_prompt": "Calculate pricing for the products.\nUse read_context to get products and quantity.\nUse write_context to store the total.\n",
      "input_schema": { "type": "string", "description": "Calculation request" },
      "output_schema": { "type": "string", "description": "Price summary" },
      "mcp_servers": ["medusa"],
      "context_reads": ["products", "quantity"],
      "context_writes": {
        "total": { "type": "number", "description": "Calculated total" }
      }
    },
    "presenter": {
      "description": "Present order summary",
      "system_prompt": "Present the order summary using read_context.",
      "input_schema": { "type": "string", "description": "Presentation request" },
      "output_schema": { "type": "string", "description": "Summary" },
      "context_reads": ["products", "quantity", "total"]
    }
  },
  "steps": [
    { "id": "collect", "agent": "collector", "input": "${{ trigger.message }}" },
    { "id": "calculate", "agent": "calculator", "input": "Calculate pricing for the collected products", "needs": ["collect"] },
    { "id": "present", "agent": "presenter", "input": "Present the order summary", "needs": ["calculate"] }
  ],
  "output": {
    "response": "${{ steps.present.output }}",
    "order": {
      "products": "${{ context.products }}",
      "quantity": "${{ context.quantity }}",
      "total": "${{ context.total }}"
    }
  }
}
```

### 11. Retry and Error Handling

Configure retries per step and error handlers at step or workflow level.

**YAML:**

```yaml
name: resilient-workflow
variables:
  max_retries: 3

agents:
  fetcher:
    description: "Fetch external data"
    system_prompt: "Fetch data from the external API."
    input_schema:
      type: string
      description: "Query"
    output_schema:
      type: string
      description: "API response"
    mcp_servers: [medusa]

  fallback:
    description: "Provide fallback response"
    system_prompt: "Provide a helpful fallback response when the main service is unavailable."
    input_schema:
      type: string
      description: "Error context"
    output_schema:
      type: string
      description: "Fallback response"


  responder:
    description: "Format response"
    system_prompt: "Format the data into a user-friendly response."
    input_schema:
      type: string
      description: "Raw data"
    output_schema:
      type: string
      description: "Formatted response"


steps:
  - id: fetch
    agent: fetcher
    input: "${{ trigger.message }}"
    timeout: 30
    continue_on_error: true
    retry:
      max_attempts: 3
      backoff: exponential
      delay_seconds: 2.0
    on_failure:
      agent: fallback
      message: "The service is temporarily unavailable. Using cached data."

  - id: respond
    agent: responder
    input: "${{ steps.fetch.output }}"
    if: "${{ steps.fetch.status == 'success' }}"
    needs: [fetch]

output: "${{ steps.respond.output }}${{ steps.fetch.output }}"

on_failure:
  message: "We encountered an unexpected error. Please try again later."
```

**JSON:**

```json
{
  "name": "resilient-workflow",
  "variables": { "max_retries": 3 },
  "agents": {
    "fetcher": {
      "description": "Fetch external data",
      "system_prompt": "Fetch data from the external API.",
      "input_schema": { "type": "string", "description": "Query" },
      "output_schema": { "type": "string", "description": "API response" },
      "mcp_servers": ["medusa"]
    },
    "fallback": {
      "description": "Provide fallback response",
      "system_prompt": "Provide a helpful fallback response when the main service is unavailable.",
      "input_schema": { "type": "string", "description": "Error context" },
      "output_schema": { "type": "string", "description": "Fallback response" },

    },
    "responder": {
      "description": "Format response",
      "system_prompt": "Format the data into a user-friendly response.",
      "input_schema": { "type": "string", "description": "Raw data" },
      "output_schema": { "type": "string", "description": "Formatted response" },

    }
  },
  "steps": [
    {
      "id": "fetch",
      "agent": "fetcher",
      "input": "${{ trigger.message }}",
      "timeout": 30,
      "continue_on_error": true,
      "retry": {
        "max_attempts": 3,
        "backoff": "exponential",
        "delay_seconds": 2.0
      },
      "on_failure": {
        "agent": "fallback",
        "message": "The service is temporarily unavailable. Using cached data."
      }
    },
    {
      "id": "respond",
      "agent": "responder",
      "input": "${{ steps.fetch.output }}",
      "if": "${{ steps.fetch.status == 'success' }}",
      "needs": ["fetch"]
    }
  ],
  "output": "${{ steps.respond.output }}${{ steps.fetch.output }}",
  "on_failure": {
    "message": "We encountered an unexpected error. Please try again later."
  }
}
```

### 12. Fail-Fast Workflow

Stop the entire workflow immediately when any step fails.

**YAML:**

```yaml
name: strict-pipeline
fail_fast: true

agents:
  validator:
    description: "Validate input data"
    system_prompt: "Validate the input. Return JSON with valid (boolean) and errors (array)."
    input_schema:
      type: string
      description: "Data to validate"
    output_schema:
      type: object
      description: "Validation result"
      properties:
        valid:
          type: boolean
        errors:
          type: array

  processor:
    description: "Process validated data"
    system_prompt: "Process the validated data."
    input_schema:
      type: string
      description: "Validated data"
    output_schema:
      type: string
      description: "Processing result"

steps:
  - id: validate
    agent: validator
    input: "${{ trigger.message }}"

  - id: process
    agent: processor
    input: "${{ steps.validate.output }}"
    if: "${{ steps.validate.output.valid }}"
    needs: [validate]

output: "${{ steps.process.output }}"
```

**JSON:**

```json
{
  "name": "strict-pipeline",
  "fail_fast": true,
  "agents": {
    "validator": {
      "description": "Validate input data",
      "system_prompt": "Validate the input. Return JSON with valid (boolean) and errors (array).",
      "input_schema": { "type": "string", "description": "Data to validate" },
      "output_schema": {
        "type": "object",
        "description": "Validation result",
        "properties": {
          "valid": { "type": "boolean" },
          "errors": { "type": "array" }
        }
      }
    },
    "processor": {
      "description": "Process validated data",
      "system_prompt": "Process the validated data.",
      "input_schema": { "type": "string", "description": "Validated data" },
      "output_schema": { "type": "string", "description": "Processing result" }
    }
  },
  "steps": [
    { "id": "validate", "agent": "validator", "input": "${{ trigger.message }}" },
    {
      "id": "process",
      "agent": "processor",
      "input": "${{ steps.validate.output }}",
      "if": "${{ steps.validate.output.valid }}",
      "needs": ["validate"]
    }
  ],
  "output": "${{ steps.process.output }}"
}
```

### 13. Variables and Dynamic System Prompts

Workflow-level variables provide defaults. System prompts are evaluated at step runtime with access to `context.*`, `steps.*`, and `variables.*`.

**YAML:**

```yaml
name: personalized-workflow
variables:
  tone: friendly
  max_length: 500
  language: english

agents:
  analyzer:
    description: "Analyze message"
    system_prompt: "Analyze the message. Return JSON with intent and sentiment."
    input_schema:
      type: string
      description: "Message"
    output_schema:
      type: object
      description: "Analysis"
      properties:
        intent:
          type: string
        sentiment:
          type: string

  responder:
    description: "Generate personalized response"
    system_prompt: |
      You are a ${{ variables.tone }} assistant for ${{ context.store_name }}.
      Respond in ${{ variables.language }}.
      Keep responses under ${{ variables.max_length }} characters.

      Customer analysis:
      - Intent: ${{ steps.analyze.output.intent }}
      - Sentiment: ${{ steps.analyze.output.sentiment }}

      Adjust your tone based on the sentiment.    input_schema:
      type: string
      description: "Customer message"
    output_schema:
      type: string
      description: "Personalized response"


steps:
  - id: analyze
    agent: analyzer
    input: "${{ trigger.message }}"

  - id: respond
    agent: responder
    input: "${{ trigger.message }}"
    needs: [analyze]

output: "${{ steps.respond.output }}"
```

**JSON:**

```json
{
  "name": "personalized-workflow",
  "variables": {
    "tone": "friendly",
    "max_length": 500,
    "language": "english"
  },
  "agents": {
    "analyzer": {
      "description": "Analyze message",
      "system_prompt": "Analyze the message. Return JSON with intent and sentiment.",
      "input_schema": { "type": "string", "description": "Message" },
      "output_schema": {
        "type": "object",
        "description": "Analysis",
        "properties": {
          "intent": { "type": "string" },
          "sentiment": { "type": "string" }
        }
      }
    },
    "responder": {
      "description": "Generate personalized response",
      "system_prompt": "You are a ${{ variables.tone }} assistant for ${{ context.store_name }}.\nRespond in ${{ variables.language }}.\nKeep responses under ${{ variables.max_length }} characters.\n\nCustomer analysis:\n- Intent: ${{ steps.analyze.output.intent }}\n- Sentiment: ${{ steps.analyze.output.sentiment }}\n\nAdjust your tone based on the sentiment.\n",
      "input_schema": { "type": "string", "description": "Customer message" },
      "output_schema": { "type": "string", "description": "Personalized response" },

    }
  },
  "steps": [
    { "id": "analyze", "agent": "analyzer", "input": "${{ trigger.message }}" },
    { "id": "respond", "agent": "responder", "input": "${{ trigger.message }}", "needs": ["analyze"] }
  ],
  "output": "${{ steps.respond.output }}"
}
```

### 14. Workflow Chaining (Sub-Workflows)

A step can execute an entire sub-workflow instead of a single agent. The sub-workflow has its own agents, steps, and output.

**YAML:**

```yaml
name: parent-workflow
agents:
  router:
    description: "Route to appropriate sub-workflow"
    system_prompt: "Classify the request. Respond: order or product."
    input_schema:
      type: string
      description: "User request"
    output_schema:
      type: string
      description: "Category"

steps:
  - id: route
    agent: router
    input: "${{ trigger.message }}"

  - id: handle-order
    if: "${{ steps.route.output == 'order' }}"
    needs: [route]
    sub_workflow:
      name: order-handler
      agents:
        lookup:
          description: "Look up order"
          system_prompt: "Look up the order details."
          input_schema:
            type: string
            description: "Order query"
          output_schema:
            type: string
            description: "Order details"
          mcp_servers: [medusa]
        responder:
          description: "Respond about order"
          system_prompt: "Respond to the customer about their order."
          input_schema:
            type: string
            description: "Order context"
          output_schema:
            type: string
            description: "Response"
      
      steps:
        - id: lookup
          agent: lookup
          input: "${{ trigger.message }}"
        - id: respond
          agent: responder
          input: "Order info: ${{ steps.lookup.output }}"
          needs: [lookup]
      output: "${{ steps.respond.output }}"

  - id: handle-product
    if: "${{ steps.route.output == 'product' }}"
    needs: [route]
    sub_workflow:
      name: product-handler
      agents:
        search:
          description: "Search products"
          system_prompt: "Search for products."
          input_schema:
            type: string
            description: "Search query"
          output_schema:
            type: string
            description: "Search results"
          mcp_servers: [medusa]
        responder:
          description: "Respond about products"
          system_prompt: "Present product results."
          input_schema:
            type: string
            description: "Product context"
          output_schema:
            type: string
            description: "Response"
      
      steps:
        - id: search
          agent: search
          input: "${{ trigger.message }}"
        - id: respond
          agent: responder
          input: "Products: ${{ steps.search.output }}"
          needs: [search]
      output: "${{ steps.respond.output }}"

output: "${{ steps.handle-order.output }}${{ steps.handle-product.output }}"
```

**JSON:**

```json
{
  "name": "parent-workflow",
  "agents": {
    "router": {
      "description": "Route to appropriate sub-workflow",
      "system_prompt": "Classify the request. Respond: order or product.",
      "input_schema": { "type": "string", "description": "User request" },
      "output_schema": { "type": "string", "description": "Category" }
    }
  },
  "steps": [
    { "id": "route", "agent": "router", "input": "${{ trigger.message }}" },
    {
      "id": "handle-order",
      "if": "${{ steps.route.output == 'order' }}",
      "needs": ["route"],
      "sub_workflow": {
        "name": "order-handler",
        "agents": {
          "lookup": {
            "description": "Look up order",
            "system_prompt": "Look up the order details.",
            "input_schema": { "type": "string", "description": "Order query" },
            "output_schema": { "type": "string", "description": "Order details" },
            "mcp_servers": ["medusa"]
          },
          "responder": {
            "description": "Respond about order",
            "system_prompt": "Respond to the customer about their order.",
            "input_schema": { "type": "string", "description": "Order context" },
            "output_schema": { "type": "string", "description": "Response" },
  
          }
        },
        "steps": [
          { "id": "lookup", "agent": "lookup", "input": "${{ trigger.message }}" },
          { "id": "respond", "agent": "responder", "input": "Order info: ${{ steps.lookup.output }}", "needs": ["lookup"] }
        ],
        "output": "${{ steps.respond.output }}"
      }
    },
    {
      "id": "handle-product",
      "if": "${{ steps.route.output == 'product' }}",
      "needs": ["route"],
      "sub_workflow": {
        "name": "product-handler",
        "agents": {
          "search": {
            "description": "Search products",
            "system_prompt": "Search for products.",
            "input_schema": { "type": "string", "description": "Search query" },
            "output_schema": { "type": "string", "description": "Search results" },
            "mcp_servers": ["medusa"]
          },
          "responder": {
            "description": "Respond about products",
            "system_prompt": "Present product results.",
            "input_schema": { "type": "string", "description": "Product context" },
            "output_schema": { "type": "string", "description": "Response" },
  
          }
        },
        "steps": [
          { "id": "search", "agent": "search", "input": "${{ trigger.message }}" },
          { "id": "respond", "agent": "responder", "input": "Products: ${{ steps.search.output }}", "needs": ["search"] }
        ],
        "output": "${{ steps.respond.output }}"
      }
    }
  ],
  "output": "${{ steps.handle-order.output }}${{ steps.handle-product.output }}"
}
```

Sub-workflows inherit the parent's `workflow_run_id` and shared context. The sub-workflow's resolved `output` becomes the parent step's `output`.

---

## MCP Servers

Agents can use MCP (Model Context Protocol) servers for external tools.

### Available Servers

| Server | Description |
|--------|-------------|
| `messaging` | Send intermediate updates to users (`send_text`, `send_thinking`) |
| `medusa` | E-commerce operations (products, categories, orders) |

### Messaging Tools

- **`send_text(workflow_run_id, content)`**: Send intermediate text updates or progress to the user. **Not for final responses** — the agent's return value is delivered automatically via `end_of_turn`.
- **`send_thinking(workflow_run_id, content)`**: Send reasoning/thinking (shown differently in UI).

### Context Tools

Agents with `context_reads` or `context_writes` automatically get these tools:

- **`read_context(key)`**: Read a value from shared context (only allowed keys).
- **`write_context(key, value)`**: Write a JSON value to shared context (only allowed keys).

---

## Response Events

Subscribe to `workflow:{workflow_run_id}` to receive these events:

### thinking

```json
{
  "type": "thinking",
  "workflow_run_id": "run-123",
  "payload": { "content": "Let me analyze this..." }
}
```

### text_delta

```json
{
  "type": "text_delta",
  "workflow_run_id": "run-123",
  "payload": { "content": "Here's what I found..." }
}
```

### step_start

```json
{
  "type": "step_start",
  "workflow_run_id": "run-123",
  "payload": { "step_id": "analyze", "agent": "analyzer" }
}
```

### end_of_turn

```json
{
  "type": "end_of_turn",
  "workflow_run_id": "run-123",
  "payload": {
    "content": "Final output text",
    "structured": null,
    "data": {
      "workflow": "workflow-name",
      "steps": {
        "step-id": {
          "step_id": "step-id",
          "status": "success",
          "output": "Raw text response",
          "structured": { "intent": "order" }
        }
      },
      "history": [],
      "trace": {
        "workflow_name": "workflow-name",
        "workflow_run_id": "run-123",
        "started_at": "2026-02-01T00:00:00+00:00",
        "finished_at": "2026-02-01T00:00:05+00:00",
        "duration_ms": 5000,
        "status": "success",
        "step_traces": [
          {
            "step_id": "step-id",
            "agent": "agent-name",
            "status": "success",
            "started_at": "2026-02-01T00:00:00+00:00",
            "finished_at": "2026-02-01T00:00:04+00:00",
            "duration_ms": 4000,
            "attempt": 1,
            "error": null
          }
        ]
      }
    }
  }
}
```

### error

```json
{
  "type": "error",
  "workflow_run_id": "run-123",
  "payload": {
    "message": "Error description",
    "code": "WORKFLOW_ERROR"
  }
}
```

Error codes: `WORKFLOW_VALIDATION_ERROR` (invalid definition), `WORKFLOW_ERROR` (runtime failure).

---

## Pre-Execution Validation

Workflows are validated before execution. The validator checks:

- At least one agent is defined with `description` and `system_prompt`
- At least one step is defined
- Every step references an existing agent or has a `sub_workflow`
- No duplicate step IDs
- All step dependencies exist and are not self-referential
- No circular dependencies in the step graph
- All expressions reference valid roots (`trigger`, `steps`, `context`, `variables`)
- Sub-workflows are recursively validated

Invalid workflows return a `WORKFLOW_VALIDATION_ERROR` event with details.

---

## Execution Traces

Every workflow execution produces a trace included in the `end_of_turn` event under `data.trace`. The trace contains:

- Workflow-level timing (start, end, total duration in ms)
- Per-step timing with agent name, status, attempt count, and error details
- Overall workflow status (`success`, `failure`, `cancelled`)

Use traces to monitor performance, identify bottlenecks, and debug failures.

---

## API Gateway Integration

The API Gateway constructs workflow definitions dynamically and publishes them via Redis. A typical integration:

```typescript
import { parse as parseYaml } from 'yaml';
import { readFileSync } from 'fs';

class WorkflowService {
  private workflows: Map<string, object> = new Map();

  loadWorkflow(name: string, path: string) {
    const content = readFileSync(path, 'utf-8');
    const ext = path.split('.').pop();
    this.workflows.set(
      name,
      ext === 'json' ? JSON.parse(content) : parseYaml(content)
    );
  }

  async executeWorkflow(
    pubsub: PubSubService,
    workflowRunId: string,
    workflowName: string,
    message: string,
    context: Record<string, unknown> = {},
    history: unknown[] = []
  ) {
    const workflow = this.workflows.get(workflowName);
    if (!workflow) throw new Error(`Workflow not found: ${workflowName}`);

    await pubsub.publish(`workflow:${workflowRunId}`, {
      type: 'workflow',
      workflow_run_id: workflowRunId,
      payload: {
        content: message,
        context,
        history,
        workflow,
      },
    });
  }
}
```

---

## Best Practices

1. **Do not instruct agents to use `send_text` for their final response.** The agent's return value is automatically delivered to the user via `end_of_turn`. Use `send_text` only for intermediate progress updates during long-running tasks.

2. **Use routing for complex intents** rather than one large prompt trying to handle everything.

3. **Parallelize independent analysis** to reduce total latency. Steps without `needs` run concurrently.

4. **Keep system prompts focused** - each agent should have a single responsibility.

5. **Use conditions for branching** rather than having agents decide execution paths.

6. **Define `input_schema` and `output_schema`** on every agent for validation and when using agents as tools.

7. **Use `continue_on_error: true`** for non-critical steps to keep the workflow running.

8. **Set timeouts** on steps that call external services to prevent indefinite hangs.

9. **Use retry with exponential backoff** for steps that depend on external APIs.

10. **Use variables** for configuration that might change between deployments without modifying the workflow definition.

11. **Use shared context** for data that needs to flow between agents outside of the step dependency graph.

12. **Use sub-workflows** to encapsulate complex logic into reusable, self-contained units.
