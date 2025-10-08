<script lang="ts">
  import NotFoundPage from '$lib/components/NotFoundPage.svelte';

  export let status: number;
  export let error: Error & { message?: string };
  type ErrorPageData = {
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
  export let data: ErrorPageData | undefined;

  const locale = data?.locale;
  const copy = data?.messages?.common?.error404 ?? {};
  const a11y = data?.messages?.common?.a11y ?? {};
  const errorMessage = status !== 404 ? error?.message : undefined;
</script>

<NotFoundPage {status} {locale} {copy} {a11y} errorMessage={errorMessage} />
