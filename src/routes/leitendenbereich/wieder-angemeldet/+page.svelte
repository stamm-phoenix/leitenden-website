<script lang="ts">
  // Target of „Neu anmelden (öffnet neuen Tab)“ after the login expired (`RELOGIN_URL` in lib/api.ts of website-astro)
  import { HELP_CONTACTS } from '#legacy/web/src/lib/helpContacts';
</script>

<p class="text-neutral-700">
  Klappt das Speichern im anderen Tab trotzdem nicht, schreib an
  <a class="text-link underline" href="mailto:{HELP_CONTACTS.technik}">{HELP_CONTACTS.technik}</a>.
</p>
