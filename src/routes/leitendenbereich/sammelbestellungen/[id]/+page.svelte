<script lang="ts">
  /**
   * Port of pages/leitendenbereich/sammelbestellungen/detail.astro of website-astro, which a
   * rewrite in staticwebapp.config.json served for /leitendenbereich/sammelbestellungen/<id>.
   */
  import { page } from '$app/state';
  import SammelStaff from '#legacy/web/src/components/sammelbestellungen/SammelStaff.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<!-- The page reads the Sammelbestellung from the path once when it opens -->
{#key page.url.pathname}
  <ClientOnly><SammelStaff /></ClientOnly>
{/key}
