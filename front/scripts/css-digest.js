// Reduces a built stylesheet to an order-free digest: one sorted line per
// declaration, as "<at-rule context>|<selector>|<property>:<value>".
//
// Two things are normalised away on purpose:
//   * order, so moving a rule between files is invisible here;
//   * custom properties, which are resolved from :root into their use sites,
//     so replacing a literal with the token holding the same value is a no-op.
//
// Run it against front/build/static/css before and after a CSS change. A pure
// consolidation must produce an identical digest. A deliberate change must
// produce a diff containing exactly the lines you meant to change.
//
// Usage: cd front && node scripts/css-digest.js build/static/css
const fs = require('fs');
const path = require('path');
const postcss = require('postcss');

const dir = process.argv[2] || 'build/static/css';
const file = fs.readdirSync(dir).find((f) => f.endsWith('.css'));
if (!file) {
  throw new Error(`no .css file in ${dir} — run "npm run build" first`);
}
const root = postcss.parse(fs.readFileSync(path.join(dir, file), 'utf8'));

const tokens = new Map();
root.walkRules(':root', (rule) => {
  rule.walkDecls(/^--/, (decl) => tokens.set(decl.prop, decl.value.trim()));
});

function resolve(value) {
  let out = value;
  for (let i = 0; i < 10 && out.includes('var('); i += 1) {
    out = out.replace(/var\(\s*(--[\w-]+)\s*(?:,[^()]*)?\)/g, (match, name) =>
      tokens.has(name) ? tokens.get(name) : match,
    );
  }
  return out;
}

const lines = [];
root.walkDecls((decl) => {
  if (decl.prop.startsWith('--')) return;
  const rule = decl.parent;
  if (rule.type !== 'rule' && rule.type !== 'atrule') return;

  const context = [];
  for (let parent = rule.parent; parent && parent.type === 'atrule'; parent = parent.parent) {
    context.unshift(`@${parent.name} ${parent.params}`);
  }
  const selector = rule.type === 'rule' ? rule.selector : `@${rule.name} ${rule.params}`;
  const value = resolve(decl.value).replace(/\s+/g, ' ').trim();

  selector
    .split(',')
    .map((s) => s.trim())
    .forEach((sel) => {
      lines.push(
        `${context.join(' >> ')}|${sel}|${decl.prop}:${value}${decl.important ? ' !important' : ''}`,
      );
    });
});

lines.sort();
console.log(lines.join('\n'));
