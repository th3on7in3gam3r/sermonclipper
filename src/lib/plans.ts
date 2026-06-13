export const PLAN_LIMITS: Record<string, number> = {
  free: 2,
  creator: 20,
  church_pro: 999999,
};

export const FREE_STUDIO_TEMPLATES = new Set(['minimal']);

export type UpgradeFeature = 'export' | 'caption_templates' | 'custom_branding';

export const UPGRADE_COPY: Record<UpgradeFeature, { feature: string; plan: string; price: string }> = {
  export: {
    feature: 'Export cinematic reels with captions and effects baked in',
    plan: 'Creator',
    price: '$19/mo',
  },
  caption_templates: {
    feature: 'Premium caption styles and studio templates',
    plan: 'Creator',
    price: '$19/mo',
  },
  custom_branding: {
    feature: 'Custom branding and white-label exports',
    plan: 'Church Pro',
    price: '$49/mo',
  },
};

export function planAllowsExport(plan?: string | null): boolean {
  return plan === 'creator' || plan === 'church_pro';
}

export function planAllowsTemplate(plan: string | null | undefined, templateId: string): boolean {
  if (!plan || plan === 'free') return FREE_STUDIO_TEMPLATES.has(templateId);
  return true;
}

export function getUsageResetDate(lastUsageReset: Date | string | undefined): Date {
  const base = lastUsageReset ? new Date(lastUsageReset) : new Date();
  const reset = new Date(base);
  reset.setMonth(reset.getMonth() + 1);
  reset.setHours(0, 0, 0, 0);
  return reset;
}

export function formatResetDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
}
