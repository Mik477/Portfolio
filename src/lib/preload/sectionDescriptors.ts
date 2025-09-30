// Phase 1 extraction: section descriptor & asset URL utilities
// (No behavior change expected)

import type { AboutContent, Project } from '$lib/data/projectsData';

export interface SectionDescriptorBase {
	id: string;
	// Raw data payload (typed via union helpers below)
	data: unknown;
	// Optional layout Svelte component constructor
	layout?: any; // left as any to avoid importing SvelteComponent type here (keeps light)
}

export interface HeroSectionDescriptor extends SectionDescriptorBase {
	id: 'hero';
	data: any; // siteConfig.heroSection shape (not strictly typed yet)
}
export interface AboutSectionDescriptor extends SectionDescriptorBase {
	id: 'about';
	data: AboutContent;
}
export interface ContactSectionDescriptor extends SectionDescriptorBase {
	id: 'contact';
	data: AboutContent; // re-using AboutContent for now (similar shape w/ social links) TODO refine type
}
export interface ProjectSectionDescriptor extends SectionDescriptorBase {
	id: `project-${string}`;
	data: Project;
}

export type SectionDescriptor =
	| HeroSectionDescriptor
	| AboutSectionDescriptor
	| ContactSectionDescriptor
	| ProjectSectionDescriptor;

// Utility: derive asset URLs for a given section (mirrors legacy inline logic)
export function getSectionAssetUrls(section: SectionDescriptor): string[] {
	const urls: string[] = [];
	if (section.id === 'about') {
		const data = section.data as AboutContent;
		if (data?.imageUrl) urls.push(data.imageUrl);
	} else if (section.id.startsWith('project-')) {
		const p = section.data as Project;
		if (p.backgrounds?.length) {
			urls.push(p.backgrounds[0].value);
			if (p.backgrounds.length > 1) urls.push(p.backgrounds[1].value);
		}
		p.cards.forEach(card => { if (card.cardImage) urls.push(card.cardImage); });
	}
	return urls.filter(Boolean);
}
