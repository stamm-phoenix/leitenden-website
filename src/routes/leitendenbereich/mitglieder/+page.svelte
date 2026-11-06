<script lang="ts">
  // Port of pages/leitendenbereich/mitglieder.astro of website-astro
  import Mitglieder from '#legacy/web/src/components/mitglieder/Mitglieder.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><Mitglieder /></ClientOnly>
