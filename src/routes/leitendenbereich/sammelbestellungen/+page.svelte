<script lang="ts">
  // Port of pages/leitendenbereich/sammelbestellungen/index.astro of website-astro
  import SammelCampaignList from '#legacy/web/src/components/sammelbestellungen/SammelCampaignList.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><SammelCampaignList /></ClientOnly>
