<script lang="ts">
  // Port of pages/leitendenbereich/protokolle/protokoll.astro of website-astro
  import { page } from '$app/state';
  import ProtokollEditor from '#legacy/web/src/components/protokolle/ProtokollEditor.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The editor reads ?id= and ?bearbeiten= once when it opens; another query opens it anew, as on the website -->
{#key page.url.search}
  <ClientOnly><ProtokollEditor /></ClientOnly>
{/key}
