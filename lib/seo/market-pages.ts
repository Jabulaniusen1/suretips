import type { MarketKey } from "@/lib/predictions/markets";
import { marketOf } from "@/lib/predictions/markets";
import type { FaqItem } from "@/types/database";

// Built-in market landing pages (/tips/[slug]).
//
// This file is also the keyword map: each page owns one primary keyword and
// a small group of supporting terms, and no two pages target the same
// intent. The homepage owns "free football predictions today", /predictions
// owns "football predictions tomorrow", competition pages own
// "<competition> predictions" and match pages own "<home> vs <away>
// prediction". Check this list before adding a new page or an admin SEO page.
//
// Copy rules: explain the market accurately, describe our selection rules
// exactly as implemented (lib/predictions/pick-selection.ts), never imply a
// guaranteed outcome, and never quote performance figures in static copy --
// live statistics are rendered from real results.

export type MarketSelection =
  | { kind: "markets"; markets: MarketKey[] }
  | { kind: "top-picks" }
  | { kind: "safe" }
  | { kind: "super-single" };

export interface MarketPage {
  slug: string;
  /** Short label for navigation tabs. */
  tabLabel: string;
  h1: string;
  /** Meta title without the brand suffix. */
  title: string;
  description: string;
  primaryKeyword: string;
  supportingKeywords: string[];
  selection: MarketSelection;
  intro: string;
  explainer: { heading: string; paragraphs: string[] };
  howSelected: string[];
  factors: string[];
  limitations: string;
  faqs: FaqItem[];
  related: string[];
  group: MarketGroup;
}

export type MarketGroup = "Daily selections" | "Match result" | "Goals" | "Both teams to score" | "Exact score";

export const MARKET_GROUP_ORDER: MarketGroup[] = [
  "Daily selections",
  "Match result",
  "Goals",
  "Both teams to score",
  // "Exact score", // DISABLED (correct score)
];

export const MARKET_PAGES: MarketPage[] = [
  {
    slug: "free",
    tabLabel: "Free Tips",
    group: "Daily selections",
    h1: "Free Football Tips Today",
    title: "Free Football Tips Today – Top Pick Per Match",
    description:
      "Today's free football tips: our highest-rated pick for each match across every market, with odds, confidence and a public record of every result.",
    primaryKeyword: "free football tips today",
    supportingKeywords: ["free soccer tips", "free betting tips today", "today's football tips"],
    selection: { kind: "top-picks" },
    intro:
      "This page shortlists one pick per match — the selection we rate highest for that fixture across every market we cover. Every tip is free to view, and every result is logged on our previous results page.",
    explainer: {
      heading: "How the free tips shortlist works",
      paragraphs: [
        "Most matches on Sure Match Tips carry several predictions — for example a goals pick, a both-teams-to-score pick and a double chance pick. This page keeps only the strongest of them for each fixture, so you get one scannable list instead of every market at once.",
        "Picks are ranked by confidence. For automatically selected tips, confidence is the bookmaker's implied probability (100 ÷ decimal odds); for editorial picks it is the editor's own rating. Very short-priced selections such as Over 0.5 Goals are only used when nothing else qualifies, because they say little about a match.",
      ],
    },
    howSelected: [
      "One pick per fixture: the highest-confidence selection with odds of at least 1.40, falling back to shorter prices only when nothing else qualifies.",
      "Sorted from highest to lowest confidence.",
      "Shows today's matches by default — use the date controls to view other days.",
    ],
    factors: [
      "Whether several markets agree on the same reading of a match (for example a home win and Under 3.5 Goals)",
      "Bookmaker prices across the match result, goals and BTTS markets",
      "Kickoff time — picks are published before kickoff and the published selection is frozen once the match starts",
    ],
    limitations:
      "A shortlist is not a guarantee. Higher confidence means the market rates an outcome as more likely, not that it will happen: even an 80% outcome fails one time in five.",
    faqs: [
      {
        question: "Are these football tips really free?",
        answer: "Yes. Every prediction on Sure Match Tips is free to view. There are no subscriptions, paid packages or locked tips.",
      },
      {
        question: "Why does each match only show one tip here?",
        answer:
          "This page is a shortlist. To see every market we cover for a match, open the match page, or browse a market page such as Over 2.5 Goals or BTTS.",
      },
      {
        question: "Where can I check past results?",
        answer:
          "Every published pick and its outcome is listed on the Previous Results page, including losses. Results count in our statistics only after they have been checked against the official score.",
      },
    ],
    related: ["safe-picks", "super-single", "over-2-5", "btts", "double-chance"],
  },
  {
    slug: "safe-picks",
    tabLabel: "Safe Picks",
    group: "Daily selections",
    h1: "Safe Football Predictions Today",
    title: "Safe Football Predictions Today – Low-Odds Picks",
    description:
      "Lower-risk football predictions for today: short-priced picks with a high implied probability, explained honestly — including why no bet is ever truly safe.",
    primaryKeyword: "safe football predictions",
    supportingKeywords: ["safe bets today", "sure football predictions", "low risk football tips"],
    selection: { kind: "safe" },
    intro:
      "Safe picks are our shortest-priced selections of the day — outcomes the betting market rates as likely, at odds of 1.50 or lower. They are lower risk, not risk-free.",
    explainer: {
      heading: "What makes a pick “safe”?",
      paragraphs: [
        "In betting, “safe” describes probability, not certainty. A selection at odds of 1.40 implies roughly a 71% chance of winning before the bookmaker's margin, which means it is still expected to lose around three times in every ten.",
        "Sites that advertise “sure” or “fixed” matches are claiming something nobody can deliver. We show short-priced picks with their odds and implied probability so you can judge the risk yourself, and we publish every result — including losses — on our previous results page.",
      ],
    },
    howSelected: [
      "Picks with decimal odds of 1.50 or lower — an implied probability of about 67% or more.",
      "Over 0.5 Goals picks are left out here because they have their own page.",
      "Ranked by confidence, highest first.",
    ],
    factors: [
      "Low odds mean low returns: a 1.30 winner returns 0.30 profit per unit staked, so one loss can wipe out several wins",
      "Combining short-priced picks in an accumulator multiplies the risk as well as the odds",
      "Team news and rotation can make a short price misleading, especially in cup competitions",
    ],
    limitations:
      "Short odds reduce variance but do not remove it. Over the long run, profit depends on whether prices are better than the true probability — something no tips page can promise.",
    faqs: [
      {
        question: "Are there sure football predictions?",
        answer:
          "No. Every football match carries uncertainty — red cards, injuries and late goals change outcomes. Treat any site promising guaranteed or “fixed” wins with suspicion.",
      },
      {
        question: "What odds count as a safe pick on this page?",
        answer:
          "Decimal odds of 1.50 or lower. That corresponds to an implied probability of roughly 67% or higher, before accounting for the bookmaker's margin.",
      },
      {
        question: "Should I combine safe picks into an accumulator?",
        answer:
          "Each extra selection multiplies the chance of the bet losing. Four picks that each win 75% of the time all win together only about 32% of the time.",
      },
    ],
    related: ["free", "double-chance", "over-1-5", "under-3-5", "super-single"],
  },
  {
    slug: "super-single",
    tabLabel: "Super Single",
    group: "Daily selections",
    h1: "Super Single: Today's Top Football Tip",
    title: "Super Single Tip Today – Best Single Bet Prediction",
    description:
      "One football prediction a day: our highest-confidence single at odds between 1.40 and 2.00, with the odds, the match data and a public results record.",
    primaryKeyword: "super single tip today",
    supportingKeywords: ["single bet tips today", "best football bet today", "banker of the day"],
    selection: { kind: "super-single" },
    intro:
      "The super single is one pick a day — the highest-confidence selection we have at odds between 1.40 and 2.00. It is meant as a single bet, not an accumulator leg.",
    explainer: {
      heading: "Why a single bet?",
      paragraphs: [
        "Accumulators look attractive because the odds multiply, but so does the chance of losing. A single bet on one well-chosen outcome keeps the risk easy to understand: one match, one result.",
        "We restrict the super single to odds of 1.40–2.00 because very short prices offer little return, while long prices are too unpredictable for a daily headline pick.",
      ],
    },
    howSelected: [
      "Every published pick for the day with odds from 1.40 to 2.00 is considered.",
      "The one with the highest confidence is shown; ties go to the earlier kickoff.",
      "If nothing qualifies, no super single is published for that day.",
    ],
    factors: [
      "Price: the pick must offer a meaningful return",
      "Confidence relative to the other picks that day",
      "Match context such as competition stage and fixture congestion",
    ],
    limitations:
      "A single pick is only one result. Judge any tipping record over a large number of picks, not a short run of wins or losses.",
    faqs: [
      {
        question: "What is a super single?",
        answer:
          "A single bet on one match outcome, as opposed to an accumulator that combines several matches. Ours is the day's highest-confidence pick at odds between 1.40 and 2.00.",
      },
      {
        question: "Is the super single always a match winner bet?",
        answer:
          "No. It can come from any market we cover — goals, both teams to score, double chance or the match result — whichever qualifies with the highest confidence.",
      },
      {
        question: "What happens when no pick qualifies?",
        answer: "We don't force one. If no prediction falls inside the odds range, the page says there is no super single for that date.",
      },
    ],
    related: ["free", "safe-picks", "home-win", "over-2-5", "btts"],
  },
  {
    slug: "home-win",
    tabLabel: "Home Win",
    group: "Match result",
    h1: "Home Win Predictions Today",
    title: "Home Win Predictions Today – Free 1X2 Home Tips",
    description:
      "Free home win predictions for today's football matches, with odds, implied probability, team form and head-to-head context for every pick.",
    primaryKeyword: "home win predictions today",
    supportingKeywords: ["home win tips", "1x2 home predictions", "football match winner predictions"],
    selection: { kind: "markets", markets: ["home_win"] },
    intro:
      "Home win predictions back the home team to win the match in normal time — 90 minutes plus stoppage time. A draw or an away win means the bet loses.",
    explainer: {
      heading: "What a home win bet means",
      paragraphs: [
        "The home win is the “1” in the 1X2 market. It is settled on the result after regular time, so goals in extra time and penalty shoot-outs do not count.",
        "Home advantage is real but smaller than many bettors assume, and it varies by league and by team. The strongest home win selections usually combine a clear gap in quality with good recent home form.",
      ],
    },
    howSelected: [
      "Automatically selected home wins require the home team to be the bookmakers' favourite, at odds between 1.30 and 2.60.",
      "We never publish a home win and an away win for the same match.",
      "Editorial picks may also appear, with the editor's own confidence rating.",
    ],
    factors: [
      "Home and away form over the last five to ten matches",
      "League position and goal difference",
      "Injuries, suspensions and squad rotation",
      "Head-to-head record, used cautiously because squads change",
      "Fixture congestion, such as a European match in midweek",
    ],
    limitations:
      "A home favourite at 1.50 is expected to fail to win roughly a third of the time. Draws are the most common way home win bets lose.",
    faqs: [
      {
        question: "Does extra time count for a home win bet?",
        answer: "No. Home win predictions are settled on the result after 90 minutes plus stoppage time.",
      },
      {
        question: "What is the difference between Home Win and Double Chance 1X?",
        answer:
          "Home Win needs the home team to win. Double Chance 1X also wins if the match is drawn, so it is lower risk but pays lower odds.",
      },
      {
        question: "How is home advantage taken into account?",
        answer:
          "Through each team's own home and away records rather than a fixed league-wide figure, because home advantage varies a lot between teams and competitions.",
      },
    ],
    related: ["double-chance", "away-win", "draw", "over-1-5", "free"],
  },
  {
    slug: "away-win",
    tabLabel: "Away Win",
    group: "Match result",
    h1: "Away Win Predictions Today",
    title: "Away Win Predictions Today – Free Away Tips",
    description:
      "Free away win predictions for today: matches where the visiting team is favoured, with odds, confidence, recent form and head-to-head data.",
    primaryKeyword: "away win predictions today",
    supportingKeywords: ["away win tips", "away team to win predictions", "1x2 away predictions"],
    selection: { kind: "markets", markets: ["away_win"] },
    intro:
      "Away win predictions back the visiting team to win in normal time. They usually come at higher odds than comparable home picks because travelling teams win less often.",
    explainer: {
      heading: "When away teams are worth backing",
      paragraphs: [
        "The away win is the “2” in the 1X2 market. Away sides win fewer matches than home sides in almost every league, so an away team is only the favourite when the gap in quality is clear.",
        "Away win selections are most reliable when a strong side visits a team struggling at home or weakened by injuries. They are less reliable in derbies and in leagues with long travel distances.",
      ],
    },
    howSelected: [
      "Automatic away wins require the visiting team to be the outright favourite, at odds between 1.30 and 3.20.",
      "Only one match-result pick is published per fixture.",
      "Settled after 90 minutes plus stoppage time.",
    ],
    factors: [
      "The home team's home record against the visitors' away record",
      "Travel distance and kickoff time",
      "Motivation: league position, cup progress and fixture congestion",
      "Team news, especially goalkeepers and central defenders",
    ],
    limitations:
      "Away favourites are priced higher than home favourites of similar quality, which reflects a genuinely lower win rate. Expect more variance on this page than on double chance or goals markets.",
    faqs: [
      {
        question: "Why are away win odds usually higher?",
        answer: "Teams win less often away from home, so bookmakers price away wins higher than home wins between similarly matched teams.",
      },
      {
        question: "Is there a lower-risk alternative to an away win?",
        answer: "Double Chance X2 also pays out if the match is drawn. It is lower risk, at lower odds.",
      },
      {
        question: "Does an away win include extra time?",
        answer: "No. Like all our match-result picks it is settled on the 90-minute result.",
      },
    ],
    related: ["home-win", "double-chance", "draw", "btts", "over-2-5"],
  },
  {
    slug: "draw",
    tabLabel: "Draw",
    group: "Match result",
    h1: "Draw Predictions Today",
    title: "Draw Predictions Today – Free Football Draw Tips",
    description:
      "Free draw predictions for today's football matches: evenly matched fixtures where a draw is priced competitively, with odds, form and head-to-head data.",
    primaryKeyword: "draw predictions today",
    supportingKeywords: ["football draw tips", "draw bets today", "1x2 draw predictions"],
    selection: { kind: "markets", markets: ["draw"] },
    intro:
      "Draw predictions back a match to finish level after 90 minutes. Draws are the hardest 1X2 outcome to call, so we only publish them for genuinely balanced fixtures.",
    explainer: {
      heading: "Why draws are difficult to predict",
      paragraphs: [
        "Draws account for roughly a quarter of results in most top leagues, yet they are rarely the single most likely outcome of a match. That is why draw odds usually sit around 3.00 or higher.",
        "The best draw candidates are matches between closely matched sides, games where a point suits both teams, and fixtures between defensively solid teams.",
      ],
    },
    howSelected: [
      "Both teams must be priced at 2.40 or higher to win, a sign of a balanced match.",
      "The draw itself must be priced between 2.60 and 3.40.",
      "We do not publish a Draw and a Double Chance 12 pick for the same fixture.",
    ],
    factors: [
      "How evenly matched the teams are on form and league position",
      "Each team's draw rate this season",
      "Expected goals: low-scoring matches end level more often",
      "The match situation, such as a point being enough for both teams",
    ],
    limitations:
      "Even well-chosen draw picks lose more often than they win — a price of 3.20 implies roughly a 31% chance. Results on this page will be streaky.",
    faqs: [
      {
        question: "How often do football matches end in a draw?",
        answer: "In most major European leagues roughly one match in four finishes level, although the rate varies by league and season.",
      },
      {
        question: "Does a 0-0 count as a draw?",
        answer: "Yes. Any level score after 90 minutes plus stoppage time — 0-0, 1-1, 2-2 and so on — wins a draw bet.",
      },
      {
        question: "Do extra time and penalties count?",
        answer: "No. A cup tie that is level after 90 minutes is settled as a draw, whatever happens in extra time or a shoot-out.",
      },
    ],
    related: ["double-chance-12", "under-2-5", "btts-no", "home-win", "away-win"],
  },
  {
    slug: "double-chance",
    tabLabel: "Double Chance",
    group: "Match result",
    h1: "Double Chance Predictions Today",
    title: "Double Chance Predictions Today – 1X & X2 Tips",
    description:
      "Free double chance predictions for today: 1X, X2 and 12 picks that cover two of the three match outcomes, with odds, confidence and full results history.",
    primaryKeyword: "double chance predictions",
    supportingKeywords: ["double chance tips today", "1X predictions", "X2 predictions"],
    selection: { kind: "markets", markets: ["double_chance", "double_chance_12"] },
    intro:
      "Double chance bets cover two of the three possible match results: 1X wins on a home win or a draw, X2 on an away win or a draw, and 12 on either team winning.",
    explainer: {
      heading: "How double chance works",
      paragraphs: [
        "Because a double chance bet covers two outcomes, it wins more often than a straight match-result bet and pays lower odds in return. It is a common choice when one team is clearly stronger but not reliable enough to back outright.",
        "1X suits favoured home sides, X2 suits strong visiting teams, and 12 suits matches where a draw looks unlikely. The Double Chance 12 page lists only 12 picks.",
      ],
    },
    howSelected: [
      "Automatic picks choose whichever of 1X or X2 is shorter-priced, at odds between 1.10 and 1.70.",
      "Double Chance 12 picks are added separately when the 12 price is between 1.15 and 1.50.",
      "Settled on the 90-minute result.",
    ],
    factors: [
      "Which team is stronger, and by how much",
      "How often each team draws",
      "Home and away splits",
      "Competition context — first legs of knockout ties are often cautious",
    ],
    limitations:
      "Double chance cuts the losing outcomes from two to one, but that one outcome still happens. At odds of 1.25 a pick is expected to lose about one time in five.",
    faqs: [
      {
        question: "What does 1X mean in betting?",
        answer: "1X is a double chance bet on the home team to win or draw. It loses only if the away team wins.",
      },
      {
        question: "What does X2 mean?",
        answer: "X2 covers a draw or an away win. It loses only if the home team wins.",
      },
      {
        question: "Is double chance the same as draw no bet?",
        answer: "No. Draw no bet refunds your stake if the match is drawn, while double chance counts a draw as a win, at lower odds.",
      },
    ],
    related: ["double-chance-12", "home-win", "away-win", "safe-picks", "draw"],
  },
  {
    slug: "double-chance-12",
    tabLabel: "Double Chance 12",
    group: "Match result",
    h1: "Double Chance 12 Predictions Today",
    title: "Double Chance 12 Predictions – No Draw Tips Today",
    description:
      "Free Double Chance 12 predictions for today: matches where either team is expected to win and a draw looks unlikely, with odds and full results history.",
    primaryKeyword: "double chance 12 predictions",
    supportingKeywords: ["12 predictions today", "no draw tips", "home or away win predictions"],
    selection: { kind: "markets", markets: ["double_chance_12"] },
    intro:
      "A Double Chance 12 bet wins if either team wins the match and loses only if it ends in a draw. It suits open, attacking fixtures.",
    explainer: {
      heading: "When the 12 market makes sense",
      paragraphs: [
        "The 12 option is effectively a bet against the draw. It works best when both teams play attacking football, when one side is clearly stronger, or when both teams need a win.",
        "Prices for 12 are usually short because two of the three outcomes win, so the market is best used as a lower-risk way to back an open game rather than as a high-return bet.",
      ],
    },
    howSelected: [
      "Automatic 12 picks require a price between 1.15 and 1.50.",
      "No 12 pick is published for a match where we have published a Draw.",
      "Settled after 90 minutes plus stoppage time.",
    ],
    factors: [
      "Each team's draw rate",
      "Goal expectancy — higher-scoring matches end level less often",
      "Whether both teams need the win",
      "Defensive weaknesses on either side",
    ],
    limitations:
      "Draws are common in tight, low-scoring matches, and late equalisers are frequent. A 12 pick at 1.30 implies roughly a 77% chance, so about one in four is still expected to lose.",
    faqs: [
      {
        question: "What does 12 mean in football betting?",
        answer: "12 is a double chance bet on either the home team (1) or the away team (2) winning. Only a draw makes it lose.",
      },
      {
        question: "Is 12 the same as “no draw”?",
        answer: "Yes, it is often described that way. Don't confuse it with draw no bet, which refunds stakes when a match is drawn.",
      },
      {
        question: "Does extra time count for a 12 bet?",
        answer:
          "No. A cup match that is level after 90 minutes is settled as a draw, so a 12 bet loses even if a team goes on to win in extra time or on penalties.",
      },
    ],
    related: ["double-chance", "draw", "over-2-5", "btts", "home-win"],
  },
  {
    slug: "btts",
    tabLabel: "BTTS / GG",
    group: "Both teams to score",
    h1: "BTTS Predictions Today – Both Teams to Score",
    title: "BTTS Predictions Today – Both Teams to Score (GG) Tips",
    description:
      "Free both teams to score predictions for today (BTTS/GG): matches where both sides are expected to score, with odds, scoring form and results history.",
    primaryKeyword: "btts predictions today",
    supportingKeywords: ["both teams to score predictions", "GG predictions", "both teams to score tips today"],
    selection: { kind: "markets", markets: ["btts"] },
    intro:
      "A both teams to score bet (BTTS, also called GG) wins if each team scores at least one goal. The final result doesn't matter — 1-1, 2-1 and 3-3 all win.",
    explainer: {
      heading: "What BTTS depends on",
      paragraphs: [
        "BTTS rewards matches where both attacks are reliable and both defences are vulnerable. A team that scores in most matches but also concedes regularly is the ideal profile.",
        "The market is less about who wins than about game state: a team that falls behind usually has to attack, which helps BTTS, while a side that takes an early two-goal lead may slow the game down.",
      ],
    },
    howSelected: [
      "Automatic BTTS picks are published when “Yes” is priced shorter than “No” and sits between 1.40 and 2.30.",
      "We never publish BTTS Yes and BTTS No for the same match.",
      "Goals in extra time do not count.",
    ],
    factors: [
      "How often each team has scored and conceded in recent matches",
      "Clean-sheet frequency for both goalkeepers",
      "Injuries to key forwards or defenders",
      "Playing style — counter-attacking sides can make BTTS less likely",
    ],
    limitations:
      "One team failing to score is enough to lose, and a goalless first half often changes how teams approach the second. BTTS results tend to come in streaks.",
    faqs: [
      {
        question: "What does GG mean in betting?",
        answer: "GG (“goal-goal”) is another name for both teams to score. It wins if each team scores at least once.",
      },
      {
        question: "Do own goals count for BTTS?",
        answer:
          "Yes. An own goal counts for the team credited with it — if a home defender scores an own goal, it counts as an away goal for BTTS.",
      },
      {
        question: "Can BTTS win if the match ends 1-0?",
        answer: "No. In a 1-0 only one team scored, so BTTS Yes loses and BTTS No wins.",
      },
    ],
    related: ["btts-no", "over-2-5", "over-1-5", "free", "draw"],
  },
  {
    slug: "btts-no",
    tabLabel: "BTTS No / NG",
    group: "Both teams to score",
    h1: "BTTS No Predictions Today – Both Teams Not to Score",
    title: "BTTS No Predictions Today – NG / No Goal Tips",
    description:
      "Free BTTS No (NG) predictions for today: matches where at least one team is expected to fail to score, with odds, clean-sheet form and results.",
    primaryKeyword: "both teams not to score predictions",
    supportingKeywords: ["btts no predictions", "NG predictions", "no goal goal tips"],
    selection: { kind: "markets", markets: ["btts_no"] },
    intro:
      "A BTTS No bet (also called NG, or “no goal”) wins if at least one team fails to score. A 0-0, a 1-0 and a 3-0 all win it.",
    explainer: {
      heading: "When one team is likely to draw a blank",
      paragraphs: [
        "BTTS No suits matches with a big gap in attacking quality, strong defensive teams and low-tempo fixtures. It is also worth considering when a team has struggled to score away from home.",
        "Because one goal for each side loses the bet, BTTS No is vulnerable to late consolation goals — worth remembering when a strong favourite is expected to win comfortably.",
      ],
    },
    howSelected: [
      "Automatic BTTS No picks are published when “No” is priced shorter than “Yes” and sits between 1.40 and 2.30.",
      "Never combined with a BTTS Yes pick on the same match.",
      "Settled on regular time only.",
    ],
    factors: [
      "Clean-sheet rate of the stronger defence",
      "Failed-to-score rate of the weaker attack",
      "Whether the favourite tends to ease off once ahead",
      "Weather and pitch conditions",
    ],
    limitations:
      "A single late goal from the team that hasn't scored turns a winning BTTS No bet into a losing one, so results can feel unlucky even when the reading of the match was right.",
    faqs: [
      {
        question: "What does NG mean in football betting?",
        answer: "NG means “no goal” — another name for BTTS No. It wins if at least one team does not score.",
      },
      {
        question: "Does a 0-0 draw win a BTTS No bet?",
        answer: "Yes. If neither team scores, both teams have failed to score, so BTTS No wins.",
      },
      {
        question: "Is BTTS No the same as Under 2.5 Goals?",
        answer:
          "No. A 3-0 win is BTTS No but Over 2.5, and a 1-1 draw is Under 2.5 but BTTS Yes. The markets often overlap, but they settle differently.",
      },
    ],
    related: ["btts", "under-2-5", "under-3-5", "home-win", "safe-picks"],
  },
  {
    slug: "over-0-5",
    tabLabel: "Over 0.5",
    group: "Goals",
    h1: "Over 0.5 Goals Predictions Today",
    title: "Over 0.5 Goals Predictions Today – At Least One Goal",
    description:
      "Free over 0.5 goals predictions for today: matches expected to produce at least one goal, with odds, scoring records and a full public results history.",
    primaryKeyword: "over 0.5 goals predictions",
    supportingKeywords: ["over 0.5 tips today", "at least one goal predictions", "1+ goals tips"],
    selection: { kind: "markets", markets: ["over_0_5"] },
    intro: "An Over 0.5 Goals bet wins if the match has at least one goal. It loses only on a 0-0.",
    explainer: {
      heading: "Why over 0.5 is priced so short",
      paragraphs: [
        "Most professional matches produce at least one goal, so bookmakers price Over 0.5 at very short odds — often between 1.03 and 1.15. The return on each winning bet is small.",
        "All the risk sits in one outcome: the goalless draw. Over 0.5 picks are most useful between two attacking sides, and least useful in cagey derbies, finals and matches between defensive teams.",
      ],
    },
    howSelected: [
      "Automatic Over 0.5 picks are published when the price is between 1.03 and 1.15.",
      "Settled on goals in regular time; extra-time goals do not count.",
      "Always listed with their odds, so the small return is visible.",
    ],
    factors: [
      "How rarely each team is involved in 0-0 draws",
      "Combined scoring and conceding rates",
      "The importance of the match — high-stakes games are often tighter",
      "Weather and pitch conditions",
    ],
    limitations:
      "At odds of 1.07, one 0-0 cancels out the profit of roughly fourteen winning bets. Over 0.5 is low-risk per bet, but each loss is costly relative to the return.",
    faqs: [
      {
        question: "What does over 0.5 goals mean?",
        answer: "At least one goal is scored in the match, by either team. Only a 0-0 result loses.",
      },
      {
        question: "Does over 0.5 include extra time?",
        answer: "No. Like our other goals markets, it is settled after 90 minutes plus stoppage time.",
      },
      {
        question: "Is first-half over 0.5 the same bet?",
        answer: "No. First-half over 0.5 only counts goals scored before half-time. This page covers the full match only.",
      },
    ],
    related: ["over-1-5", "over-2-5", "btts", "safe-picks", "under-3-5"],
  },
  {
    slug: "over-1-5",
    tabLabel: "Over 1.5",
    group: "Goals",
    h1: "Over 1.5 Goals Predictions Today",
    title: "Over 1.5 Goals Predictions Today – Free 2+ Goals Tips",
    description:
      "Free over 1.5 goals predictions for today's matches: fixtures expected to produce two or more goals, with odds, scoring form and results history.",
    primaryKeyword: "over 1.5 predictions today",
    supportingKeywords: ["over 1.5 goals tips", "2+ goals predictions", "over 1.5 betting tips"],
    selection: { kind: "markets", markets: ["over_1_5"] },
    intro: "An Over 1.5 Goals bet wins when the match has two or more goals in total. It loses on 0-0, 1-0 or 0-1.",
    explainer: {
      heading: "What over 1.5 goals means",
      paragraphs: [
        "The 1.5 line means the bet needs at least two goals, scored by either team. A 2-0 win, a 1-1 draw and a 4-3 thriller all win; any result with fewer than two goals loses.",
        "Over 1.5 is one of the most popular goals markets because two goals is a modest requirement in most leagues. The catch is that single-goal matches are still common, especially between defensive teams.",
      ],
    },
    howSelected: [
      "Automatic Over 1.5 picks are published at odds between 1.10 and 1.70.",
      "Settled after 90 minutes plus stoppage time.",
      "Each match page shows the scoring form and head-to-head data behind the fixture.",
    ],
    factors: [
      "Average goals in each team's recent matches",
      "How often each team keeps a clean sheet",
      "Attacking injuries or suspensions",
      "Head-to-head scoring history",
    ],
    limitations:
      "Matches between evenly matched, cautious teams often finish 1-0 or 0-0. Because prices on this market are short, one loss costs several wins.",
    faqs: [
      {
        question: "How many goals do I need for over 1.5?",
        answer: "Two or more goals in total. The goals can come from either team.",
      },
      {
        question: "Does a 1-1 draw win over 1.5 goals?",
        answer: "Yes. A 1-1 draw has two goals, which is more than 1.5.",
      },
      {
        question: "What is the difference between over 1.5 and over 2.5?",
        answer: "Over 1.5 needs two goals; over 2.5 needs three. Over 2.5 pays higher odds because it wins less often.",
      },
    ],
    related: ["over-2-5", "over-0-5", "btts", "under-3-5", "free"],
  },
  {
    slug: "over-2-5",
    tabLabel: "Over 2.5",
    group: "Goals",
    h1: "Over 2.5 Goals Predictions Today",
    title: "Over 2.5 Goals Predictions Today – Free 3+ Goals Tips",
    description:
      "Free over 2.5 goals predictions for today: matches expected to produce three or more goals, selected from odds and scoring data, with full results history.",
    primaryKeyword: "over 2.5 predictions today",
    supportingKeywords: ["over 2.5 goals tips", "3+ goals predictions", "high scoring matches today"],
    selection: { kind: "markets", markets: ["over_2_5"] },
    intro:
      "An Over 2.5 Goals bet wins if the match produces three or more goals in total. Results such as 2-1, 3-0 and 2-2 win; anything with two goals or fewer loses.",
    explainer: {
      heading: "What over 2.5 goals means",
      paragraphs: [
        "Goals markets use half-goal lines so a bet can never tie: 2.5 means “more than two”. The goals can come from either team in any combination.",
        "Over 2.5 is the most widely used goals line. In many top leagues roughly half of all matches produce three or more goals, which is why prices usually sit close to evens — and why careful selection matters.",
      ],
    },
    howSelected: [
      "Automatic Over 2.5 picks are published only when “Over” is priced shorter than “Under”, at odds between 1.40 and 2.30.",
      "We never publish Over 2.5 and Under 2.5 for the same match.",
      "Extra-time goals do not count.",
    ],
    factors: [
      "Recent scoring patterns: average goals scored and conceded by both teams",
      "Defensive performance, including clean sheets and goals conceded away from home",
      "Tactical style — high-pressing, attacking teams create more chances",
      "Missing strikers or defenders",
      "Match importance — must-win games can be very open or very cautious",
    ],
    limitations:
      "An Over 2.5 pick at 1.80 implies about a 56% chance, so nearly half are expected to lose. Goals arrive unpredictably: an early red card, or a 1-0 that stays tight, can decide the bet.",
    faqs: [
      {
        question: "What does over 2.5 goals mean?",
        answer: "Three or more goals in the match in total, from either team. A 2-1 or 3-0 result wins; 1-1 or 2-0 loses.",
      },
      {
        question: "How are your over 2.5 predictions selected?",
        answer:
          "Automatic picks are chosen when bookmakers price “Over 2.5” as more likely than “Under 2.5” and the odds are between 1.40 and 2.30. Each match page shows the form and head-to-head data for the fixture.",
      },
      {
        question: "Which leagues produce the most over 2.5 results?",
        answer:
          "It changes from season to season. The Bundesliga has historically been one of the higher-scoring major leagues, while Serie A and La Liga have often been lower-scoring. Each competition page shows current form.",
      },
    ],
    related: ["over-1-5", "over-3-5", "btts", "under-2-5", "free"],
  },
  {
    slug: "over-3-5",
    tabLabel: "Over 3.5",
    group: "Goals",
    h1: "Over 3.5 Goals Predictions Today",
    title: "Over 3.5 Goals Predictions Today – 4+ Goals Tips",
    description:
      "Free over 3.5 goals predictions for today: high-scoring fixtures expected to produce four or more goals, with odds, attacking form and results history.",
    primaryKeyword: "over 3.5 goals predictions",
    supportingKeywords: ["over 3.5 tips today", "4+ goals predictions", "high scoring football tips"],
    selection: { kind: "markets", markets: ["over_3_5"] },
    intro: "An Over 3.5 Goals bet needs four or more goals in the match. It pays higher odds than Over 2.5 because it wins much less often.",
    explainer: {
      heading: "A higher-risk goals line",
      paragraphs: [
        "Four-goal matches are a minority in most leagues, so Over 3.5 is a speculative market. It suits fixtures between two attacking teams with weak defences, or a very strong side facing a team that concedes heavily.",
        "Because the odds are longer, results on this page vary more from week to week than on lower goal lines. Treat it as a value market, not a safe one.",
      ],
    },
    howSelected: [
      "Only considered when Over 2.5 is already favoured for the match.",
      "Automatic picks require Over 3.5 odds between 1.80 and 3.00.",
      "Never combined with an Under 3.5 pick on the same fixture.",
    ],
    factors: [
      "Goals conceded per match by both defences",
      "Attacking strength and chances created",
      "Matches where both teams need to win",
      "Defensive absences",
    ],
    limitations:
      "A price of 2.50 implies roughly a 40% chance, so most Over 3.5 picks are expected to lose. Small samples can make this market look much better or worse than it really is.",
    faqs: [
      {
        question: "How many goals are needed for over 3.5?",
        answer: "Four or more goals in total, from either team, after 90 minutes plus stoppage time.",
      },
      {
        question: "Why are over 3.5 odds so high?",
        answer: "Four or more goals happens in a minority of matches, so bookmakers price it as less likely than the lower goal lines.",
      },
      {
        question: "Is over 3.5 a good accumulator bet?",
        answer: "Combining several speculative picks makes winning much less likely. Over 3.5 is generally better treated as a single bet.",
      },
    ],
    related: ["over-2-5", "btts", "under-3-5", "over-1-5", "free"],
  },
  {
    slug: "under-2-5",
    tabLabel: "Under 2.5",
    group: "Goals",
    h1: "Under 2.5 Goals Predictions Today",
    title: "Under 2.5 Goals Predictions Today – Low-Scoring Tips",
    description:
      "Free under 2.5 goals predictions for today: matches expected to have two goals or fewer, with odds, defensive form and a complete results history.",
    primaryKeyword: "under 2.5 predictions",
    supportingKeywords: ["under 2.5 goals tips today", "low scoring matches", "under goals predictions"],
    selection: { kind: "markets", markets: ["under_2_5"] },
    intro:
      "An Under 2.5 Goals bet wins if the match has two goals or fewer. Results like 0-0, 1-0, 1-1 and 2-0 win; three or more goals loses.",
    explainer: {
      heading: "Backing a low-scoring match",
      paragraphs: [
        "Under 2.5 is the opposite of Over 2.5. It suits well-organised defensive teams, matches between sides with poor attacks, and fixtures where a draw or a narrow win suits both teams.",
        "Under picks can be undone by a single moment — an early goal forces one side to attack and can open the game up — so match context matters as much as season averages.",
      ],
    },
    howSelected: [
      "Automatic Under 2.5 picks are published only when “Under” is priced shorter than “Over”, at odds between 1.40 and 2.30.",
      "Never combined with an Over 2.5 or Over 3.5 pick for the same match.",
      "Settled on regular time.",
    ],
    factors: [
      "Clean-sheet records and goals conceded",
      "Low average goals in both teams' recent matches",
      "Cautious tactical set-ups",
      "Missing attacking players",
      "Weather and pitch conditions",
    ],
    limitations:
      "Late goals are common, and a 2-0 can become 2-1 in stoppage time. Under picks priced near evens are close to a coin flip once the bookmaker's margin is considered.",
    faqs: [
      {
        question: "What does under 2.5 goals mean?",
        answer: "The match must finish with two goals or fewer in total. A 1-1 draw wins; a 2-1 result loses.",
      },
      {
        question: "Is under 2.5 the same as BTTS No?",
        answer: "No. A 1-1 draw wins Under 2.5 but loses BTTS No, while a 3-0 loses Under 2.5 but wins BTTS No.",
      },
      {
        question: "Do extra-time goals count?",
        answer: "No. Only goals in regular time, including stoppage time, count.",
      },
    ],
    related: ["under-3-5", "btts-no", "draw", "over-2-5", "double-chance"],
  },
  {
    slug: "under-3-5",
    tabLabel: "Under 3.5",
    group: "Goals",
    h1: "Under 3.5 Goals Predictions Today",
    title: "Under 3.5 Goals Predictions Today – Free Under Tips",
    description:
      "Free under 3.5 goals predictions for today: matches expected to finish with three goals or fewer, with odds, form and full results history.",
    primaryKeyword: "under 3.5 goals predictions",
    supportingKeywords: ["under 3.5 tips today", "under 3.5 betting tips", "low goals predictions"],
    selection: { kind: "markets", markets: ["under_3_5"] },
    intro: "An Under 3.5 Goals bet wins if the match has three goals or fewer. It only loses when four or more goals are scored.",
    explainer: {
      heading: "An under bet with a cushion",
      paragraphs: [
        "Under 3.5 gives more room than Under 2.5: a 2-1 or a 3-0 still wins. That extra goal of cushion makes it a shorter-priced, lower-risk way to back a match that isn't expected to be a goal-fest.",
        "It works best when at least one team defends well or struggles to create chances, and worst when two attacking sides with poor defences meet.",
      ],
    },
    howSelected: [
      "Automatic Under 3.5 picks require odds between 1.15 and 1.60.",
      "Not published for a match where we have published Over 3.5.",
      "Settled after 90 minutes plus stoppage time.",
    ],
    factors: [
      "How often each team is involved in four-goal matches",
      "Defensive solidity of the stronger side",
      "Mismatches — heavy favourites can run up big scores",
      "Red cards and penalties, which raise scoring",
    ],
    limitations:
      "A mismatch can become a heavy win, and a chaotic second half can produce several goals quickly. At 1.35, roughly one pick in four is expected to lose.",
    faqs: [
      {
        question: "What does under 3.5 goals mean?",
        answer: "Three goals or fewer in the match. A 2-1 or 3-0 result wins; 2-2 or 3-1 loses.",
      },
      {
        question: "Is under 3.5 safer than under 2.5?",
        answer: "It wins more often because it allows one extra goal, but it pays lower odds in return.",
      },
      {
        question: "Can under 3.5 and over 2.5 both win?",
        answer: "Yes — when the match ends with exactly three goals, such as 2-1 or 3-0.",
      },
    ],
    related: ["under-2-5", "over-2-5", "btts-no", "safe-picks", "double-chance"],
  },
  // DISABLED (correct score): page switched off for now. Uncomment to restore
  // /tips/correct-score (and remove correct_score from DISABLED_MARKETS).
  /*
  {
    slug: "correct-score",
    tabLabel: "Correct Score",
    group: "Exact score",
    h1: "Correct Score Predictions Today",
    title: "Correct Score Predictions Today – Free Exact Score Tips",
    description:
      "Free correct score predictions for today: exact scoreline picks from our editors, with odds and a complete record of every published result.",
    primaryKeyword: "correct score predictions",
    supportingKeywords: ["correct score tips today", "exact score predictions", "scoreline predictions"],
    selection: { kind: "markets", markets: ["correct_score"] },
    intro:
      "Correct score predictions name the exact final score of a match, such as 2-1 or 1-1. They pay high odds because even a likely scoreline happens in only a small share of matches.",
    explainer: {
      heading: "Why correct scores are so hard",
      paragraphs: [
        "Even the most common scorelines, such as 1-1 and 1-0, each occur in only around one match in ten in typical leagues, so correct score bets lose most of the time. Odds of 6.00 to 10.00 for a likely scoreline reflect that.",
        "Our correct score picks are chosen by editors rather than generated automatically. Each one appears on its match page alongside the form and head-to-head data that informed it.",
      ],
    },
    howSelected: [
      "Correct score picks are published manually by our editors, not by the automatic odds-based selection.",
      "Settled on the score after 90 minutes plus stoppage time.",
      "Listed with the odds available when the pick was published, where recorded.",
    ],
    factors: [
      "Expected goals for each team",
      "The most common scorelines in each team's recent matches",
      "Head-to-head scorelines between the teams",
      "Team news affecting attack or defence",
    ],
    limitations:
      "A correct score pick is expected to lose far more often than it wins. Judge this market only over a large number of picks, and stake accordingly — or not at all.",
    faqs: [
      {
        question: "Does a correct score bet include extra time?",
        answer: "No. Correct score is settled on the result after 90 minutes plus stoppage time.",
      },
      {
        question: "What is the most common correct score in football?",
        answer: "In most major leagues 1-1 and 1-0 are among the most frequent scorelines, but each still occurs in only about one match in ten.",
      },
      {
        question: "Are correct score predictions free?",
        answer: "Yes. All correct score predictions on Sure Match Tips are free to view, like every other tip on the site.",
      },
    ],
    related: ["draw", "under-2-5", "btts", "home-win", "free"],
  },
  */
];

const PAGES_BY_SLUG = new Map(MARKET_PAGES.map((p) => [p.slug, p]));

export function getMarketPage(slug: string): MarketPage | undefined {
  return PAGES_BY_SLUG.get(slug);
}

export const MARKET_PAGE_SLUGS = MARKET_PAGES.map((p) => p.slug);

/** Slugs that are never standalone admin pages (built-in market pages + routes). */
export const RESERVED_TIPS_SLUGS = new Set([...MARKET_PAGE_SLUGS, "all", "today", "tomorrow"]);

/** Slugs admins can't use at all. Built-in market slugs can be used as overrides. */
export const HARD_RESERVED_TIPS_SLUGS = new Set(["all", "today", "tomorrow"]);

export function isMarketPageSlug(slug: string): boolean {
  return PAGES_BY_SLUG.has(slug);
}

/** Titles get the brand from the layout template; drop a hand-typed suffix. */
export function stripBrandSuffix(title: string): string {
  return title.replace(/\s*[|–—-]\s*Sure Match Tips\s*$/i, "").trim();
}

/** Admin-editable fields of a built-in page (a published custom_pages row with the same slug). */
export interface MarketPageOverride {
  meta_title: string | null;
  meta_description: string | null;
  meta_keywords: string | null;
  heading: string | null;
  introduction: string | null;
  main_content: string | null;
  faq: FaqItem[] | null;
  og_image: string | null;
  noindex: boolean;
  updated_at: string;
}

export interface ResolvedMarketPage extends MarketPage {
  /** Raw comma-separated meta keywords from the admin override (parsed by the page). */
  metaKeywords: string | null;
  mainContent: string | null;
  ogImage: string | null;
  noIndex: boolean;
  overriddenAt: string | null;
}

/** Built-in copy, with any non-empty admin override fields taking precedence. */
export function applyMarketPageOverride(page: MarketPage, override: MarketPageOverride | null): ResolvedMarketPage {
  const text = (value: string | null | undefined) => (value && value.trim() ? value.trim() : null);
  const faqs = (override?.faq ?? []).filter((f) => f.question?.trim() && f.answer?.trim());
  return {
    ...page,
    title: text(override?.meta_title) ? stripBrandSuffix(override!.meta_title!) : page.title,
    description: text(override?.meta_description) ?? page.description,
    h1: text(override?.heading) ?? page.h1,
    intro: text(override?.introduction) ?? page.intro,
    faqs: faqs.length > 0 ? faqs : page.faqs,
    metaKeywords: text(override?.meta_keywords),
    mainContent: text(override?.main_content),
    ogImage: text(override?.og_image),
    noIndex: Boolean(override?.noindex),
    overriddenAt: override?.updated_at ?? null,
  };
}

/** Market page that lists a given market (most specific first). */
export function marketPageForMarket(market: MarketKey): MarketPage | undefined {
  return MARKET_PAGES.find((p) => p.selection.kind === "markets" && p.selection.markets.length === 1 && p.selection.markets[0] === market)
    ?? MARKET_PAGES.find((p) => p.selection.kind === "markets" && p.selection.markets.includes(market));
}

// ---------------------------------------------------------------------------
// Selection -- pure, so it can be unit tested.
// ---------------------------------------------------------------------------

export interface SelectablePrediction {
  id: string;
  prediction_type: string;
  market?: string | null;
  odds: number | null;
  confidence: number | null;
  kickoff_time: string;
  external_fixture_id: number | null;
  home_team: string;
  away_team: string;
}

const SAFE_MAX_ODDS = 1.5;
const TOP_PICK_MIN_ODDS = 1.4;
const SUPER_SINGLE_ODDS: readonly [number, number] = [1.4, 2.0];

const byConfidenceThenKickoff = (a: SelectablePrediction, b: SelectablePrediction) =>
  (b.confidence ?? 0) - (a.confidence ?? 0) || a.kickoff_time.localeCompare(b.kickoff_time);

const byKickoff = (a: SelectablePrediction, b: SelectablePrediction) => a.kickoff_time.localeCompare(b.kickoff_time);

function fixtureKey(p: SelectablePrediction): string {
  return p.external_fixture_id ? `f:${p.external_fixture_id}` : `t:${p.home_team}|${p.away_team}|${p.kickoff_time.slice(0, 10)}`;
}

export function applyMarketSelection<T extends SelectablePrediction>(predictions: T[], selection: MarketSelection): T[] {
  switch (selection.kind) {
    case "markets": {
      const wanted = new Set<string>(selection.markets);
      return predictions.filter((p) => {
        const market = marketOf(p);
        return market !== null && wanted.has(market);
      });
    }
    case "safe":
      return predictions
        .filter((p) => p.odds !== null && p.odds <= SAFE_MAX_ODDS && marketOf(p) !== "over_0_5")
        .sort(byConfidenceThenKickoff);
    case "super-single": {
      const [min, max] = SUPER_SINGLE_ODDS;
      const top = predictions.filter((p) => p.odds !== null && p.odds >= min && p.odds <= max).sort(byConfidenceThenKickoff)[0];
      return top ? [top] : [];
    }
    case "top-picks": {
      const groups = new Map<string, T[]>();
      for (const p of predictions) {
        const key = fixtureKey(p);
        groups.set(key, [...(groups.get(key) ?? []), p]);
      }
      const picks: T[] = [];
      for (const group of groups.values()) {
        const meaningful = group.filter((p) => p.odds === null || p.odds >= TOP_PICK_MIN_ODDS);
        const best = [...(meaningful.length > 0 ? meaningful : group)].sort(byConfidenceThenKickoff)[0];
        if (best) picks.push(best);
      }
      return picks.sort(byConfidenceThenKickoff);
    }
  }
}

/** Kickoff order for display; selection order is kept for ranked pages. */
export function isRankedSelection(selection: MarketSelection): boolean {
  return selection.kind !== "markets";
}

export { byKickoff };
