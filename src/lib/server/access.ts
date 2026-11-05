/** Who may open which address; the counterpart of the `routes` in staticwebapp.config.json. */

export const STAFF_ROLE = 'team_leitende';

export type Access = 'public' | 'staff' | 'none';

export function routeAccess(method: string, pathname: string): Access {
  if (/^\/(leitendenbereich|api\/intern)(\/|$)/.test(pathname)) return 'staff';
  if (pathname.startsWith('/api/')) {
    // The public functions (Nikolaus booking, contact, polls …) stay on the website; staff
    // pages here may still read public data
    return method === 'GET' || method === 'HEAD' ? 'public' : 'none';
  }
  return 'public';
}
