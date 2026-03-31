# AI Agent Instructions for WC-Charts Modification

This file is part of the `wc-charts` ecosystem, designed as a template and set of rules for **AI Coding Assistants** (like Antigravity / Gemini) dealing with this workspace. 

## Architectural Rules

If you are tasked to modify or add functionality to the web component `<wc-chart>`, you must adhere to the following logic paradigm:

1. **Rule Limit Component Logic:**
   - The `<wc-chart>` (inside `wc-chart.js`) is just a proxy/shell component. It only handles registering `template` appending to the Shadow DOM, lifecycle events (`connectedCallback`, `attributeChangedCallback`), parsing `type="XXX"`, and passing its `shadowRoot` downwards. 
   - DO NOT write rendering logic directly inside `wc-chart.js`. DO NOT parse data sets specifically for a chart type in `wc-chart.js`. That violates the single source of truth.

2. **Rule Extend Pattern With 'Config':**
   - New chart types MUST be implemented inside the `src/charts/` folder as independent classes.
   - You MUST export the Class and register it inside `wc-chart.js` explicitly using `Config.registerChart(type, ClassSource)` or let the consumer register it.
   - The class signature is always:
     ```javascript
     export class AnyChart {
         constructor({ el, shadow, emitEvent }) { ... }
         onAttributeChanged(name, oldValue, newValue) { ... } 
     }
     ```
   - The `emitEvent` callback is provided so your Chart Class can dispatch standard events upwards (like `updated`, `before-mount`, etc.)

3. **CSS Extensibility:**
   - Always map the core CSS wrapper to respect CSS vars prefixed with `--wc-chart-*`.
   - Never use `!important` tags for canvas sizes because ChartJS manages the intrinsic aspect-ratio and high DPI resolution inline on the canvas element context. A fixed wrapper `height: var(--wc-chart-height, 400px);` handles boundary sizes beautifully.

4. **Framework Agnostic Context:**
   - Ensure the component is loadable in `<script type="module">`.
   - Never import `Chart` class from node_modules. Assume `chart.umd.js` is globally bundled and loaded via `<script>`, meaning the global variable `Chart` is available anywhere.

5. **JSON Attribute Parsing Structure:**
   - To keep inputs clean on Vanilla HTML, the arrays for X and Y plotting must be parsed using `JSON.parse` through attributes. Example:
   ```html
   <wc-chart x='["A", "B"]' y="[10, 20]"></wc-chart>
   ```

**Use these architecture foundations to guide yourself before executing code changes. Maintain clean separation.**
