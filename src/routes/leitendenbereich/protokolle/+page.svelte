<script lang="ts">
  // Port of pages/leitendenbereich/protokolle.astro of website-astro
  import ProtokollePflege from '#legacy/web/src/components/pflege/ProtokollePflege.svelte';
  import ProtokollEditorListe from '#legacy/web/src/components/protokolle/ProtokollEditorListe.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><ProtokollEditorListe /></ClientOnly>

<div class="mt-12">
  <h2 class="mb-4 font-serif text-2xl text-brand-900">Protokoll-Dateien</h2>
  <ClientOnly><ProtokollePflege /></ClientOnly>
</div>
