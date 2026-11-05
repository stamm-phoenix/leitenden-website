<script lang="ts">
  // Port of BrandMark.astro (kind „phoenix“) of website-astro
  import lily from '#legacy/web/src/assets/stammeslilie.svg?raw';

  interface Props {
    decorative?: boolean;
    class?: string;
  }

  let { decorative = false, class: className = '' }: Props = $props();
  const uid = $props.id();
  // Every copy needs its own IDs for the clip paths and the shared shape
  const geometry = $derived.by(() => {
    const prefix = `phoenix-${uid}-`;
    return lily
      .replace(/^<svg[^>]*>/, '')
      .replace(/<\/svg>\s*$/, '')
      .replaceAll('id="', `id="${prefix}`)
      .replaceAll('url(#', `url(#${prefix}`)
      .replaceAll('href="#', `href="#${prefix}`);
  });
</script>

<svg
  viewBox="0 0 380 490"
  width="380"
  height="490"
  role={decorative ? undefined : 'img'}
  aria-label={decorative ? undefined : 'Stamm Phoenix'}
  aria-hidden={decorative ? 'true' : undefined}
  class="brand-mark brand-mark--phoenix w-auto shrink-0 {className}"
>
  <!-- eslint-disable-next-line svelte/no-at-html-tags -- our own asset -->
  {@html geometry}
</svg>
