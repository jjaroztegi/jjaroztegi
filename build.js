import fs from 'fs';

// Colours of aroztegi.com
const theme = {
  bg: '#181818',
  fg: '#e4e4e4',
  muted: '#a0a0a0',
  highlight: '#ffdd33',
  warm: '#cc8c3c',
  green: '#73d936',
};

// AROZTEGI in the block letters of aroztegi.com and its curl profile, one character per cell
const WORDMARK = [
  ' █████  ██████   ██████  ███████  ███████ ███████  ██████  ██',
  '██   ██ ██   ██ ██    ██    ███     ██    ██      ██       ██',
  '███████ ██████  ██    ██   ███      ██    █████   ██   ███ ██',
  '██   ██ ██   ██ ██    ██  ███       ██    ██      ██    ██ ██',
  '██   ██ ██   ██  ██████  ███████    ██    ███████  ██████  ██',
];

// Names that a line break shouldn't split
const keep = (text) => text.replace(/ /g, '\u00a0');

// What the terminal types and prints. Text wraps between words to the layout's width; a table's values
// wrap under their own column, and parts move whole to the next line when they don't fit.
const session = [
  {
    command: 'curl -L aroztegi.com',
    output: [
      { gap: true },
      { wordmark: true },
      { gap: true },
      { parts: [['b', 'Juanjo Aroztegi'], ['m', 'AI engineer, telecom engineer']] },
      { gap: true },
      { text: 'I build LLM tools and agents, and measure how they behave before they ship.', cls: 'b' },
      { text: 'From model latency and retrieval accuracy down to SIP signalling and the packets on the wire.', cls: 'm' },
      { gap: true },
      {
        table: [
          ['focus', 'LLM tool use and MCP, evaluation, voice agents over SIP/RTP'],
          ['code', 'Python, TypeScript, C'],
          ['spoken', 'English, Spanish, Basque'],
          ['based', 'Spain'],
        ],
      },
    ],
  },
  {
    command: 'cat projects.txt',
    output: [
      {
        table: [
          ['rtpbench', 'times voice agents over SIP from the packets on the wire'],
          ['altitude-asl', `${keep('VS Code')} extension with a language server for ${keep('Altitude ASL')}`],
          ['upstream', `fixes merged in OpenSIPS and ${keep('AI Voice Connector CE')},`],
          ['', `others in LiveKit and ${keep('T3 Code')}`],
        ],
      },
    ],
  },
  { command: '' },
];

// The same session at two widths: the README shows the narrow one on phones
const layouts = [
  { file: 'profile.svg', cols: 84, pad: 3 },
  { file: 'profile-narrow.svg', cols: 50, pad: 2 },
];

// One terminal cell in SVG units. Iosevka advances 0.5em, so 20px text fills 10 units
const FONT = 20;
const CW = 10;
const LH = 26;
const BASELINE = 20;
const PAD_Y = 20;

// Timing, in seconds
const START = 0.4; // first prompt
const IDLE = 0.5; // prompt shown, nothing typed yet
const CHAR = 0.07; // per typed character
const ENTER = 0.3; // typed, before the output
const LINE = 0.04; // between output lines
const SWEEP = 0.9; // the wordmark's letters lighting up from the left
const PAUSE = 0.5; // output done, before the next prompt

// Iosevka regular and bold cut to printable ASCII (~6 KB each), embedded so the SVG renders the same
// everywhere. Regenerate from @fontsource/iosevka if other characters are needed:
//   pyftsubset iosevka-latin-400-normal.woff2 --unicodes=U+0020-007E --layout-features='' --no-hinting
//     --desubroutinize --name-IDs=0,1,2,3,4,5,6,13,14 --flavor=woff2 --output-file=fonts/iosevka-400.woff2
const font = (weight) =>
  fs.readFileSync(new URL(`fonts/iosevka-${weight}.woff2`, import.meta.url)).toString('base64');
const fonts = { 400: font(400), 700: font(700) };

const num = (n) => String(+n.toFixed(2));

function escapeXML(text) {
  text = text.replace(/\u00a0/g, ' ');
  if (/[^\x20-\x7e]/.test(text)) {
    throw new Error(`Not in the embedded font (printable ASCII only): ${JSON.stringify(text)}`);
  }
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function wrap(text, width) {
  const lines = [''];
  for (const word of text.split(' ')) {
    const line = lines[lines.length - 1];
    if (line && line.length + 1 + word.length > width) lines.push(word);
    else lines[lines.length - 1] = line ? `${line} ${word}` : word;
  }
  return lines;
}

// A row of output as lines of [column, class, text] segments
function rowLines(row, width) {
  if (row.text) return wrap(row.text, width).map((line) => [[0, row.cls, line]]);
  if (row.parts) {
    const lines = [[]];
    let col = 0;
    for (const [cls, text] of row.parts) {
      if (col > 0 && col + 2 + text.length > width) {
        lines.push([]);
        col = 0;
      }
      if (col > 0) col += 2;
      lines[lines.length - 1].push([col, cls, text]);
      col += text.length;
    }
    return lines;
  }
  const keyWidth = Math.max(...row.table.map(([key]) => key.length)) + 2;
  return row.table.flatMap(([key, value]) =>
    wrap(value, width - keyWidth).map((line, i) => [
      ...(i === 0 && key ? [[0, 'w', key]] : []),
      [keyWidth, '', line],
    ]),
  );
}

// Block (column i, row r) of the wordmark, warm to yellow as in one still frame of the home page's
// waves (the same colours as aroztegi.com's social card)
function blockColor(i, r) {
  const x = i * 17, y = r * 36;
  const q = (Math.cos(Math.hypot(x - 80, y - 420) / 14) + Math.cos(Math.hypot(x - 980, y + 60) / 14) + 2) / 4;
  const t = Math.min(3, Math.floor(q * 4)) / 3;
  const warm = [204, 140, 60], highlight = [255, 221, 51];
  return `#${warm.map((v, c) => Math.round(v + (highlight[c] - v) * t).toString(16).padStart(2, '0')).join('')}`;
}

// The letters as one path per (colour, moment): each block lights up as a wavefront from the letters'
// left edge reaches it
function wordmark(left, top, scale, start) {
  const w = CW * scale, h = LH * scale, gap = 1;
  const cy = top + (WORDMARK.length * h) / 2;
  const reach = Math.hypot(WORDMARK[0].length * w, (WORDMARK.length * h) / 2);
  const paths = new Map();
  WORDMARK.forEach((line, r) => [...line].forEach((c, i) => {
    if (c === ' ') return;
    const x = left + i * w, y = top + r * h;
    const delay = start + Math.round((SWEEP * Math.hypot(x + w / 2 - left, y + h / 2 - cy)) / reach / 0.03) * 0.03;
    const key = `${blockColor(i, r)} ${num(delay)}`;
    paths.set(key, (paths.get(key) ?? '') + `M${num(x)} ${num(y)}h${num(w - gap)}v${num(h - gap)}h${num(gap - w)}z`);
  }));
  return [...paths].map(([key, d]) => {
    const [fill, delay] = key.split(' ');
    return `<path class="f" fill="${fill}" style="animation-delay:${delay}s" d="${d}"/>`;
  }).join('\n');
}

function render({ cols, pad }) {
  const width = cols - 2 * pad;
  const left = pad * CW;
  const x = (col) => left + col * CW;
  const parts = [];
  const keyframes = [];
  let y = PAD_Y;
  let t = START;

  session.forEach(({ command, output }, index) => {
    if (index > 0) y += LH / 2;
    const cursor = (cls, style = '') =>
      `<rect class="${cls}"${style && ` style="${style}"`} x="${x(2)}" y="${y + 1}" width="${CW}" height="${LH - 2}"/>`;

    if (!output) {
      parts.push(`<g class="s" style="animation-delay:${num(t)}s"><text y="${y + BASELINE}"><tspan x="${x(0)}" class="g">$</tspan></text>${cursor('y blink')}</g>`);
      y += LH;
      return;
    }

    // The cursor sits at the prompt, then steps right one cell per character as each one appears; it
    // goes when the command is entered
    const n = command.length;
    const typing = t + IDLE;
    const entered = typing + n * CHAR + ENTER;
    const typed = [...command].map((c, i) =>
      c === ' ' ? ' ' : `<tspan class="v" style="animation-delay:${num(typing + (i + 1) * CHAR)}s">${escapeXML(c)}</tspan>`).join('');
    keyframes.push(`@keyframes t${index} { to { transform: translateX(${n * CW}px); } }`);
    parts.push(
      `<g class="s" style="animation-delay:${num(t)}s">` +
        `<text y="${y + BASELINE}"><tspan x="${x(0)}" class="g">$</tspan><tspan x="${x(2)}">${typed}</tspan></text>` +
        cursor('y k', `animation:on ${num(entered - t)}s linear ${num(t)}s, t${index} ${num(n * CHAR)}s steps(${n}) ${num(typing)}s both`) +
        `</g>`,
    );
    y += LH;
    t = entered;

    for (const row of output) {
      if (row.gap) {
        y += LH / 2;
      } else if (row.wordmark) {
        const scale = Math.min(1, width / WORDMARK[0].length);
        parts.push(wordmark(left, y, scale, t));
        y += WORDMARK.length * LH * scale;
        t += SWEEP;
      } else {
        for (const segments of rowLines(row, width)) {
          const spans = segments.map(([col, cls, text]) => {
            if (col + text.length > width) throw new Error(`Wider than ${width} columns: ${JSON.stringify(text)}`);
            return `<tspan x="${x(col)}"${cls ? ` class="${cls}"` : ''}>${escapeXML(text)}</tspan>`;
          }).join('');
          parts.push(`<text class="s" style="animation-delay:${num(t)}s" y="${y + BASELINE}">${spans}</text>`);
          y += LH;
          t += LINE;
        }
      }
    }
    t += PAUSE;
  });

  const w = cols * CW;
  const h = Math.ceil(y + PAD_Y);
  // Every element's resting style is the last frame; animations only hide things until their moment,
  // so anything that skips them (reduced motion included) shows the finished session
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
<style>
@font-face { font-family: Iosevka; font-weight: 400; src: url(data:font/woff2;base64,${fonts[400]}) format('woff2'); }
@font-face { font-family: Iosevka; font-weight: 700; src: url(data:font/woff2;base64,${fonts[700]}) format('woff2'); }
text { font: ${FONT}px Iosevka, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; fill: ${theme.fg}; }
.b { font-weight: 700; }
.m { fill: ${theme.muted}; }
.w { fill: ${theme.warm}; }
.g { fill: ${theme.green}; }
.y { fill: ${theme.highlight}; }
.s { animation: show 0.01s both; }
.f { animation: show 0.2s both; }
.v { animation: type 0.01s both; }
.k { opacity: 0; }
.blink { animation: blink 1s step-end infinite; }
@keyframes show { from { opacity: 0; } }
@keyframes type { from { visibility: hidden; } }
@keyframes on { from, to { opacity: 1; } }
@keyframes blink { 50% { opacity: 0; } }
${keyframes.join('\n')}
@media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
</style>
<rect width="${w}" height="${h}" rx="8" fill="${theme.bg}"/>
${parts.join('\n')}
</svg>
`;
}

for (const layout of layouts) {
  const svg = render(layout);
  fs.writeFileSync(new URL(layout.file, import.meta.url), svg);
  console.log(`${layout.file}: ${svg.match(/viewBox="0 0 (\d+ \d+)"/)[1].replace(' ', 'x')}, ${(svg.length / 1024).toFixed(1)} KB`);
}
