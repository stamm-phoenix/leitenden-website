<script lang="ts">
  /**
   * Port of pages/leitendenbereich/abrechnung/detail.astro of website-astro, which a rewrite in
   * staticwebapp.config.json served for /leitendenbereich/abrechnung/<evt_id>.
   */
  import { page } from '$app/state';
  import AbrechnungDetail from '#legacy/web/src/components/abrechnung/AbrechnungDetail.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The page reads the Aktion from the path once when it opens; another one opens it anew -->
{#key page.url.pathname}
  <ClientOnly><AbrechnungDetail /></ClientOnly>
{/key}
