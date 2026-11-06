<script lang="ts">
  // Port of pages/leitendenbereich/aktionen/fahrten.astro of website-astro
  import { page } from '$app/state';
  import FahrtenPlaner from '#legacy/web/src/components/FahrtenPlaner.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The planner reads the query once when it opens and then keeps it up to date itself; a link
     to another Aktion (?id=) opens it anew, as on the website -->
{#key page.url.search}
  <ClientOnly><FahrtenPlaner /></ClientOnly>
{/key}
