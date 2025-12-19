<!-- src/lib/components/subpage/ImageGalleryItem.svelte -->
<!-- Bordered image with caption for gallery displays -->
<script lang="ts">
  export let src: string;
  export let alt: string;
  export let caption: string | undefined = undefined;
  export let aspectRatio: string = '16/10';
  export let className: string = '';
</script>

<figure class="gallery-item {className}">
  <div class="image-frame">
    <img 
      {src} 
      {alt}
      loading="lazy"
      style="aspect-ratio: {aspectRatio};"
    />
  </div>
  {#if caption}
    <figcaption class="gallery-caption">{caption}</figcaption>
  {/if}
</figure>

<style>
  .gallery-item {
    margin: 0;
    display: flex;
    flex-direction: column;
  }

  .image-frame {
    position: relative;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 0.25rem;
    overflow: hidden;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    background: rgba(9, 9, 11, 0.5);
  }

  img {
    width: 100%;
    height: auto;
    object-fit: cover;
    display: block;
  }

  .gallery-caption {
    font-size: clamp(0.65rem, 1vw, 0.75rem);
    color: rgba(160, 160, 165, 0.9);
    margin-top: 0.5rem;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    text-align: center;
  }
</style>
