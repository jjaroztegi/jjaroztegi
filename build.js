import fs from 'fs';

const today = new Date();
const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const todayDay = days[today.getDay()];

const startYear = 2024;
const yearsActive = today.getFullYear() - startYear;
const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24));
const uptime = `${yearsActive}y ${dayOfYear}d`;

const theme = {
  bg: '#181818',
  fg: '#f4f4ff',        // Foreground
  keyword: '#ffdd33',   // Yellow (User, Prompt, Cursor)
  string: '#73c936',    // Green (Directory, Strings)
  constant: '#95a99f',  // Sage (Host, Numbers)
  comment: '#cc8c3c',   // Grey (Comments)
  operator: '#e4e4ef',  // White/Grey (Brackets, Delimiters)
  success: '#73c936',   // Green (OK messages)
  command: '#f4f4ff',   // Text being typed
};

// --- FONT CONFIGURATION ---
const PROMPT_PREFIX = 'juanjo@aroztegi:~$ ';

// --- ANIMATION SEQUENCE ---
const sequence = [
  {
    type: 'boot',
    delay: 0.3,
    text: 'Registered sip:juanjo@aroztegi.com'
  },
  {
    type: 'comment',
    delay: 0.8,
    text: '# Voice AI · Telephony · Evaluation'
  },
  {
    type: 'blank',
    delay: 1.0
  },
  {
    type: 'prompt',
    delay: 1.2,
    command: 'whoami',
    commandDelay: 1.4,
    charSpeed: 0.10
  },
  {
    type: 'output',
    delay: 2.6,
    text: 'Juanjo Aroztegi'
  },
  {
    type: 'output',
    delay: 2.7,
    text: 'AI/R&D Engineer | Telecom Engineer | Basque Country'
  },
  {
    type: 'blank',
    delay: 2.9
  },
  {
    type: 'prompt',
    delay: 3.0,
    command: 'cat stack.txt',
    commandDelay: 3.2,
    charSpeed: 0.08
  },
  {
    type: 'output',
    delay: 4.8,
    text: 'ai:        [ LLM agents, MCP, realtime voice, evals ]'
  },
  {
    type: 'output',
    delay: 4.8,
    text: 'telephony: [ SIP, RTP, SIPREC, SBC, G.711 ]'
  },
  {
    type: 'output',
    delay: 4.8,
    text: 'code:      [ Python, TypeScript, C#, SQL ]'
  },
  {
    type: 'output',
    delay: 4.8,
    text: 'infra:     [ Linux, Docker, Azure, Git ]'
  },
  {
    type: 'blank',
    delay: 5.0
  },
  {
    type: 'prompt',
    delay: 5.1,
    command: 'sip-trace --last',
    commandDelay: 5.3,
    charSpeed: 0.07
  },
  {
    type: 'output',
    delay: 7.0,
    text: 'INVITE -> 200 OK -> ACK -> RTP -> REFER -> agent'
  },
  {
    type: 'blank',
    delay: 7.2
  },
  {
    type: 'prompt',
    delay: 7.3,
    command: 'echo $STATUS',
    commandDelay: 7.5,
    charSpeed: 0.08
  },
  {
    type: 'output',
    delay: 9.0,
    text: 'Building AI systems for contact centers'
  },
  {
    type: 'blank',
    delay: 9.2
  },
  {
    type: 'prompt',
    delay: 9.4,
    command: '',
    commandDelay: 9.6,
    charSpeed: 0.06
  }
];

function escapeHTML(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function createPromptFrames(command, startTime, charDelay, endTime, isFinalPrompt) {
  const frames = [];
  const totalChars = command.length;

  for (let i = 0; i <= totalChars; i += 1) {
    const time = startTime + (i * charDelay);
    const isLast = i === totalChars;
    const typed = escapeHTML(command.slice(0, i));
    const begin = time.toFixed(2);
    const dur = charDelay.toFixed(2);
    const finalFrameDur = endTime && endTime > time ? (endTime - time).toFixed(2) : dur;
    let visibility = '';
    let cursor = '';

    if (isLast && isFinalPrompt) {
      visibility = `<animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="0.01s" fill="freeze" />`;
      cursor = `<tspan class="cursor" opacity="0">█<animate attributeName="opacity" values="0;0;1;1;0;0" dur="1s" begin="${begin}s" repeatCount="indefinite" /></tspan>`;
    } else if (isLast) {
      visibility = `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.01;0.99;1" dur="${finalFrameDur}s" begin="${begin}s" fill="remove" />`;
      cursor = `<tspan class="cursor">█</tspan>`;
    } else {
      visibility = `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;0.01;0.99;1" dur="${dur}s" begin="${begin}s" fill="remove" />`;
      cursor = `<tspan class="cursor">█</tspan>`;
    }

    frames.push(
      `<text class="mono" opacity="0">${visibility}<tspan class="keyword">${escapeHTML(PROMPT_PREFIX)}</tspan><tspan class="command">${typed}</tspan>${cursor}</text>`
    );
  }

  let staticLine = '';
  if (!isFinalPrompt && endTime) {
    const begin = endTime.toFixed(2);
    staticLine = `<text class="mono" opacity="0"><animate attributeName="opacity" from="0" to="1" begin="${begin}s" dur="0.01s" fill="freeze" /><tspan class="keyword">${escapeHTML(PROMPT_PREFIX)}</tspan><tspan class="command">${escapeHTML(command)}</tspan></text>`;
  }

  return frames.join('') + staticLine;
}

// Generate SVG Lines
const textScale = 1.3;
const baseFontSize = 14;
const fontSize = baseFontSize * textScale;
let yOffset = 35 * textScale;
const lineHeight = 22 * textScale;

const lastIndex = sequence.length - 1;
const nextVisibleDelay = (idx) => {
  for (let i = idx + 1; i < sequence.length; i += 1) {
    if (sequence[i].type !== 'blank') {
      return sequence[i].delay;
    }
  }
  return null;
};
const lines = sequence.map((item, index) => {
  let content = '';
  const isLast = index === lastIndex;

  switch (item.type) {
    case 'boot':
      content = `
    <g opacity="0" transform="translate(0, ${yOffset})">
      <animate attributeName="opacity" from="0" to="1" begin="${item.delay}s" dur="0.1s" fill="freeze" />
      <text class="mono"><tspan class="operator">[</tspan><tspan class="success"> OK </tspan><tspan class="operator">]</tspan> <tspan class="constant">${escapeHTML(item.text)}</tspan></text>
    </g>`;
      yOffset += lineHeight;
      break;

    case 'comment':
      content = `
    <g opacity="0" transform="translate(0, ${yOffset})">
      <animate attributeName="opacity" from="0" to="1" begin="${item.delay}s" dur="0.1s" fill="freeze" />
      <text class="comment mono">${escapeHTML(item.text)}</text>
    </g>`;
      yOffset += lineHeight;
      break;

    case 'blank':
      yOffset += lineHeight / 2; // Half height for blank lines
      break;

    case 'prompt':
      const endTime = isLast ? null : nextVisibleDelay(index);
      const frames = createPromptFrames(item.command, item.commandDelay, item.charSpeed, endTime, isLast);
      content = `
    <g opacity="0" transform="translate(0, ${yOffset})">
      <animate attributeName="opacity" from="0" to="1" begin="${item.delay}s" dur="0.1s" fill="freeze" />
      ${frames}
    </g>`;
      yOffset += lineHeight;
      break;

    case 'output':
      content = `
    <g opacity="0" transform="translate(0, ${yOffset})">
      <animate attributeName="opacity" from="0" to="1" begin="${item.delay}s" dur="0.1s" fill="freeze" />
      <text class="fg mono">${escapeHTML(item.text)}</text>
    </g>`;
      yOffset += lineHeight;
      break;
  }
  return content;
}).join('');

// Calculate total height dynamically + padding
const totalHeight = Math.ceil(yOffset + (20 * textScale));

// SVG Template - Responsive with preserveAspectRatio
const svg = `<svg width="100%" viewBox="0 0 800 ${totalHeight}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet">
  <style>
    .base { fill: ${theme.bg}; }
    .mono { font-family: 'Iosevka', 'Courier New', monospace; font-size: ${fontSize}px; white-space: pre; }
    .fg { fill: ${theme.fg}; }
    .keyword { fill: ${theme.keyword}; font-weight: bold; }
    .string { fill: ${theme.string}; }
    .constant { fill: ${theme.constant}; }
    .comment { fill: ${theme.comment}; font-style: italic; }
    .operator { fill: ${theme.operator}; }
    .success { fill: ${theme.success}; font-weight: bold; }
    .command { fill: ${theme.command}; }
    .cursor { fill: ${theme.keyword}; }
  </style>

  <rect width="100%" height="100%" rx="8" class="base" />

  <g transform="translate(20, 0)">
    ${lines}
  </g>
</svg>`;

try {
  fs.writeFileSync('profile.svg', svg);
  console.log('Generated profile.svg successfully');
  console.log(`Dimensions: 800x${totalHeight} (responsive)`);
  console.log(`Uptime: ${uptime}`);
  console.log(`Day: ${todayDay}`);
} catch (error) {
  console.error('Error:', error);
  process.exit(1);
}
