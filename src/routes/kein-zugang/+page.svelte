<script lang="ts">
  import { HELP_CONTACTS } from '#legacy/web/src/lib/helpContacts';
  import PlainPage from '#lib/components/PlainPage.svelte';
</script>

<!-- The teams are read on every visit (src/lib/server/principal.ts), so no new login is needed -->
<PlainPage title="Kein Zugang zum Leitendenbereich">
  <div class="max-w-2xl space-y-4 text-neutral-800">
    <p>
      Der Leitendenbereich ist nur für Mitglieder des Teams „Leitende“ in Microsoft Teams
      freigegeben. Bist du gerade erst ins Team gekommen, lade diese Seite in fünf Minuten neu.
    </p>
    <p>
      Klappt es danach nicht, schreib an
      <a class="text-link underline" href="mailto:{HELP_CONTACTS.technik}"
        >{HELP_CONTACTS.technik}</a
      >.
    </p>
  </div>
  <p class="mt-8 flex flex-wrap gap-3">
    <a href="/leitendenbereich" class="btn-primary no-underline" data-sveltekit-reload>Neu laden</a>
    <a
      href="/.auth/logout?post_logout_redirect_uri=/.auth/login/aad"
      class="btn-secondary no-underline"
      data-sveltekit-reload
    >
      Mit anderem Konto anmelden
    </a>
  </p>
</PlainPage>
