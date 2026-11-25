import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('.', import.meta.url));
const [mode, upstream, sukka = join(root, 'Sources', 'Sukka')] = process.argv.slice(2);
if (!['--check', '--write'].includes(mode) || !upstream) {
  throw new Error('Usage: node generate.mjs --check|--write <clean v2fly checkout> [Sukka input directory]');
}

const git = (...args) => execFileSync('git', ['-C', upstream, ...args], { encoding: 'utf8' }).trim();
const revision = git('rev-parse', 'HEAD');
if (git('status', '--porcelain', '--untracked-files=all', '--', 'data', 'LICENSE')) {
  throw new Error('Upstream data or license differs from the recorded Git revision');
}

const read = path => readFileSync(path, 'utf8').replace(/\r\n/g, '\n');
const license = read(join(upstream, 'LICENSE'));
if (license !== read(join(root, 'LICENSE-v2fly.txt'))) {
  throw new Error('Upstream license changed; review before redistribution');
}

const label = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
function validDomain(value) {
  return value.length <= 253 && value.split('.').every(part => label.test(part))
    && /[a-z]/.test(value.split('.').at(-1));
}

function covering(rules, value) {
  if (rules.has(value)) return value;
  const labels = value.replace(/^\./, '').split('.');
  for (let index = 0; index < labels.length; index++) {
    const suffix = '.' + labels.slice(index).join('.');
    if (suffix !== value && rules.has(suffix)) return suffix;
  }
  return undefined;
}

function compact(rules) {
  const sorted = [...new Set(rules)].sort((a, b) =>
    a.split('.').filter(Boolean).length - b.split('.').filter(Boolean).length
    || Number(b.startsWith('.')) - Number(a.startsWith('.')));
  const result = new Set();
  for (const value of sorted) {
    if (!covering(result, value)) result.add(value);
  }
  return result;
}

const data = join(upstream, 'data');
const lists = new Map();
const attribute = /^@-?[a-z\d!]+$/;
for (const file of readdirSync(data)) {
  if (file.startsWith('.')) continue;
  const rows = [];
  lists.set(file, rows);
  for (const [index, line] of read(join(data, file)).split('\n').entries()) {
    const fields = line.split('#', 1)[0].trim();
    if (!fields) continue;
    rows.push({ fields: fields.split(/\s+/), location: file + ':' + (index + 1) });
  }
}

const affiliations = new Map();
for (const rows of lists.values()) {
  for (const row of rows) {
    for (const field of row.fields.slice(1).filter(value => value.startsWith('&'))) {
      const target = field.slice(1).toLowerCase();
      if (!affiliations.has(target)) affiliations.set(target, []);
      affiliations.get(target).push(row);
    }
  }
}

const cache = new Map();
function expand(name, ancestry = []) {
  if (/^(?:category-)?(?:ads|advertising)(?:-|$)/.test(name)) return [];
  if (ancestry.includes(name) || !lists.has(name)) {
    throw new Error('Missing or cyclic upstream include: ' + [...ancestry, name].join(' -> '));
  }
  if (cache.has(name)) return cache.get(name);

  const entries = [];
  for (const { fields: [rule, ...options], location } of [
    ...lists.get(name), ...(affiliations.get(name) ?? []),
  ]) {
    const separator = rule.indexOf(':');
    const type = separator < 0 ? 'domain' : rule.slice(0, separator);
    const value = rule.slice(separator + 1);
    const attrs = options.filter(option => !option.startsWith('&'));
    if (attrs.some(option => !attribute.test(option))) throw new Error('Invalid field at ' + location);
    if (type === 'include') {
      if (attrs.length !== options.length) throw new Error('Invalid include at ' + location);
      entries.push(...expand(value.toLowerCase(), [...ancestry, name]).filter(entry =>
        attrs.every(option => option.startsWith('@-')
          ? !entry.attrs.includes('@' + option.slice(2))
          : entry.attrs.includes(option))));
    } else {
      if (!['domain', 'full', 'keyword', 'regexp'].includes(type)) {
        throw new Error('Unknown rule type at ' + location);
      }
      entries.push({ type, value, attrs });
    }
  }
  cache.set(name, entries);
  return entries;
}

const sources = {
  China: ['cn'],
  Global: ['anthropic', 'cloudflare', 'github', 'google', 'netflix', 'openai', 'telegram', 'wikimedia'],
};

function collect(names, exclusion) {
  const entries = names.flatMap(name => {
    const entries = expand(name).filter(entry =>
      !entry.attrs.some(attr => attr === '@ads' || attr === exclusion));
    if (!entries.some(entry => ['domain', 'full'].includes(entry.type))) {
      throw new Error('No supported rules in upstream list ' + name);
    }
    return entries;
  });
  const domains = [];
  const invalid = new Set();
  let unsupported = 0;
  for (const { type, value } of entries) {
    if (!['domain', 'full'].includes(type)) {
      unsupported++;
      continue;
    }
    const domain = value.toLowerCase().replace(/\.$/, '');
    if (!validDomain(domain)) {
      invalid.add(type + ':' + value);
      continue;
    }
    domains.push(type === 'domain' ? '.' + domain : domain);
  }
  return { domains, invalid: [...invalid].sort(), unsupported };
}

function readRules(path, allowLegacy = false) {
  const rules = new Set();
  for (const [index, line] of read(path).split('\n').entries()) {
    const rule = line.trim();
    if (!rule || rule.startsWith('#') || rule.startsWith('//')) continue;
    const match = /^(DOMAIN|DOMAIN-SUFFIX),([a-z0-9.-]+)$/.exec(rule);
    const value = match
      ? (match[1] === 'DOMAIN-SUFFIX' ? '.' : '') + match[2]
      : (allowLegacy && !rule.includes(',') ? rule : '');
    const host = match ? match[2] : value.replace(/^\./, '');
    if (!validDomain(host) || rules.has(value)) {
      throw new Error(path + ':' + (index + 1) + ' invalid or duplicate rule: ' + rule);
    }
    rules.add(value);
  }
  return rules;
}

function readSukka(file, minimum) {
  const input = read(join(sukka, file));
  const declared = /^# Size: (\d+)$/m.exec(input);
  if (!declared || !/^# License: AGPL 3\.0$/m.test(input)
      || !/^# GitHub: https:\/\/github\.com\/SukkaW\/Surge$/m.test(input)) {
    throw new Error('Unexpected Sukka source header: ' + file);
  }

  const rules = [];
  const skipped = {};
  let count = 0;
  for (const raw of input.split('\n')) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    count++;
    const [type, host, ...extra] = line.split(',');
    if (!host) throw new Error('Malformed Sukka rule in ' + file);
    if (['DOMAIN-KEYWORD', 'DOMAIN-WILDCARD', 'USER-AGENT'].includes(type)) {
      skipped[type] = (skipped[type] ?? 0) + 1;
      continue;
    }
    if (!['DOMAIN', 'DOMAIN-SUFFIX'].includes(type) || extra.length || !validDomain(host)) {
      throw new Error('Unexpected Sukka rule in ' + file + ': ' + line);
    }
    // This attribution marker is included in both upstream sets and has no routing purpose.
    if (host === '7h15.ru1353t.1s.m4d3.by.5ukk4w.skk.moe') continue;
    rules.push(type === 'DOMAIN-SUFFIX' ? '.' + host : host);
  }
  if (count !== Number(declared[1]) || rules.length < minimum) {
    throw new Error('Unexpected Sukka rule count in ' + file + ': ' + count);
  }
  return {
    rules,
    stats: { sha256: createHash('sha256').update(input).digest('hex'), count, imported: rules.length, skipped },
  };
}

const sukkaChina = readSukka('domestic.conf', 500);
const sukkaGlobal = readSukka('global.conf', 800);

const direct = readRules(join(root, 'Overrides', 'Direct.list'));
const proxy = readRules(join(root, 'Overrides', 'Proxy.list'));
for (const [first, second] of [[direct, proxy], [proxy, direct]]) {
  for (const value of first) {
    const match = covering(second, value);
    if (match) throw new Error('Direct/Proxy override conflict: ' + value + ' overlaps ' + match);
  }
}

const chinaInput = collect(sources.China, '@!cn');
const globalInput = collect(sources.Global, '@cn');
const china = compact([...chinaInput.domains, ...sukkaChina.rules]);
const global = new Set([...globalInput.domains, ...sukkaGlobal.rules]);
const removedGlobal = new Map();
for (const value of china) {
  // Preserve the domestic match when a Global rule would fully shadow it.
  let conflicting;
  while ((conflicting = covering(global, value))) {
    removedGlobal.set(conflicting, value);
    global.delete(conflicting);
  }
}
const finalGlobal = compact(global);
const proxyExceptions = [...finalGlobal].sort().flatMap(value => {
  const match = covering(china, value);
  return match ? [{ global: value, china: match }] : [];
});

const rules = { China: china, Global: finalGlobal };
const outputs = new Map();
const summary = {
  revision,
  sukka: { domestic: sukkaChina.stats, global: sukkaGlobal.stats },
  lists: {},
  removedGlobal: Object.fromEntries([...removedGlobal].sort()),
  proxyExceptions,
};
for (const [name, values] of Object.entries(rules)) {
  const path = join(root, 'Rules', name + '.list');
  const input = name === 'China' ? chinaInput : globalInput;
  const lastCount = readRules(path, mode === '--write').size;
  if (values.size < Math.max(name === 'China' ? 1000 : 100, Math.ceil(lastCount * 0.8))) {
    throw new Error(name + ' rule count below safety floor: ' + values.size + ' (previous: ' + lastCount + ')');
  }
  summary.lists[name] = {
    sources: sources[name], candidates: input.domains.length, published: values.size,
    unsupported: input.unsupported, invalid: input.invalid,
  };
  outputs.set(path, '# Combined and modified from v2fly/domain-list-community and SukkaW/Surge.\n'
    + '# SPDX-License-Identifier: AGPL-3.0-only\n'
    + '# Licenses and corresponding source: https://github.com/v2raye/sub/tree/main/Surge/SingleNode\n'
    + [...values].sort().map(value => value.startsWith('.')
      ? 'DOMAIN-SUFFIX,' + value.slice(1)
      : 'DOMAIN,' + value).join('\n') + '\n');
}
outputs.set(join(root, 'Rules', 'stats.json'), JSON.stringify(summary, null, 2) + '\n');

for (const [path, content] of outputs) {
  if (mode === '--write') writeFileSync(path, content);
  else if (read(path) !== content) throw new Error('Generated file differs: ' + path);
}
console.log('Upstream %s | China %d | Global %d | Global rules removed %d | Proxy exceptions %d',
  revision, china.size, finalGlobal.size, removedGlobal.size, proxyExceptions.length);
