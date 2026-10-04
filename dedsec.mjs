// Generates dedsec.svg: node dedsec.mjs
import { writeFileSync } from 'node:fs';

const CW = 9; // char width; 15px text is forced onto this grid via textLength where alignment matters

let seed = 7;
const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
const s = (n) => `${+n.toFixed(2)}s`;
const delay = (t, extra = '') => `style="animation-delay:${s(t)}${extra}"`;
// visible only between t0 and t1 (SMIL, so it can switch off again)
const during = (t0, t1) => `visibility="hidden"><set attributeName="visibility" to="visible" begin="${s(t0)}" end="${s(t1)}"/`;

let out = '';
let y = 172;

// Types `text` at (x, y) starting at t0, a char at a time with a cursor (shown from `from`). Returns when typing ends.
function type(text, x, perChar, t0, from) {
  const n = text.length;
  const delays = Array.from({ length: n }, () => perChar * (0.6 + 0.8 * rand()));
  const total = delays.reduce((a, b) => a + b, 0) + perChar;
  let acc = 0;
  const keyTimes = [0, ...delays.map((d) => +((acc += d) / total).toFixed(4))].join(';');
  const steps = Array.from({ length: n + 1 }, (_, i) => i * CW).join(';');
  const id = `k${out.length}`;
  const anim = (attr, tag, extra = '') =>
    `<${tag} attributeName="${attr}" ${extra}calcMode="discrete" values="${steps}" keyTimes="${keyTimes}" begin="${s(t0)}" dur="${s(total)}" fill="freeze"/>`;
  out += `<clipPath id="${id}"><rect x="${x}" y="${y - 17}" height="22" width="0">${anim('width', 'animate')}</rect></clipPath>\n`;
  out += `<text x="${x}" y="${y}" textLength="${n * CW}" clip-path="url(#${id})">${text}</text>\n`;
  out += `<rect class="cur" x="${x}" y="${y - 13}" width="9" height="16" ${during(from, t0 + total + 0.3)}>${anim('transform', 'animateTransform', 'type="translate" ')}</rect>\n`;
  return t0 + total;
}

const TAGS = { OK: ['[  OK  ]', 'c'], WARN: ['[ WARN ]', 'y'], FAILED: ['[FAILED]', 'm'] };
const tag = (status) => `<tspan class="${TAGS[status][1]}">${TAGS[status][0]}</tspan>`;

// One log line that slides in with a glow at time t.
function line(t, content, x = 40, attrs = '') {
  out += `<text x="${x}" y="${y}" class="in" ${delay(t)}${attrs}>${content}</text>\n`;
}

function startup(t, items) {
  for (const [status, msg] of items) {
    line(t, `${tag(status)} ${msg}`);
    t += 0.2 + 0.3 * rand();
    y += 22;
  }
  return t;
}

// "Checking <name> ....." lines: spinner + progress bar, then the status replaces them. Returns when the last resolves.
function checks(t, items) {
  for (const [name, status, note] of items) {
    const label = `Checking ${name} `.padEnd(32, '.');
    const x = 40 + (label.length + 1) * CW;
    const d = 0.6 + 0.6 * rand();
    line(t, label.replace(/\.+$/, '<tspan class="dim">$&</tspan>'), 40, ` textLength="${label.length * CW}"`);
    out += `<g ${during(t, t + d)}>
<circle class="spin" cx="${x + 6}" cy="${y - 5}" r="5"/>
<rect class="track" x="${x + 18}" y="${y - 10}" width="90" height="8"/>
<rect class="bar" x="${x + 18}" y="${y - 10}" width="90" height="8" ${delay(t, `;animation-duration:${s(d)}`)}/>
</g>\n`;
    line(t + d, `${tag(status)} ${note}`, x);
    t += d + 0.15;
    y += 22;
  }
  const count = (st) => items.filter((i) => i[1] === st).length;
  line(t, `<tspan class="dim">${items.length} systems checked · ${count('FAILED')} failed · ${count('WARN')} warnings</tspan>`);
  y += 22;
  return t + 0.3;
}

// --- tuigreet-style login, removed from the display once the session starts ---
out += `<g>\n<text x="400" y="60" class="dim" text-anchor="middle">Sun, 04 Oct 2026 · 23:42</text>
<rect x="160" y="250" width="480" height="190" rx="4" fill="none" stroke="#00FFEA" stroke-opacity=".7"/>
<rect x="180" y="240" width="90" height="20" fill="#050505"/><text x="225" y="255" class="c" text-anchor="middle">deadPc</text>
<text x="400" y="294" text-anchor="middle">Welcome back, operator.</text>
<text x="190" y="340" class="dim">Username:</text><text x="190" y="372" class="dim">Password:</text>
<text x="400" y="BAR_Y" text-anchor="middle"><tspan class="c" font-weight="bold">F2</tspan><tspan class="dim"> Change command   </tspan><tspan class="c" font-weight="bold">F3</tspan><tspan class="dim"> Choose session   </tspan><tspan class="c" font-weight="bold">F12</tspan><tspan class="dim"> Power</tspan></text>\n`;
y = 340;
let typed = type('deadmade', 289, 0.15, 1, 0.3) + 0.3;
y = 372;
typed = type('********', 289, 0.1, typed, typed) + 0.5;
out += `<text x="400" y="414" class="in dim" text-anchor="middle" ${delay(typed)}>Starting session: zsh</text>
<set attributeName="display" to="none" begin="${s(typed + 1)}" fill="freeze"/>\n</g>\n`;
const L = typed + 1; // login end: everything below starts after this

// --- boot log ---
y = 172;
let t = startup(L + 1.1, [
  ['OK', 'Mounted /home/deadmade'],
  ['OK', 'Started DedSec uplink'],
  ['OK', 'Reached target ctOS bypass'],
  ['OK', 'Logged in as <tspan class="c">deadmade</tspan> <tspan class="dim">// developer · tinkerer · cake enthusiast</tspan>'],
]) + 0.3;

y += 10;
line(t, '<tspan class="dim">Running system checks...</tspan>');
y += 22;
t = checks(t + 0.4, [
  ['studies', 'OK', 'completed, finally'],
  ['current_project', 'OK', 'building &amp; breaking things'],
  ['coffee_level', 'WARN', 'critical, refill recommended'],
  ['sleep_schedule', 'FAILED', 'undefined behaviour'],
  ['cake_supply', 'OK', 'cakes make everything better'],
  ['bugs', 'OK', 'reclassified as features'],
  ['works_on_my_machine', 'OK', 'reproducible, thanks nix'],
  ['vim_exit', 'WARN', 'still trying :q!'],
]);

y += 10;
line(t, `${tag('OK')} Loaded arsenal`);
y += 22;
let ax = 40 + 9 * CW;
for (const name of ['.NET', 'Blazor', 'C#', 'Git', 'GitHub', 'LaTeX', 'Markdown', 'Python']) {
  t += 0.08;
  out += `<text x="${ax}" y="${y}" class="pop c" font-weight="bold" textLength="${name.length * CW}" ${delay(t)}>${name}</text>\n`;
  ax += (name.length + 2) * CW;
}
y += 38;

t += 0.6;
// ONLINE for a few seconds, then it glitches over to OFFLINE for good
const off = t + 4;
const hideAt = `<set attributeName="visibility" to="hidden" begin="${s(off)}" fill="freeze"/>`;
out += `<g class="in" ${delay(t)}>${hideAt}<circle class="pulse" cx="46" cy="${y - 5}" r="5"/>
<text x="60" y="${y}"><tspan class="c" font-weight="bold">SYSTEM ONLINE</tspan>  <tspan class="dim">deadPc · nixos · uptime ∞</tspan></text></g>
<g class="ginL" ${delay(off)}><circle cx="46" cy="${y - 5}" r="5" fill="#FF2A6D"/>
<text x="60" y="${y}"><tspan class="m" font-weight="bold">SYSTEM OFFLINE</tspan>  <tspan class="dim">deadPc · connection lost</tspan></text></g>\n`;
y += 30;
t = off + 1;
out += `<g class="ginR" ${delay(t)}><text x="40" y="${y}" class="m" textLength="${24 * CW}">// CONNECTION TERMINATED</text>
<rect class="blink" x="${40 + 25 * CW}" y="${y - 13}" width="9" height="16" fill="#FF2A6D"/></g>\n`;
y += 22;

const H = y + 10;
const banner = [
  '██████╗ ███████╗ █████╗ ██████╗ ███╗   ███╗ █████╗ ██████╗ ███████╗',
  '██╔══██╗██╔════╝██╔══██╗██╔══██╗████╗ ████║██╔══██╗██╔══██╗██╔════╝',
  '██║  ██║█████╗  ███████║██║  ██║██╔████╔██║███████║██║  ██║█████╗  ',
  '██║  ██║██╔══╝  ██╔══██║██║  ██║██║╚██╔╝██║██╔══██║██║  ██║██╔══╝  ',
  '██████╔╝███████╗██║  ██║██████╔╝██║ ╚═╝ ██║██║  ██║██████╔╝███████╗',
  '╚═════╝ ╚══════╝╚═╝  ╚═╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═════╝ ╚══════╝',
].map((l, i) => `<text class="b gin${i % 2 ? 'R' : 'L'}" x="78" y="${44 + i * 17}" textLength="644" lengthAdjust="spacingAndGlyphs" ${delay(L + 0.1 + i * 0.08)}>${l}</text>`).join('\n');

writeFileSync(new URL('./dedsec.svg', import.meta.url), `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="${H}" viewBox="0 0 800 ${H}" role="img" aria-labelledby="t">
<title id="t">deadmade // DedSec boot log on deadPc</title>
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
.y { fill: #F5D300; }
.dim { fill: #6B6B6B; }
.in { opacity: 0; animation: in .35s ease-out both; }
.pop { opacity: 0; transform-box: fill-box; transform-origin: center; animation: pop .3s ease-out both; }
.spin { fill: none; stroke: #00FFEA; stroke-width: 2; stroke-dasharray: 20 12; transform-box: fill-box; transform-origin: center; animation: spin .6s linear infinite; }
.track { fill: none; stroke: #333; }
.bar { fill: #00FFEA; transform-box: fill-box; transform-origin: left; animation: bar 1s linear both; }
.pulse { fill: #00FFEA; transform-box: fill-box; transform-origin: center; animation: pulse 1.6s ease-in-out infinite; }
.ginL { animation: ginL .6s steps(1) both; }
.ginR { animation: ginR .6s steps(1) both; }
.g1 { fill: #00FFEA; opacity: .8; animation: g1 3s ${s(L + 0.9)} infinite steps(1) backwards; }
.g2 { fill: #FF2A6D; opacity: .8; animation: g2 3s ${s(L + 0.9)} infinite steps(1) backwards; }
.flicker { animation: flicker 6s ${s(L + 1)} infinite; }
.cur { fill: #00FFEA; }
.blink { animation: blink 1s infinite steps(1); }
@keyframes blink { 50% { opacity: 0; } }
@keyframes in { from { opacity: 0; transform: translateX(-14px); filter: drop-shadow(0 0 6px #00FFEA); } to { opacity: 1; transform: none; filter: none; } }
@keyframes pop { 0% { opacity: 0; transform: scale(.6); } 60% { opacity: 1; transform: scale(1.1); } 100% { opacity: 1; transform: scale(1); } }
@keyframes spin { to { transform: rotate(360deg); } }
@keyframes bar { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .35; transform: scale(1.5); } }
@keyframes ginL { 0% { opacity: 0; } 15% { opacity: 1; transform: translateX(-30px); } 35% { transform: translateX(12px); } 55% { transform: translateX(-5px); } 100% { opacity: 1; transform: none; } }
@keyframes ginR { 0% { opacity: 0; } 15% { opacity: 1; transform: translateX(30px); } 35% { transform: translateX(-12px); } 55% { transform: translateX(5px); } 100% { opacity: 1; transform: none; } }
@keyframes g1 { 0%, 100% { transform: translate(-2px, 0); } 92% { transform: translate(-7px, 2px); } 95% { transform: translate(5px, -2px); } }
@keyframes g2 { 0%, 100% { transform: translate(2px, 0); } 92% { transform: translate(7px, -2px); } 95% { transform: translate(-5px, 2px); } }
@keyframes flicker { 0%, 96%, 100% { opacity: 1; } 97% { opacity: .6; } 98% { opacity: 1; } 99% { opacity: .75; } }
</style>
<rect x=".5" y=".5" width="799" height="${H - 1}" rx="10" fill="#050505" stroke="#00FFEA" stroke-opacity=".6"/>
<g class="flicker">
<use href="#banner" xlink:href="#banner" class="g1"/>
<use href="#banner" xlink:href="#banner" class="g2"/>
<use href="#banner" xlink:href="#banner" fill="#E6E6E6"/>
</g>
${out.replace("BAR_Y", H - 24)}<rect width="800" height="${H}" rx="10" fill="url(#scan)" pointer-events="none"/>
</svg>
`);
console.log(`dedsec.svg: ${H}px tall, runs ${t.toFixed(1)}s`);
