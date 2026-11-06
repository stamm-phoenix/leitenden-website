<script lang="ts">
  // Port of pages/leitendenbereich/essensplanung-zutaten.astro of website-astro
  import EssensplanungZutatenliste from '#legacy/web/src/components/essensplanung/EssensplanungZutatenliste.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><EssensplanungZutatenliste /></ClientOnly>
