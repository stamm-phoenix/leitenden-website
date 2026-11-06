<script lang="ts">
  // Port of pages/leitendenbereich/email/[postfach].astro of website-astro
  import Postfach from '#legacy/web/src/components/postfach/Postfach.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
  import type { PageProps } from './$types';

  let { data }: PageProps = $props();
</script>

<!-- Another mailbox opens anew, like a page change on the website -->
{#key data.postfach.id}
  <ClientOnly><Postfach postfach={data.postfach.id} address={data.postfach.address} /></ClientOnly>
{/key}
