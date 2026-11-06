/**
 * The part of the `@azure/functions` v4 types that the API of website-astro uses. Kept
 * compatible with the real package, so the submodule type-checks against either.
 */

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export interface Cookie {
  name: string;
  value: string;
  domain?: string;
  path?: string;
  expires?: Date | number;
  secure?: boolean;
  httpOnly?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
  maxAge?: number;
}

export interface HttpRequestUser {
  type: 'AppService' | 'StaticWebApps';
  id: string;
  username: string;
  identityProvider: string;
  claimsPrincipalData: Record<string, unknown>;
}

export interface HttpRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Headers;
  readonly query: URLSearchParams;
  readonly params: Record<string, string>;
  readonly user: HttpRequestUser | null;
  readonly body: ReadableStream<Uint8Array> | null;
  readonly bodyUsed: boolean;
  arrayBuffer(): Promise<ArrayBuffer>;
  blob(): Promise<Blob>;
  formData(): Promise<FormData>;
  json(): Promise<unknown>;
  text(): Promise<string>;
  clone(): HttpRequest;
}

export type HttpResponseBody =
  | string
  | ArrayBuffer
  | ArrayBufferView
  | Blob
  | FormData
  | URLSearchParams
  | ReadableStream<Uint8Array>
  | AsyncIterable<Uint8Array>
  | null
  | undefined;

export interface HttpResponseInit {
  status?: number;
  body?: HttpResponseBody;
  jsonBody?: unknown;
  headers?: HeadersInit;
  cookies?: Cookie[];
  enableContentNegotiation?: boolean;
}

export interface InvocationContext {
  readonly invocationId: string;
  readonly functionName: string;
  log(...args: unknown[]): void;
  trace(...args: unknown[]): void;
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export type HttpHandler = (
  request: HttpRequest,
  context: InvocationContext
) => HttpResponseInit | Promise<HttpResponseInit>;

export interface HttpFunctionOptions {
  handler: HttpHandler;
  methods?: HttpMethod[];
  authLevel?: 'anonymous' | 'function' | 'admin';
  route?: string;
}

/** What the timers of website-astro read from the timer argument; a job run is never late. */
export interface Timer {
  isPastDue: boolean;
}

export type TimerHandler = (timer: Timer, context: InvocationContext) => Promise<void> | void;

export interface TimerFunctionOptions {
  /** NCRONTAB with seconds, in UTC; the job of the timer has the same time (timer-jobs.sh). */
  schedule: string;
  handler: TimerHandler;
  runOnStartup?: boolean;
  useMonitor?: boolean;
}
