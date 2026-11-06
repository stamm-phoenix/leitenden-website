<script lang="ts">
  /**
   * Port of the slot „header“ of pages/leitendenbereich/aktionen/index.astro of website-astro:
   * the calendar feeds of the Aktionen. The links are TextLink.astro (variant „inline“).
   */
  import InfoHint from '#legacy/web/src/components/ui/InfoHint.svelte';

  const LEITENDE_ICS_URL = '/api/leitende.ics';
  const PUBLIC_ICS_URL = '/api/aktionen.ics';
  const link = 'font-semibold underline text-link hover:text-brand-900';
</script>

<p class="text-sm">
  Termine in deinen Kalender übernehmen:
  <a href={LEITENDE_ICS_URL} class={link} data-sveltekit-reload>Leitenden-Kalender</a>
  <InfoHint
    label="Leitenden-Kalender"
    text="Enthält nur Aktionen mit der Stufe „Leitende“."
    class="ml-1"
  />
  · <a href={PUBLIC_ICS_URL} class={link} data-sveltekit-reload>öffentlicher Kalender</a>
</p>
