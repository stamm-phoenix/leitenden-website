import type { ClientPrincipal } from '#legacy/api/lib/staff-auth';

declare global {
  namespace App {
    interface Locals {
      /** The logged-in user with the team roles, as Static Web Apps describes them. */
      principal?: ClientPrincipal;
    }
  }
}

export {};

declare global {
  /** Commit of this build (vite.config.ts), empty without git. */
  const __BUILD_COMMIT__: string;
}
