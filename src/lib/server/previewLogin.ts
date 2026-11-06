/**
 * The test account for PR previews (`CONFIG.staff.previewOnlyLogins`, `docs/preview-testkonto.md`
 * of website-astro). On a preview it may sign in and gets the roles of every team
 * (`getTeamRoles`); everywhere else its login is refused and a session of it is ignored, in
 * addition to the `403 PREVIEW_ONLY` of `requireStaff`.
 */
import { isPreviewDeployment, isPreviewOnlyLogin } from '#legacy/api/lib/staff-auth';
import { PREVIEW_DATABASE } from './deployment';

/**
 * A revision of a PR preview: it has the name of its database (`container-app.sh`), and the
 * API of website-astro therefore talks to the preview server. Both must agree.
 */
export function runsAsPreview(): boolean {
  return PREVIEW_DATABASE !== null && isPreviewDeployment();
}

/** Whether `login` may have a session in this deployment. */
export function mayLogInHere(login: string, preview: boolean = runsAsPreview()): boolean {
  return preview || !isPreviewOnlyLogin(login);
}
