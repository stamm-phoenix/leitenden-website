import type { Component } from 'svelte';
import AktionenKalender from '#lib/components/AktionenKalender.svelte';

/**
 * What a page of website-astro put into the slot „header“ of StaffLayout.astro: shown by the
 * layout under the heading and intro (header `page`), keyed by the path as in `MOVED_PAGES`.
 */
export const PAGE_HEADER_CONTENT: Record<string, Component> = {
  '/leitendenbereich/aktionen': AktionenKalender,
};
