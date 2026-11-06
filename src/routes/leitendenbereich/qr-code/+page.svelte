<script lang="ts">
  // Port of pages/leitendenbereich/qr-code.astro of website-astro
  import QrCodeGenerator from '#legacy/web/src/components/qrcode/QrCodeGenerator.svelte';
  import ClientOnly from '#lib/components/ClientOnly.svelte';
</script>

<ClientOnly><QrCodeGenerator /></ClientOnly>
