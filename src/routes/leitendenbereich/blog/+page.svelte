<script lang="ts">
  // Port of pages/leitendenbereich/blog/index.astro of website-astro
  import BlogPflege from '#legacy/web/src/components/pflege/BlogPflege.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><BlogPflege /></ClientOnly>
