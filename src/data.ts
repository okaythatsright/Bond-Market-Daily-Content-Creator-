import { BondMarketSection } from './types';

export const DEFAULT_BOND_SECTIONS: BondMarketSection[] = [
  {
    id: 'broad-aggregate',
    title: 'Broad Aggregate Bond Market',
    description: 'General fixed-income indexes capturing the overall bond universe performance and credit spreads.',
    data: [
      { label: 'Bloomberg US Aggregate Yield', value: '4.62%', change: '+0.04%', trend: 'up', details: 'Broad aggregate yield reflecting slightly tighter monetary sentiments.' },
      { label: 'Bloomberg US Agg Option-Adjusted Spread (OAS)', value: '74 bps', change: '-1 bp', trend: 'down', details: 'Spreads remained quiet as liquidity held strong.' },
      { label: 'Total Return Daily Index', value: '2,114.50', change: '-0.12%', trend: 'down', details: 'Reflected pressure from the uptick in Treasury yields.' }
    ]
  },
  {
    id: 'us-treasury',
    title: 'U.S. Treasury Bond Averages',
    description: 'Key sovereign benchmarks tracking safe-haven yields and federal interest rate expectations.',
    data: [
      { label: '2-Year Treasury Yield', value: '4.00%', change: '+0.06%', trend: 'up', details: 'Yield rose on stronger-than-expected retail growth estimates.' },
      { label: '5-Year Treasury Yield', value: '4.17%', change: '+0.05%', trend: 'up', details: 'Reflecting continued medium-term inflation concern.' },
      { label: '10-Year Treasury Yield', value: '4.48%', change: '+0.04%', trend: 'up', details: 'Benchmark note under selling pressure, sending yields climbing.' },
      { label: '30-Year Treasury Yield', value: '5.01%', change: '+0.03%', trend: 'up', details: 'Long bond supply pressure offsets moderate overnight buyers.' }
    ]
  },
  {
    id: 'corporate',
    title: 'Corporate Bond Averages',
    description: 'Corporate debt market yields and premium spreads over comparable government bonds.',
    data: [
      { label: 'ICE BofA Investment Grade Corporate Yield', value: '5.32%', change: '+0.03%', trend: 'up', details: 'Tracked Treasuries higher; new issues continued to attract strong bids.' },
      { label: 'ICE BofA High Yield Master II index', value: '7.45%', change: '-0.08%', trend: 'down', details: 'Spread narrowed down to 312 bps as credit risk appetite remains elevated.' },
      { label: 'BofA Corp BBB Spread', value: '118 bps', change: '-2 bps', trend: 'down', details: 'Risk appetite kept lower investment-grade credit spreads in check.' }
    ]
  },
  {
    id: 'municipal',
    title: 'Municipal Bond Market',
    description: 'Tax-exempt state and local government obligations and municipal-to-Treasury yield relationships.',
    data: [
      { label: '10-Year AAA Muni Yield', value: '2.84%', change: '+0.02%', trend: 'up', details: 'Muni yields stabilized ahead of the upcoming fresh state auction cycle.' },
      { label: '10-Year Muni/Treasury Ratio', value: '63.39%', change: '-0.15%', trend: 'down', details: 'Ratios hovering on the cheaper relative valuation side.' },
      { label: 'S&P National AMT-Free Muni Index', value: '648.20', change: '-0.05%', trend: 'down', details: 'Overall index minor drop on rising yields.' }
    ]
  },
  {
    id: 'real-yield',
    title: 'Inflation-Protected (Real Yield)',
    description: 'Real yield return rates on sovereign debt after netting out estimated inflation assumptions.',
    data: [
      { label: '5-Year Real Yield', value: '1.92%', change: '+0.04%', trend: 'up', details: 'Real rates remain restrictive on hawkish fed-speak expectations.' },
      { label: '10-Year Real Yield (Benchmark)', value: '1.85%', change: '+0.03%', trend: 'up', details: 'Steady rise in long-term safe real yields compresses equity valuations.' },
      { label: '30-Year Real Yield', value: '1.98%', change: '+0.02%', trend: 'up', details: 'Approaching the key 2.0% threshold level.' }
    ]
  },
  {
    id: 'tips',
    title: 'Inflation-Protected Securities (TIPS)',
    description: 'Inflation expectations and pricing derived from Treasury Inflation-Protected Securities.',
    data: [
      { label: '5-Year Breakeven Inflation Rate', value: '2.25%', change: '+0.02%', trend: 'up', details: 'Medium-term inflation expectations nudged up on persistent oil prices.' },
      { label: '10-Year Breakeven Inflation Rate', value: '2.63%', change: '+0.01%', trend: 'up', details: 'Stable near Fed target comfort zones.' },
      { label: 'Bloomberg US TIPS Index Total Return', value: '381.10', change: '+0.08%', trend: 'up', details: 'TIPS outperforming nominal bounds today on rising inflation hedges.' }
    ]
  },
  {
    id: 'international',
    title: 'International Bond Market',
    description: 'Global government benchmarks reflecting European and Asian interest rate environments.',
    data: [
      { label: 'German 10-Year Bund Yield', value: '2.48%', change: '+0.01%', trend: 'up', details: 'Modest selling following Eurozone hawkish employment updates.' },
      { label: 'UK 10-Year Gilt Yield', value: '4.15%', change: '+0.05%', trend: 'up', details: 'Gilts under pressure as political spending debates heat up.' },
      { label: 'Japan 10-Year JGB Yield', value: '0.98%', change: '+0.02%', trend: 'up', details: 'JGB yield nudges closer to 1.0% line on Bank of Japan normalization talks.' }
    ]
  },
  {
    id: 'duration-aggregates',
    title: 'Duration-Specific Aggregates',
    description: 'Maturity risk pools and yield curve slope performance characteristics.',
    data: [
      { label: 'Short Duration (1-3 Yr) Yield', value: '4.00%', change: '+0.05%', trend: 'up', details: 'Sensitive short duration indices pricing in fewer near-term rate cuts.' },
      { label: 'Intermediate Duration (5-10 Yr) Yield', value: '4.48%', change: '+0.04%', trend: 'up', details: 'Solid corporate hedging transactions balance primary sales.' },
      { label: 'Long Duration (15+ Yr) Yield', value: '5.01%', change: '+0.02%', trend: 'up', details: 'Slight steepening pressure under longer holding assumptions.' },
      { label: 'Yield Curve Slope (2s10s)', value: '+48 bps', change: '+2 bps', trend: 'up', details: 'The yield curve is positive sloping, steepening on intermediate growth expectations.' }
    ]
  }
];
