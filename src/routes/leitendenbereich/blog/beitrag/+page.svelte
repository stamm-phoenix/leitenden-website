<script lang="ts">
  // Port of pages/leitendenbereich/blog/beitrag.astro of website-astro
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import BlogEditor from '#legacy/web/src/components/pflege/BlogEditor.svelte';
  import { requestBlogPostEarly } from '#legacy/web/src/lib/blogPostRequest';
  import ClientOnly from '#lib/components/ClientOnly.svelte';

  // The post loads while the editor's code is still loading, instead of after it
  onMount(requestBlogPostEarly);
</script>

<!-- The editor reads the post (?id=) from the address once when it opens -->
{#key page.url.search}
  <ClientOnly><BlogEditor /></ClientOnly>
{/key}
