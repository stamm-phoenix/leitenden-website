/**
 * Values read from the environment: secrets and switches only (see AGENTS.md
 * „Configuration“). Everything else is in `config.ts`.
 */
function read(name: string): string | undefined {
  return process.env[name] || undefined;
}

export const env = {
  /** Set by Azure Container Apps in every container: of the web app, or of a job (timers). */
  get inAzure(): boolean {
    return read('CONTAINER_APP_NAME') !== undefined || read('CONTAINER_APP_JOB_NAME') !== undefined;
  },
  /** Local demo mode with the mock API of website-astro (`bun run dev:mock`). */
  get mockApi(): boolean {
    return read('MOCK_API') === '1';
  },
  /** Encrypts the login cookie; a Container App secret. */
  get sessionSecret(): string {
    const value = read('SESSION_SECRET');
    if (!value || value.length < 32)
      throw new Error('SESSION_SECRET missing or shorter than 32 characters');
    return value;
  },
};
