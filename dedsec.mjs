// Generates dedsec.svg: node dedsec.mjs
import { writeFileSync } from 'node:fs';

const SPEED = 0.15; // seconds per typed char (jittered ±40%)
const CW = 9;       // char width; 15px text is forced onto this grid via textLength
const CMD_X = 229;  // where commands start after the prompt (20 chars + space)

let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const s = (n) => `${+n.toFixed(2)}s`;
const show = (t) => `<set attributeName="visibility" to="visible" begin="${s(t)}" fill="freeze"/>`;

let out = '';
let y = 172;
let t = 0.3;

// Types `text` at (x, y) starting at t; the cursor shows from `from` until `until`. Returns when typing ends.
function type(text, x, cls, perChar, from, until) {
  const n = text.length;
  const delays = Array.from({ length: n }, () => perChar * (0.6 + 0.8 * rand()));
  const total = delays.reduce((a, b) => a + b, 0) + perChar;
  let acc = 0;
  const keyTimes = [0, ...delays.map((d) => +((acc += d) / total).toFixed(4))].join(';');
  const steps = Array.from({ length: n + 1 }, (_, i) => i * CW).join(';');
  const id = `k${out.length}`;
  const anim = (attr, tag, extra = '') =>
    `<${tag} attributeName="${attr}" ${extra}calcMode="discrete" values="${steps}" keyTimes="${keyTimes}" begin="${s(t)}" dur="${s(total)}" fill="freeze"/>`;
  out += `<clipPath id="${id}"><rect x="${x}" y="${y - 17}" height="22" width="0">${anim('width', 'animate')}</rect></clipPath>\n`;
  out += `<text x="${x}" y="${y}"${cls ? ` class="${cls}"` : ''} textLength="${n * CW}" clip-path="url(#${id})">${esc(text)}</text>\n`;
  out += `<rect class="cur" x="${x}" y="${y - 13}" width="9" height="16" visibility="hidden"><set attributeName="visibility" to="visible" begin="${s(from)}" end="${s(until(t + total))}"/>${anim('transform', 'animateTransform', 'type="translate" ')}</rect>\n`;
  return t + total;
}

const esc = (str) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// Prompt + typed command; `output(at)` draws the result and advances y.
function cmd(command, output) {
  const from = t;
  out += `<text x="40" y="${y}" textLength="180" visibility="hidden">${show(t)}<tspan class="dim">[</tspan><tspan class="m">deadmade@deadPc</tspan><tspan class="dim">:</tspan><tspan class="c">~</tspan><tspan class="dim">]$</tspan></text>\n`;
  t += 0.6;
  const at = type(command, CMD_X, '', SPEED, from, (end) => end + 0.4) + 0.4;
  y += 22;
  t = (output(at) ?? at) + 0.8;
  y += 10;
}

function lines(at, ...rows) {
  out += `<g visibility="hidden">${show(at)}\n`;
  for (const r of rows) (out += `<text x="40" y="${y}">${r}</text>\n`), (y += 22);
  out += '</g>\n';
}

// "Checking <name> ....." lines, each resolving to a status after a pause. Returns when the last one resolves.
function checks(at, items) {
  for (const [name, status, note] of items) {
    const label = `Checking ${name} `.padEnd(28, '.');
    const cls = status === 'OK' ? 'c' : 'm';
    out += `<text x="40" y="${y}" textLength="${label.length * CW}" visibility="hidden">${show(at)}${label.replace(/\.+$/, '<tspan class="dim">$&</tspan>')}</text>\n`;
    at += 0.5 + 0.6 * rand();
    out += `<text x="${40 + (label.length + 1) * CW}" y="${y}" visibility="hidden">${show(at)}<tspan class="${cls}">[ ${status} ]</tspan> ${note}</text>\n`;
    at += 0.25;
    y += 22;
  }
  return at;
}

function bat(at, file, rows) {
  const top = y - 14;
  out += `<g visibility="hidden">${show(at)}\n`;
  out += `<text x="118" y="${top + 20}"><tspan class="dim">File: </tspan>${file}</text>\n`;
  rows.forEach((r, i) => {
    const ry = top + 50 + i * 22;
    out += `<text x="76" y="${ry}" class="dim" text-anchor="end">${i + 1}</text><text x="118" y="${ry}">${r}</text>\n`;
  });
  const bottom = top + 50 + (rows.length - 1) * 22 + 10;
  for (const ly of [top, top + 30, bottom]) out += `<line class="rule" x1="40" y1="${ly}" x2="760" y2="${ly}"/>`;
  out += `<line class="rule" x1="107" y1="${top}" x2="107" y2="${bottom}"/>\n</g>\n`;
  y = bottom + 24;
}

// --- tuigreet-style login, removed from the display once the session starts ---
out += `<g>\n<text x="400" y="60" class="dim" text-anchor="middle">Sun, 04 Oct 2026 · 23:42</text>
<rect x="160" y="250" width="480" height="190" rx="4" fill="none" stroke="#00FFEA" stroke-opacity=".7"/>
<rect x="180" y="240" width="90" height="20" fill="#050505"/><text x="225" y="255" class="c" text-anchor="middle">deadPc</text>
<text x="400" y="294" text-anchor="middle">Welcome back, operator.</text>
<text x="190" y="340" class="dim">Username:</text><text x="190" y="372" class="dim">Password:</text>
<text x="400" y="684" text-anchor="middle"><tspan class="c" font-weight="bold">F2</tspan><tspan class="dim"> Change command   </tspan><tspan class="c" font-weight="bold">F3</tspan><tspan class="dim"> Choose session   </tspan><tspan class="c" font-weight="bold">F12</tspan><tspan class="dim"> Power</tspan></text>\n`;
y = 340;
t = 1;
let typed = type('deadmade', 289, '', SPEED, 0.3, (end) => end + 0.3) + 0.3;
y = 372;
t = typed;
typed = type('********', 289, '', 0.1, typed, (end) => end + 0.5) + 0.5;
out += `<text x="400" y="414" class="dim" text-anchor="middle" visibility="hidden">${show(typed)}Starting session: zsh</text>
<set attributeName="display" to="none" begin="${s(typed + 1)}" fill="freeze"/>\n</g>\n`;
const LOGIN_END = typed + 1;

// --- session ---
y = 172;
t = LOGIN_END + 0.3;
t = type('> ACCESS GRANTED. WELCOME TO DEDSEC', 40, 'c', 0.06, t, (end) => end + 0.6) + 0.6;
y += 38;

cmd('whoami', (at) => lines(at, 'deadmade // developer · tinkerer · cake enthusiast'));
cmd('nix shell nixpkgs#bat', (at) =>
  lines(at, `<tspan class="dim">copying path '/nix/store/k1jx9q…-bat-0.25.0' from 'https://cache.nixos.org'...</tspan>`));
cmd('system-status', (at) => {
  at = checks(at, [
    ['studies', 'OK', 'completed'],
    ['current_project', 'OK', 'building &amp; breaking things'],
    ['cake_supply', '!!', 'cakes make everything better'],
  ]);
  lines(at, '<tspan class="dim">3 systems checked · 0 failed · 1 warning</tspan>');
  return at;
});
cmd('ls ~/arsenal', (at) =>
  lines(at, ['.NET', 'Blazor', 'C#', 'Git', 'GitHub', 'LaTeX', 'Markdown', 'Python'].map((d) => `<tspan class="c" font-weight="bold">${d}</tspan>`).join('  ')));
cmd('bat manifesto.md', (at) =>
  bat(at, 'manifesto.md', ['We are deadmade. We write code. We break it. We fix it.', 'Information wants to be free.']));
cmd('exit', (at) => {
  lines(at, 'logout', 'Connection to deadPc terminated.');
  out += `<rect class="cur blink" x="40" y="${y - 13}" width="9" height="16" visibility="hidden">${show(at + 0.4)}</rect>\n`;
});

const H = y + 20;
const banner = [
  '██████╗ ███████╗ █████╗ ██████╗ ███╗   ███╗ █████╗ ██████╗ ███████╗',
  '██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗██╔════╝',
  '██║  ██║█████╗  ███████║██║  ██║██╔████╔██║███████║██║  ██║█████╗  ',
  '██║  ██║██╔══╝  ██╔══██║██║  ██║██║╚██╔╝██║██╔══██║██║  ██║██╔══╝  ',
  '██████╔╝███████╗██║  ██║██████╔╝██║ ╚═╝ ██║██║  ██║██████╔╝███████╗',
  '╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝',
].map((l, i) => `<text class="b" x="78" y="${44 + i * 17}" textLength="644" lengthAdjust="spacingAndGlyphs">${l}</text>`).join('\n');

writeFileSync(new URL('./dedsec.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="${H}" viewBox="0 0 800 ${H}" role="img" aria-labelledby="t">
<title id="t">deadmade // DedSec terminal profile on deadPc</title>
<!-- generated by dedsec.mjs, edit that instead -->
<defs>
<pattern id="scan" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="1" fill="#00FFEA" opacity=".05"/></pattern>
<g id="banner" xml:space="preserve">
${banner}
</g>
</defs>
<style>
text { font-family: 'Fira Code', 'JetBrains Mono', 'DejaVu Sans Mono', Consolas, monospace; fill: #E6E6E6; font-size: 15px; white-space: pre; }
.b { fill: inherit; font-size: 16px; }
.c { fill: #00FFEA; }
.m { fill: #FF2A6D; }
.dim { fill: #6B6B6B; }
.cur { fill: #00FFEA; }
.rule { stroke: #333; stroke-width: 1; }
.g1 { fill: #00FFEA; opacity: .8; animation: g1 3s infinite steps(1); }
.g2 { fill: #FF2A6D; opacity: .8; animation: g2 3s infinite steps(1); }
.blink { animation: blink 1s infinite steps(1); }
.flicker { animation: flicker 6s infinite; }
@keyframes blink { 50% { opacity: 0; } }
@keyframes g1 { 0%, 100% { transform: translate(-2px, 0); } 92% { transform: translate(-7px, 2px); } 95% { transform: translate(5px, -2px); } }
@keyframes g2 { 0%, 100% { transform: translate(2px, 0); } 92% { transform: translate(7px, -2px); } 95% { transform: translate(-5px, 2px); } }
@keyframes flicker { 0%, 96%, 100% { opacity: 1; } 97% { opacity: .6; } 98% { opacity: 1; } 99% { opacity: .75; } }
</style>
<rect x=".5" y=".5" width="799" height="${H - 1}" rx="10" fill="#050505" stroke="#00FFEA" stroke-opacity=".6"/>
<g class="flicker" visibility="hidden">${show(LOGIN_END)}
<use href="#banner" xlink:href="#banner" class="g1"/>
<use href="#banner" xlink:href="#banner" class="g2"/>
<use href="#banner" xlink:href="#banner" fill="#E6E6E6"/>
</g>
${out}<rect width="800" height="${H}" rx="10" fill="url(#scan)" pointer-events="none"/>
</svg>
`);
console.log(`dedsec.svg: ${H}px tall, runs ${t.toFixed(1)}s`);
