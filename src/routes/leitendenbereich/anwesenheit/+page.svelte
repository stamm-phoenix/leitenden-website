<script lang="ts">
  // Port of pages/leitendenbereich/anwesenheit.astro of website-astro
  import AnwesenheitPflege from '#legacy/web/src/components/pflege/AnwesenheitPflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><AnwesenheitPflege /></ClientOnly>
