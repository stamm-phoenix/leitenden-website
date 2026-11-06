<script lang="ts">
  import { page } from '$app/state';
  import { HELP_CONTACTS } from '#legacy/web/src/lib/helpContacts';
  import PlainPage from '#lib/components/PlainPage.svelte';

  // The login start checks the path again (safeReturnPath), so any value is safe here
  const retry = $derived(
    `/.auth/login/aad?post_login_redirect_uri=${encodeURIComponent(
      page.url.searchParams.get('ziel') ?? '/leitendenbereich'
    )}`
  );
</script>

<PlainPage title="Die Anmeldung hat nicht geklappt">
  <p class="max-w-2xl text-neutral-800">
    Du bist nicht angemeldet. Klappt es auch beim zweiten Mal nicht, schreib an
    <a class="text-link underline" href="mailto:{HELP_CONTACTS.technik}">{HELP_CONTACTS.technik}</a
    >.
  </p>
  <p class="mt-8">
    <a href={retry} class="btn-primary no-underline" data-sveltekit-reload>Noch einmal anmelden</a>
  </p>
</PlainPage>
