/**
 * Section 5: Deterministic Crop Health Score Calculation (0 - 100)
 * 
 * Formula:
 * - Base score: 100
 * - Severity penalty:
 *   none: 0, low: -10, moderate: -25, high: -45, critical: -70
 * - Confidence weighting: penalty * confidence
 * - Symptom count penalty: -3 points per distinct symptom (max -15)
 * - Previous scan trend modifier:
 *   worsening trend (higher severity than previous): -5
 *   recovering trend (lower severity than previous): +5
 * - Clamped between 0 and 100
 */

export type SeverityType = 'none' | 'low' | 'moderate' | 'high' | 'critical';
export type RiskLevelType = 'low' | 'moderate' | 'elevated' | 'high';

export function calculateDeterministicHealthScore(
  severity: SeverityType | string,
  confidence: number,
  symptoms: string[],
  previousSeverity?: SeverityType | string
): { healthScore: number; riskLevel: RiskLevelType } {
  const penalties: Record<string, number> = {
    none: 0,
    low: 10,
    moderate: 25,
    high: 45,
    critical: 70
  };

  const normalizedSeverity = (severity || 'low').toLowerCase();
  const basePenalty = penalties[normalizedSeverity] ?? 10;
  const conf = Math.max(0, Math.min(1, typeof confidence === 'number' && !isNaN(confidence) ? confidence : 0.8));
  const weightedPenalty = basePenalty * conf;

  const distinctSymptoms = Array.isArray(symptoms)
    ? Array.from(new Set(symptoms.map(s => s.trim().toLowerCase()))).filter(Boolean)
    : [];
  const symptomPenalty = Math.min(15, distinctSymptoms.length * 3);

  let trendModifier = 0;
  if (previousSeverity) {
    const rank: Record<string, number> = { none: 0, low: 1, moderate: 2, high: 3, critical: 4 };
    const prevRank = rank[previousSeverity.toLowerCase()] ?? 1;
    const currRank = rank[normalizedSeverity] ?? 1;
    if (currRank > prevRank) {
      trendModifier = -5; // Worsening trend
    } else if (currRank < prevRank) {
      trendModifier = 5;  // Recovering trend
    }
  }

  const rawScore = 100 - weightedPenalty - symptomPenalty + trendModifier;
  const healthScore = Math.round(Math.max(0, Math.min(100, rawScore)));

  let riskLevel: RiskLevelType = 'low';
  if (healthScore >= 80) riskLevel = 'low';
  else if (healthScore >= 65) riskLevel = 'moderate';
  else if (healthScore >= 50) riskLevel = 'elevated';
  else riskLevel = 'high';

  return { healthScore, riskLevel };
}
