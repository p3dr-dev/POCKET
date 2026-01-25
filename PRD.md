# PRD: Smart Hustle & Safe Spend Integration

## 1. Objective
Align the "Daily Hustle Goal" (Meta de Fazer) with the "Real Available Liquidity" (Disponível para Gastar). If the user is in a liquidity deficit (Balance < Obligations), the Daily Goal must increase to cover the hole. If they are in a surplus, it helps cover the Monthly Goals.

## 2. Core Logic Changes
**Location**: `src/app/api/dashboard/intelligence/route.ts`

### Current Logic (Flawed)
- `Hustle Target` is based solely on `Monthly Needs` - `Current Income`.
- Ignores `Cash Balance`. If user has R$ 0 cash but high income (spent it all), the target says "Done", but user is insolvent.

### New "Smart Logic"
1. **Liquidity Check**:
   `Net Liquidity` = `Total Balance` - `Fixed Costs (Next 30d)`.
   
2. **Hustle Target Calculation**:
   - **Base Need**: `Goal Contributions` (Monthly).
   - **Adjustment**:
     - If `Net Liquidity < 0` (Deficit): Add `Abs(Net Liquidity)` to `Base Need`. (Earn to cover hole + goals).
     - If `Net Liquidity > 0` (Surplus): Subtract `Net Liquidity` from `Base Need`. (Cash covers goals).
   
3. **Daily Target**:
   `Daily Hustle` = `Max(0, Adjusted Total Need)` / `Days Remaining in Month`.

## 3. UI Implications
- **HustleWidget**: Will now show a dynamic target that reacts to spending. If user spends money, Balance drops -> Net Liquidity drops -> Target INCREASES.
- **Feedback**: The user stays "Green" because the system constantly adjusts the "Required Work" to maintain solvency.

## 4. Work Breakdown
- **Ticket-001**: Implement Smart Hustle Logic in API.
