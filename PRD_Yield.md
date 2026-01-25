# PRD: Magie Yield Integration (Automated Passive Income)

## 1. Objective
Integrate a "Yield Engine" into the Accounts system to model the "Magie" account behavior: daily liquidity, 100% CDI yield, and automatic tax deduction (IR + PIS/COFINS ~27.15%).

## 2. Requirements

### 2.1. Data Model (Account)
- **`yieldCdiPercent`**: (Float, Optional) The percentage of CDI this account yields (e.g., 100.0). If null/0, no yield.
- **`yieldLastUpdate`**: (DateTime, Optional) Timestamp of the last yield calculation to prevent double-dipping.

### 2.2. Logic (Yield Service)
- **Algorithm**: Compound Daily Interest.
  - `Annual Rate` = 11.25% (Configurable/Constant for now).
  - `Daily Rate` = `((1 + AnnualRate) ^ (1/252)) - 1`.
  - `Gross Yield` = `Balance * DailyRate`.
  - `Net Yield` = `Gross Yield * (1 - 0.2715)` (Tax deduction).
- **Process**:
  - Identify accounts with `yieldCdiPercent > 0`.
  - Calculate yield since `yieldLastUpdate` (or yesterday).
  - Create a Transaction:
    - Type: `INCOME`
    - Category: `Rendimentos` (ensure this exists or create it).
    - Description: `Rendimento Automático (CDI)`

### 2.3. User Interface
- **AccountModal**: Add field "Rende CDI?" (Toggle) -> If yes, input "% do CDI" (Default 100%).
- **Dashboard/Accounts**: A visual indicator that the account is "Active/Yielding".
- **Trigger**: Since we don't have a background worker, add a "Update Yields" button in the Accounts page header that processes all yielding accounts up to "Today".

## 3. Work Breakdown
- **TKT-002**: Update Prisma Schema & Migrate.
- **TKT-003**: Implement `YieldService` and API route `/api/accounts/yield`.
- **TKT-004**: Update `AccountModal` to capture yield settings.
- **TKT-005**: Add "Apply Yields" trigger in Accounts Page.
