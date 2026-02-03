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
    text: 'Loading juanjo.service... OK'
  },
  {
    type: 'comment',
    delay: 0.8,
    text: '# Initializing Environment'
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
    delay: 2.2,
    text: 'Juanjo Aroztegi'
  },
  {
    type: 'output',
    delay: 2.3,
    text: 'Telecommunications Engineer | Spain'
  },
  {
    type: 'blank',
    delay: 2.5
  },
  {
    type: 'prompt',
    delay: 2.6,
    command: 'cat stack.yaml',
    commandDelay: 2.8,
    charSpeed: 0.10
  },
  {
    type: 'output',
    delay: 4.4,
    text: 'languages:   [ C, C++, Python, Java, Assembly, VHDL ]'
  },
  {
    type: 'output',
    delay: 4.4,
    text: 'engineering: [ MATLAB, Cadence, Keysight ADS, CST ]'
  },
  {
    type: 'output',
    delay: 4.4,
    text: 'tools:       [ Linux, Git, Docker, SQL, ML_Inference ]'
  },
  {
    type: 'blank',
    delay: 4.6
  },
  {
    type: 'prompt',
    delay: 4.8,
    command: 'uptime',
    commandDelay: 5.0,
    charSpeed: 0.10
  },
  {
    type: 'output',
    delay: 5.8,
    text: `Uptime: ${uptime}`
  },
  {
    type: 'blank',
    delay: 6.0
  },
  {
    type: 'prompt',
    delay: 6.2,
    command: 'cc -o main main.c && ./main',
    commandDelay: 6.4,
    charSpeed: 0.08
  },
  {
    type: 'output',
    delay: 8.8,
    text: 'Hello World!'
  },
  {
    type: 'blank',
    delay: 9.0
  },
  {
    type: 'prompt',
    delay: 9.2,
    command: '',
    commandDelay: 9.4,
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
let yOffset = 35;
const lineHeight = 22;

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
      <text class="mono">
        <tspan class="operator">[</tspan><tspan class="success"> OK </tspan><tspan class="operator">]</tspan> <tspan class="constant">${escapeHTML(item.text)}</tspan>
      </text>
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
const totalHeight = yOffset + 20;

// SVG Template - Responsive with preserveAspectRatio
const svg = `<svg width="100%" height="auto" viewBox="0 0 800 ${totalHeight}" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMinYMin meet">
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Iosevka:wght@400;700&amp;display=swap');

    /* Global Settings */
    .base { fill: ${theme.bg}; }
    .mono { font-family: 'Iosevka', 'Courier New', monospace; font-size: 14px; }

    /* Theme Colors */
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
