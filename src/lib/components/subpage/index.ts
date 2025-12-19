// src/lib/components/subpage/index.ts
// Barrel exports for subpage components

// Shared components
export { default as StatsBar, type StatItem } from './StatsBar.svelte';
export { default as FeatureCard } from './FeatureCard.svelte';
export { default as ImageGalleryItem } from './ImageGalleryItem.svelte';
export { default as MaterialsStrip } from './MaterialsStrip.svelte';
export { default as SectionTitle } from './SectionTitle.svelte';

// Section-specific layouts
export { default as OverviewSection } from './sections/OverviewSection.svelte';
export { default as ManufacturingSection } from './sections/ManufacturingSection.svelte';
export { default as CapabilitiesSection } from './sections/CapabilitiesSection.svelte';
export { default as TestingSection } from './sections/TestingSection.svelte';
