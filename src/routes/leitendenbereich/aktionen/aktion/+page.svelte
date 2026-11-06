<script lang="ts">
  // Port of pages/leitendenbereich/aktionen/aktion.astro of website-astro
  import { page } from '$app/state';
  import CampflowEventDetail from '#legacy/web/src/components/CampflowEventDetail.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The page reads ?id= once when it opens; another query opens it anew, as on the website -->
{#key page.url.search}
  <ClientOnly><CampflowEventDetail /></ClientOnly>
{/key}
