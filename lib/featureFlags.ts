export type FeatureFlag = 'attestation' | 'i18n';

const flags: Record<FeatureFlag, boolean> = {
  attestation: process.env.NEXT_PUBLIC_FEATURE_ATTESTATION === 'true',
  i18n: process.env.NEXT_PUBLIC_FEATURE_I18N === 'true',
};

export function isFeatureEnabled(feature: FeatureFlag): boolean {
  return flags[feature] ?? false;
}
