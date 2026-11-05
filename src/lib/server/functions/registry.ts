import type { HttpFunctionOptions, HttpHandler } from './types';

/** One segment of a Functions route template such as `intern/aufgaben/{id:int?}`. */
export type RouteSegment =
  | { kind: 'literal'; value: string }
  | { kind: 'param'; name: string; optional: boolean; int: boolean }
  /** Text and parameters in one segment, e.g. `{stufe}.ics`. */
  | { kind: 'mixed'; pattern: RegExp; names: string[] }
  | { kind: 'catchAll'; name: string };

export interface Route {
  name: string;
  template: string;
  segments: RouteSegment[];
  methods: Set<string>;
  handler: HttpHandler;
}

const routes: Route[] = [];

const PARAMETER = /\{(\*)?([A-Za-z_]\w*)(?::(int))?(\?)?\}/g;

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function parseSegment(segment: string): RouteSegment {
  const parts = [...segment.matchAll(PARAMETER)];
  if (parts.length === 0) {
    if (/[{}]/.test(segment)) throw new Error(`Unsupported route segment: ${segment}`);
    return { kind: 'literal', value: segment.toLowerCase() };
  }
  const [whole, star, name, constraint, optional] = parts[0];
  if (parts.length === 1 && whole === segment) {
    if (star) return { kind: 'catchAll', name };
    return { kind: 'param', name, optional: optional === '?', int: constraint === 'int' };
  }
  // Mixed: every parameter matches at least one character, as in ASP.NET routing
  let source = '';
  let rest = 0;
  const names: string[] = [];
  for (const part of parts) {
    if (part[1] || part[4]) throw new Error(`Unsupported route segment: ${segment}`);
    source += escapeRegExp(segment.slice(rest, part.index ?? 0));
    source += part[3] === 'int' ? '(-?\\d+)' : '(.+?)';
    names.push(part[2]);
    rest = (part.index ?? 0) + part[0].length;
  }
  source += escapeRegExp(segment.slice(rest));
  return { kind: 'mixed', pattern: new RegExp(`^${source}$`, 'i'), names };
}

export function parseTemplate(template: string): RouteSegment[] {
  return template.split('/').filter(Boolean).map(parseSegment);
}

/**
 * How specific a segment is, as in ASP.NET routing that the Functions host uses: a literal
 * beats text with a parameter in it, then a constrained parameter, a plain one, an optional one
 * and a catch-all.
 */
function rank(segment: RouteSegment | undefined): number {
  if (!segment) return 6;
  if (segment.kind === 'literal') return 0;
  if (segment.kind === 'mixed') return 1;
  if (segment.kind === 'catchAll') return 5;
  if (segment.optional) return 4;
  return segment.int ? 2 : 3;
}

export function compareRoutes(a: Route, b: Route): number {
  const length = Math.max(a.segments.length, b.segments.length);
  for (let index = 0; index < length; index += 1) {
    const difference = rank(a.segments[index]) - rank(b.segments[index]);
    if (difference !== 0) return difference;
  }
  return 0;
}

/** Called by `app.http()`; without `route` the function name is the route, as in Azure. */
export function registerRoute(name: string, options: HttpFunctionOptions): void {
  const template = options.route ?? name;
  routes.push({
    name,
    template,
    segments: parseTemplate(template),
    methods: new Set(options.methods ?? ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']),
    handler: options.handler,
  });
  routes.sort(compareRoutes);
}

export function registeredRoutes(): readonly Route[] {
  return routes;
}

/** The parameters of `path` (below `/api/`) if it fits the route, otherwise `undefined`. */
export function matchRoute(route: Route, path: string[]): Record<string, string> | undefined {
  const params: Record<string, string> = {};
  for (const [index, segment] of route.segments.entries()) {
    const part = path[index];
    if (segment.kind === 'catchAll') {
      params[segment.name] = path.slice(index).join('/');
      return params;
    }
    if (part === undefined) {
      if (segment.kind === 'param' && segment.optional) continue;
      return undefined;
    }
    if (segment.kind === 'literal') {
      if (part.toLowerCase() !== segment.value) return undefined;
      continue;
    }
    if (segment.kind === 'mixed') {
      const match = segment.pattern.exec(part);
      if (!match) return undefined;
      segment.names.forEach((name, position) => (params[name] = match[position + 1]));
      continue;
    }
    if (segment.int && !/^-?\d+$/.test(part)) return undefined;
    params[segment.name] = part;
  }
  return path.length <= route.segments.length ? params : undefined;
}
