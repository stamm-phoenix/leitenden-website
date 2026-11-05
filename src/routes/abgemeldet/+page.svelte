<script lang="ts">
  import PlainPage from '#lib/components/PlainPage.svelte';
</script>

<PlainPage title="Du bist abgemeldet">
  <p class="max-w-2xl text-neutral-800">
    Auf einem fremden oder geteilten Gerät schließt du am besten jetzt alle Fenster des Browsers.
  </p>
  <p class="mt-8">
    <a href="/.auth/login/aad" class="btn-primary no-underline" data-sveltekit-reload>
      Wieder anmelden
    </a>
  </p>
</PlainPage>
