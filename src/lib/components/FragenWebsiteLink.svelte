<script lang="ts">
  /**
   * Port of the slot „header“ of pages/leitendenbereich/fragen-und-antworten.astro of
   * website-astro: the link to the public FAQ, which stays on the website.
   */
  import { WEBSITE } from '#lib/website';
</script>

<p class="text-sm">
  <a href={`${WEBSITE}/fragen-und-antworten`} class="font-semibold text-link">
    Öffentliche FAQ ansehen
  </a>
</p>
