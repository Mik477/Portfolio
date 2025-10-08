<script lang="ts">
  import NotFoundPage from '$lib/components/NotFoundPage.svelte';

  type NotFoundData = {
    locale?: 'en' | 'de';
    messages?: {
      common?: {
        error404?: {
          title?: string;
          description?: string;
          cta?: string;
          backLabel?: string;
        };
        a11y?: {
          backHome?: string;
        };
      };
    };
  };

  export let data: NotFoundData | undefined;

  const locale = data?.locale;
  const copy = data?.messages?.common?.error404 ?? {};
  const a11y = data?.messages?.common?.a11y ?? {};
</script>

<NotFoundPage status={404} {locale} {copy} {a11y} />
