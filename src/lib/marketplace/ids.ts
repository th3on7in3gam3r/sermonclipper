export function marketplaceTemplateId(id: string) {
  return `marketplace:${id}`;
}

export function parseMarketplaceTemplateId(template: string): string | null {
  if (!template.startsWith('marketplace:')) return null;
  return template.slice('marketplace:'.length);
}
