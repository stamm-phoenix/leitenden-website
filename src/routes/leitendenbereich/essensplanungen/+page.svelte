<script lang="ts">
  // Port of pages/leitendenbereich/essensplanungen.astro of website-astro
  import MeineEssensplanungen from '#legacy/web/src/components/essensplanung/MeineEssensplanungen.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><MeineEssensplanungen /></ClientOnly>
