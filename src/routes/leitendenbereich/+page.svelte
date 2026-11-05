<script lang="ts">
  // Port of pages/leitendenbereich/index.astro of website-astro
  import StaffDashboard from '#legacy/web/src/components/StaffDashboard.svelte';
  import StaffGreeting from '#legacy/web/src/components/StaffGreeting.svelte';
  import StaffModuleSearch from '#legacy/web/src/components/StaffModuleSearch.svelte';
  import ChangelogNotice from '#legacy/web/src/components/changelog/ChangelogNotice.svelte';
  import NikolausStaffNotice from '#legacy/web/src/components/NikolausStaffNotice.svelte';
  import StaffModuleSection from '#legacy/web/src/components/StaffModuleSection.svelte';
  import NikolausStaffSection from '#legacy/web/src/components/NikolausStaffSection.svelte';
  import {
    NIKOLAUS_CONTROL_MODULE,
    NIKOLAUS_MODULES,
    STAFF_MODULE_SECTIONS,
  } from '#legacy/web/src/lib/staffModules';
  import ClientOnly from '#lib/components/ClientOnly.svelte';

  const sections = STAFF_MODULE_SECTIONS.filter((section) => section.modules.length > 0);
  const searchGroups = [
    ...sections,
    { id: 'nikolaus', title: 'Nikolausdienst', modules: [NIKOLAUS_CONTROL_MODULE] },
  ];
</script>

<section class="space-y-3" aria-label="Begrüßung und Suche">
  <StaffGreeting />
  <!-- On wide screens the sidebar has the search -->
  <div class="max-w-xl xl:hidden">
    <StaffModuleSearch groups={searchGroups} nikolausModules={NIKOLAUS_MODULES} variant="start" />
  </div>
</section>

<ClientOnly>
  <div class="mt-4"><ChangelogNotice /></div>
  <div class="mt-4"><NikolausStaffNotice /></div>
</ClientOnly>

<StaffDashboard />

<!-- On wide screens the sidebar lists every area -->
<section aria-labelledby="all-areas-heading" class="mt-8 xl:hidden">
  <h2 id="all-areas-heading" class="font-serif text-lg font-semibold text-brand-900">
    Alle Bereiche
  </h2>
  {#each sections as section (section.id)}
    <StaffModuleSection title={section.title} modules={section.modules} />
  {/each}
  <ClientOnly><NikolausStaffSection /></ClientOnly>
</section>
