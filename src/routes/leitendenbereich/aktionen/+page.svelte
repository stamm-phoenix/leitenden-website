<script lang="ts">
  // Port of pages/leitendenbereich/aktionen/index.astro of website-astro; its line about the
  // calendars (slot „header“) is AktionenKalender.svelte, shown by the layout
  import CampflowEvents from '#legacy/web/src/components/CampflowEvents.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><CampflowEvents /></ClientOnly>
