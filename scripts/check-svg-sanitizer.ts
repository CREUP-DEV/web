#!/usr/bin/env tsx
/**
 * Exercises the uploaded-SVG sanitizer against known attack payloads and against markup real
 * exporters produce. Fails with a non-zero exit code if a payload survives or a legitimate
 * drawing is rejected.
 *
 * Usage: tsx scripts/check-svg-sanitizer.ts
 */
import { readFileSync } from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { SvgSanitizeError, sanitizeSvgMarkup } from '../server/utils/admin/svgSanitizer'

const __dirname = dirname(fileURLToPath(import.meta.url))
const PROJECT_ROOT = resolve(__dirname, '..')

const SVG_OPEN = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10">'
const XLINK = ' xmlns:xlink="http://www.w3.org/1999/xlink"'

/** Markup the sanitizer must refuse outright. */
const rejected: Array<{ name: string; markup: string }> = [
  {
    name: 'script element',
    markup: `${SVG_OPEN}<script>alert(1)</script><rect width="5" height="5"/></svg>`,
  },
  {
    name: 'script element behind a namespace prefix',
    markup: `${SVG_OPEN}<x:script xmlns:x="http://www.w3.org/1999/xhtml">alert(1)</x:script></svg>`,
  },
  {
    name: 'foreignObject',
    markup: `${SVG_OPEN}<foreignObject width="10" height="10"><b>hi</b></foreignObject></svg>`,
  },
  { name: 'iframe', markup: `${SVG_OPEN}<iframe src="https://evil.test/"/></svg>` },
  { name: 'embed', markup: `${SVG_OPEN}<embed src="https://evil.test/"/></svg>` },
  { name: 'animate', markup: `${SVG_OPEN}<animate attributeName="href" to="javascript:1"/></svg>` },
  { name: 'animateColor', markup: `${SVG_OPEN}<animateColor attributeName="fill"/></svg>` },
  {
    name: 'animateTransform',
    markup: `${SVG_OPEN}<animateTransform attributeName="transform"/></svg>`,
  },
  { name: 'set', markup: `${SVG_OPEN}<set attributeName="fill" to="red"/></svg>` },
  {
    name: 'handler',
    markup: `${SVG_OPEN}<handler type="text/ecmascript">alert(1)</handler></svg>`,
  },
  { name: 'discard', markup: `${SVG_OPEN}<discard begin="0"/></svg>` },
  {
    name: 'style element with @import',
    markup: `${SVG_OPEN}<style>@import url(https://evil.test/x.css);</style></svg>`,
  },
  {
    name: 'style element with an external url()',
    markup: `${SVG_OPEN}<style>rect{fill:url(https://evil.test/x)}</style></svg>`,
  },
  {
    name: 'style element with external CSS inside CDATA',
    markup: `${SVG_OPEN}<style><![CDATA[rect{fill:url(https://evil.test/x)}]]></style></svg>`,
  },
  { name: 'non-SVG root element', markup: '<html><body>no</body></html>' },
  { name: 'plain text', markup: 'hello world' },
  { name: 'truncated markup', markup: '<svg' },
  { name: 'empty input', markup: '   ' },
]

/**
 * Markup the sanitizer must accept, paired with substrings that must not survive it. An empty
 * `absent` list asserts the drawing passes untouched.
 */
const accepted: Array<{ name: string; markup: string; absent: string[] }> = [
  {
    name: 'inline event handler on the root element',
    markup: `${SVG_OPEN.replace('>', ' onload="alert(1)">')}<rect width="5" height="5"/></svg>`,
    absent: ['onload'],
  },
  {
    name: 'inline event handlers on a child element',
    markup: `${SVG_OPEN}<rect width="5" height="5" onclick="alert(1)" onmouseover="alert(2)"/></svg>`,
    absent: ['onclick', 'onmouseover'],
  },
  {
    name: 'javascript: link',
    markup: `${SVG_OPEN}${XLINK}<a xlink:href="javascript:alert(1)"><rect width="5" height="5"/></a></svg>`,
    absent: ['javascript:'],
  },
  {
    name: 'external image reference',
    markup: `${SVG_OPEN}<image href="https://evil.test/pixel.png" width="5" height="5"/></svg>`,
    absent: ['evil.test'],
  },
  {
    name: 'external url() in a style attribute',
    markup: `${SVG_OPEN}<rect width="5" height="5" style="fill:url(https://evil.test/x)"/></svg>`,
    absent: ['evil.test'],
  },
  {
    name: 'external url() in stroke and stop-color',
    markup: `${SVG_OPEN}<rect width="5" height="5" stroke="url(https://evil.test/a)" stop-color="url('https://evil.test/b')"/></svg>`,
    absent: ['evil.test'],
  },
  {
    name: 'external url() in filter and mask',
    markup: `${SVG_OPEN}<rect width="5" height="5" filter="url(https://evil.test/a)" mask="url(https://evil.test/b)"/></svg>`,
    absent: ['evil.test'],
  },
  {
    name: 'gradient and clip-path drawing',
    markup: `${SVG_OPEN}<defs><linearGradient id="g"><stop offset="0" stop-color="#fff"/><stop offset="1" stop-color="#000"/></linearGradient><clipPath id="c"><circle cx="5" cy="5" r="4"/></clipPath></defs><g clip-path="url(#c)"><path d="M0 0h10v10H0z" fill="url(#g)"/></g></svg>`,
    absent: [],
  },
  {
    name: 'filter chain drawing',
    markup: `${SVG_OPEN}<defs><filter id="f"><feGaussianBlur stdDeviation="1"/><feOffset dx="1" dy="1"/><feMerge><feMergeNode/></feMerge></filter></defs><rect width="5" height="5" filter="url(#f)"/></svg>`,
    absent: [],
  },
  {
    name: 'exported drawing with an inline stylesheet',
    markup: `${SVG_OPEN}<style>.cls-1{fill:#e2001a;stroke:#000}</style><title>Logo</title><g><path class="cls-1" d="M0 0h10v10H0z"/><use href="#none"/></g></svg>`,
    absent: [],
  },
  {
    name: 'text drawing',
    markup: `${SVG_OPEN}<text x="0" y="5"><tspan fill="#000">CREUP</tspan></text></svg>`,
    absent: [],
  },
]

/** Real assets shipped with the site: whatever else changes, these must keep uploading. */
const projectAssets = [
  'public/favicon.svg',
  'public/nav/creup-site-header-logo-dark.svg',
  'public/nav/creup-site-header-logo-light.svg',
]

let hasErrors = false

const fail = (message: string) => {
  hasErrors = true
  console.error(`✗ ${message}`)
}

for (const { name, markup } of rejected) {
  try {
    const output = sanitizeSvgMarkup(markup)
    fail(`${name} — expected a rejection, got: ${output}`)
  } catch (error) {
    if (!(error instanceof SvgSanitizeError)) {
      fail(`${name} — threw an unexpected error: ${String(error)}`)
    }
  }
}

for (const { name, markup, absent } of accepted) {
  let output: string

  try {
    output = sanitizeSvgMarkup(markup)
  } catch (error) {
    fail(`${name} — expected the drawing to survive, was rejected: ${String(error)}`)
    continue
  }

  for (const needle of absent) {
    if (output.toLowerCase().includes(needle.toLowerCase())) {
      fail(`${name} — "${needle}" survived sanitization: ${output}`)
    }
  }
}

for (const assetPath of projectAssets) {
  const markup = readFileSync(resolve(PROJECT_ROOT, assetPath), 'utf8')

  try {
    sanitizeSvgMarkup(markup)
  } catch (error) {
    fail(`${assetPath} — a shipped asset no longer passes sanitization: ${String(error)}`)
  }
}

if (hasErrors) {
  process.exit(1)
}

const checks = rejected.length + accepted.length + projectAssets.length
console.log(`✓ SVG sanitizer — ${checks} checks passed`)
