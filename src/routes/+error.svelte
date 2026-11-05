<script lang="ts">
  import { page } from '$app/state';
  import { HELP_CONTACTS } from '#legacy/web/src/lib/helpContacts';
  import PlainPage from '#lib/components/PlainPage.svelte';

  const title = $derived(
    page.status === 404 ? 'Diese Seite gibt es nicht' : 'Etwas hat nicht geklappt'
  );
</script>

<PlainPage {title}>
  <div class="max-w-2xl space-y-4 text-neutral-800">
    {#if page.error?.message && page.status !== 404 && page.status !== 500}
      <p>{page.error.message}</p>
    {/if}
    <p>
      Klappt es auch beim nächsten Versuch nicht, schreib an
      <a class="text-link underline" href="mailto:{HELP_CONTACTS.technik}"
        >{HELP_CONTACTS.technik}</a
      >.
    </p>
  </div>
  <p class="mt-8">
    <a href="/leitendenbereich" class="btn-primary no-underline" data-sveltekit-reload>
      Zur Übersicht
    </a>
  </p>
</PlainPage>
