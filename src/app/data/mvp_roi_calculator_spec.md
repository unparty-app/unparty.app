# MVP FILM ROI CALCULATOR 

## DATA: data/mvp_roi_calculator_data.json
## COMPONENT: components/FilmCalculator.tsx
## ROUTE: /film-calculator

## STATUS: ✅ IMPLEMENTED

Implementation completed with the following features:
- Three distribution scenarios (Traditional, Self-Distribution, Streaming)
- Three revenue scenarios (Downside, Baseline, Upside)
- Four interactive sliders (Revenue Multiplier, P&A Spend, Distribution Fee, Contingency)
- Six KPI callouts (ROI, Producer Net, P&A vs Budget, Distribution Drag, Break-Even, Gross Receipts)
- Real-time recoupment waterfall calculation
- Dashboard-style UI matching Stats.tsx design patterns

## DESIGN: Incorporate exisiting app design principles

**Top-level structure.** Seven root keys: `film`, `production_budget`, `distribution_deal_scenarios`, `revenue_projections`, `recoupment_waterfall`, `comparable_films`, `release_windows`, and `roi_summary_baseline`. The `roi_summary_baseline` node has pre-calculated figures so you can validate your component's math against known outputs before wiring up dynamic calculations.

**Three distribution scenarios** (`traditional_distributor`, `self_distribution`, `straight_to_streaming`) are fully modeled with their own P&A costs, fee structures, and recoupment orders. The `active_scenario` flag tells your component which one to render by default. The key design insight here — and the whole point of the MVP — is that the `straight_to_streaming` scenario has **zero P&A drag**, while `traditional_distributor` has $400K in recoupment that essentially swallows all baseline revenue.

**Revenue channels** each carry an `applicable_scenarios` array, so you can filter which channels are relevant to the active scenario without hardcoding UI logic.

**The `recoupment_waterfall` arrays** are ordered and typed (`percentage`, `fixed`, `split`) so you can loop through them sequentially in your calculation engine to arrive at `producer_net_receipts` — the critical number before you compute ROI.

**The `ui_config` node** defines the four sliders, two toggles, and five callout KPIs you'd need for an MVP — specifically `pa_as_pct_of_budget` and `distribution_drag_total`, which are the two numbers that will most surprise first-time filmmakers using the tool.

## BUDGET 


```
Total cost:            $1.53                                                                        
Total duration (API):  7m 48s
Total duration (wall): 49m 41s                                                                      
Total code changes:    164 lines added, 84 lines removed                                            
Usage by model:                                                                                     
        claude-haiku:  16.1k input, 506 output, 0 cache read, 0 cache write ($0.0186)
       claude-sonnet:  488 input, 26.5k output, 1.9m cache read, 140.4k cache write ($1.51)
```

CLAUDE-CODE: $1.53 
CLAUDE-PLATFORM: cost per month 
GITHUB COPILOT: NUMBER OF PREMIUM REQUESTS 