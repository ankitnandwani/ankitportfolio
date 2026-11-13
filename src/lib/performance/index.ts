/**
 * The measurement of the size of the site.
 *
 * The ceilings live in `budgets.ts`, and the script that reads the build and
 * compares it with them lives in `scripts/measurePerformance.mts`. The layer
 * is not imported by the site: the measurement is a script of the machine and
 * nothing of it is in the bundle of the browser.
 */

export { PERFORMANCE_BUDGETS, evaluateBudgets, formatBytes, formatSeconds } from './budgets.ts';
export type {
  BudgetEvaluation,
  BudgetFailure,
  BudgetKind,
  BudgetLimit,
  BudgetUnit,
} from './budgets.ts';
