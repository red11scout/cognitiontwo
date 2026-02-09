import HyperFormula from "hyperformula";
import type { TrustTaxBreakdown, UseCase, CognitiveNode } from "@shared/schema";

// Initialize HyperFormula with configuration for financial accuracy
const hfOptions = {
  licenseKey: "gpl-v3",
  precisionRounding: 10, // High precision for intermediate calculations
  smartRounding: false, // Disable smart rounding for predictable results
  precisionEpsilon: 1e-13, // Small epsilon for floating point comparisons
};

/**
 * Calculation Engine using HyperFormula for financial projections
 * Provides spreadsheet-like formulas for Trust Tax, ROI, and other calculations
 */
export class CalculationEngine {
  /**
   * Create a fresh HyperFormula instance with initial data
   */
  private createInstance(data: (string | number | null)[][]): HyperFormula {
    const hf = HyperFormula.buildFromArray(data, hfOptions);
    return hf;
  }

  /**
   * Get cell value as number from HyperFormula instance
   */
  private getCellValue(hf: HyperFormula, row: number, col: number): number {
    const value = hf.getCellValue({ sheet: 0, row, col });
    if (typeof value === "number") {
      return value;
    }
    return 0;
  }

  /**
   * Calculate Trust Tax breakdown from raw values
   */
  calculateTrustTax(
    currentHumanCost: number,
    aiEfficiencyPercent: number = 75,
    trustTaxPercent: number = 15
  ): TrustTaxBreakdown {
    // Set up the spreadsheet data
    // Row 0: Input values
    // Row 1: AI Efficiency Savings calculation
    // Row 2: Trust Tax calculation  
    // Row 3: Final LCOAI calculation
    const data: (string | number | null)[][] = [
      [currentHumanCost, aiEfficiencyPercent / 100, trustTaxPercent / 100],
      ["=A1*B1", null, null], // AI Efficiency Savings = Human Cost * Efficiency %
      ["=A2*C1", null, null], // Trust Tax Cost = Savings * Trust Tax %
      ["=A1-A2+A3", null, null], // Final LCOAI = Human Cost - Savings + Trust Tax
    ];

    const hf = this.createInstance(data);

    // Get calculated values
    const aiEfficiencySavings = this.getCellValue(hf, 1, 0);
    const trustTaxCost = this.getCellValue(hf, 2, 0);
    const finalLCOAI = this.getCellValue(hf, 3, 0);

    // Cleanup
    hf.destroy();

    return {
      currentHumanCost: Math.round(currentHumanCost),
      aiEfficiencySavings: Math.round(aiEfficiencySavings),
      trustTaxCost: Math.round(trustTaxCost),
      finalLCOAI: Math.round(finalLCOAI),
      currency: "$",
    };
  }

  /**
   * Calculate ROI metrics for a use case
   */
  calculateUseCaseROI(
    estimatedSavings: number,
    implementationCost: number,
    yearsToPayback: number = 1
  ): {
    roi: number;
    paybackMonths: number;
    netPresentValue: number;
  } {
    // Set up ROI calculations
    // A1: Savings, B1: Cost, C1: Years, D1: Discount rate
    const data: (string | number | null)[][] = [
      [estimatedSavings, implementationCost, yearsToPayback, 0.1],
      ["=(A1-B1)/B1*100", null, null, null], // ROI %
      ["=B1/A1*12", null, null, null], // Payback in months
      ["=A1*C1/(1+D1)^C1-B1", null, null, null], // NPV simplified
    ];

    const hf = this.createInstance(data);

    const result = {
      roi: Math.round(this.getCellValue(hf, 1, 0) * 100) / 100,
      paybackMonths: Math.round(this.getCellValue(hf, 2, 0) * 10) / 10,
      netPresentValue: Math.round(this.getCellValue(hf, 3, 0)),
    };

    hf.destroy();
    return result;
  }

  /**
   * Calculate aggregate metrics from cognitive nodes
   */
  calculateCognitiveMetrics(nodes: CognitiveNode[]): {
    averageHumanLoad: number;
    averageAiLoad: number;
    totalLoadReduction: number;
    loadReductionPercent: number;
  } {
    if (nodes.length === 0) {
      return {
        averageHumanLoad: 0,
        averageAiLoad: 0,
        totalLoadReduction: 0,
        loadReductionPercent: 0,
      };
    }

    // Build data array for HyperFormula
    // Column A: Human loads, Column B: AI loads
    const data: (number | string | null)[][] = nodes.map((node) => [
      node.humanCognitiveLoad,
      node.aiCognitiveLoad,
    ]);

    // Add formula rows
    const nodeCount = nodes.length;
    data.push([`=AVERAGE(A1:A${nodeCount})`, `=AVERAGE(B1:B${nodeCount})`]);
    data.push([`=SUM(A1:A${nodeCount})-SUM(B1:B${nodeCount})`, null]);
    data.push([`=(SUM(A1:A${nodeCount})-SUM(B1:B${nodeCount}))/SUM(A1:A${nodeCount})*100`, null]);

    const hf = this.createInstance(data);

    const result = {
      averageHumanLoad: Math.round(this.getCellValue(hf, nodeCount, 0) * 10) / 10,
      averageAiLoad: Math.round(this.getCellValue(hf, nodeCount, 1) * 10) / 10,
      totalLoadReduction: Math.round(this.getCellValue(hf, nodeCount + 1, 0)),
      loadReductionPercent: Math.round(this.getCellValue(hf, nodeCount + 2, 0) * 10) / 10,
    };

    hf.destroy();
    return result;
  }

  /**
   * Calculate total savings across all use cases
   */
  calculateTotalSavings(useCases: UseCase[]): {
    totalAnnualSavings: number;
    averageDataReadiness: number;
    averageBusinessValue: number;
    averageRisk: number;
    horizonBreakdown: { h1: number; h2: number; h3: number };
  } {
    if (useCases.length === 0) {
      return {
        totalAnnualSavings: 0,
        averageDataReadiness: 0,
        averageBusinessValue: 0,
        averageRisk: 0,
        horizonBreakdown: { h1: 0, h2: 0, h3: 0 },
      };
    }

    // Parse savings strings to numbers (remove $ and commas)
    const parsedSavings = useCases.map((uc) => {
      const match = uc.estimatedSavings.match(/[\d,]+/);
      return match ? parseInt(match[0].replace(/,/g, ""), 10) : 0;
    });

    // Build data array
    // A: Savings, B: DataReadiness, C: BusinessValue, D: Risk, E: Horizon
    const data: (number | string | null)[][] = useCases.map((uc, i) => [
      parsedSavings[i],
      uc.dataReadiness,
      uc.businessValue,
      uc.implementationRisk,
      uc.horizon,
    ]);

    const count = useCases.length;
    data.push([
      `=SUM(A1:A${count})`,
      `=AVERAGE(B1:B${count})`,
      `=AVERAGE(C1:C${count})`,
      `=AVERAGE(D1:D${count})`,
      null,
    ]);

    // Horizon breakdowns using SUMIF
    data.push([
      `=SUMIF(E1:E${count},1,A1:A${count})`,
      `=SUMIF(E1:E${count},2,A1:A${count})`,
      `=SUMIF(E1:E${count},3,A1:A${count})`,
      null,
      null,
    ]);

    const hf = this.createInstance(data);

    const result = {
      totalAnnualSavings: Math.round(this.getCellValue(hf, count, 0)),
      averageDataReadiness: Math.round(this.getCellValue(hf, count, 1) * 10) / 10,
      averageBusinessValue: Math.round(this.getCellValue(hf, count, 2) * 10) / 10,
      averageRisk: Math.round(this.getCellValue(hf, count, 3) * 10) / 10,
      horizonBreakdown: {
        h1: Math.round(this.getCellValue(hf, count + 1, 0)),
        h2: Math.round(this.getCellValue(hf, count + 1, 1)),
        h3: Math.round(this.getCellValue(hf, count + 1, 2)),
      },
    };

    hf.destroy();
    return result;
  }

  /**
   * Run a custom formula calculation
   */
  evaluateFormula(formula: string): number {
    const data: (string | null)[][] = [[formula]];
    const hf = this.createInstance(data);
    const result = this.getCellValue(hf, 0, 0);
    hf.destroy();
    return result;
  }
}

// Export a singleton instance for reuse
let calculationEngineInstance: CalculationEngine | null = null;

export function getCalculationEngine(): CalculationEngine {
  if (!calculationEngineInstance) {
    calculationEngineInstance = new CalculationEngine();
  }
  return calculationEngineInstance;
}

// Convenience function for one-off Trust Tax calculations
export function calculateTrustTax(
  currentHumanCost: number,
  aiEfficiencyPercent: number = 75,
  trustTaxPercent: number = 15
): TrustTaxBreakdown {
  const engine = getCalculationEngine();
  return engine.calculateTrustTax(currentHumanCost, aiEfficiencyPercent, trustTaxPercent);
}
