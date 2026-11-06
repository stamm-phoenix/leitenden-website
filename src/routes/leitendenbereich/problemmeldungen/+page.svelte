<script lang="ts">
  // Port of pages/leitendenbereich/problemmeldungen.astro of website-astro
  import ProblemmeldungenPflege from '#legacy/web/src/components/pflege/ProblemmeldungenPflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><ProblemmeldungenPflege /></ClientOnly>
