// Every piece of admin-editable site text, with its default (what the site
// shows until an admin changes it). Admin > Site Content is generated from this
// file, and pages read their text through getSiteText() (lib/content/site-text.ts).
//
// Text uses the plain-text format in lib/content/plain-text.ts: **bold**,
// [link text](/path) and, in multi-line fields, paragraphs, "## " headings and
// "- " lists. "{name}" placeholders are filled in by the page (listed per field).
//
// To make a new piece of text editable: add a field here, then read it with
// text.t("key") where it is rendered. Keys must never be renamed once live --
// saved edits are stored by key.

import { MARKET_GROUP_ORDER, MARKET_PAGES, type MarketGroup, type MarketPage } from "@/lib/seo/market-pages";
import { FAQ_OUTRO_DEFAULT, LONG_PAGE_DEFAULTS, type LongPageSlug } from "@/lib/content/page-defaults";
import { plainTextOf } from "@/lib/content/plain-text";
import type { FaqItem } from "@/types/database";

export type FieldKind = "line" | "text";

export interface FieldDef {
  label: string;
  default: string;
  /** "line": one line (bold and links allowed). "text": paragraphs, headings and lists. */
  kind: FieldKind;
  help?: string;
  /** Placeholders the page fills in, e.g. ["date"] for {date}. */
  vars?: readonly string[];
  /** May be left empty to hide it on the site. Otherwise empty means "use the default". */
  optional?: boolean;
}

export interface ContentField extends FieldDef {
  key: string;
}

export type GroupSection = "Site-wide" | "Pages" | "Long pages" | "Markets";

export interface ContentGroup {
  id: string;
  title: string;
  section: GroupSection;
  description?: string;
  /** Page to open when checking the result. */
  previewPath?: string;
  fields: ContentField[];
}

const line = (label: string, value: string, extra: Partial<FieldDef> = {}): FieldDef => ({ label, default: value, kind: "line", ...extra });
const text = (label: string, value: string, extra: Partial<FieldDef> = {}): FieldDef => ({ label, default: value, kind: "text", ...extra });

interface GroupMeta {
  title: string;
  section: GroupSection;
  description?: string;
  previewPath?: string;
}

function group<K extends string>(meta: GroupMeta, fields: Record<K, FieldDef>) {
  return { ...meta, fields };
}

// ---------------------------------------------------------------------------
// Site-wide and page text
// ---------------------------------------------------------------------------

const STATIC_GROUPS = {
  header: group(
    { title: "Header & menu", section: "Site-wide", description: "Links in the top menu and the mobile menu.", previewPath: "/" },
    {
      "nav.today": line("Menu: Today", "Today"),
      "nav.tomorrow": line("Menu: Tomorrow", "Tomorrow"),
      "nav.tips": line("Menu: Tips by market", "Tips by Market"),
      "nav.competitions": line("Menu: Competitions", "Competitions"),
      "nav.results": line("Menu: Results", "Results"),
      "nav.blog": line("Menu: Blog", "Blog"),
      "nav.contact": line("Mobile menu: Contact", "Contact"),
      "nav.sponsored": line("Mobile menu: sponsored links heading", "Sponsored"),
    }
  ),
  footer: group(
    { title: "Footer", section: "Site-wide", description: "Text and link labels in the site footer.", previewPath: "/" },
    {
      "footer.tagline": text("Tagline under the logo", "Free football predictions, match data and a public record of every result we publish — wins and losses.", { optional: true }),
      "footer.disclaimer": text("Small print under the logo", "18+ only. Predictions are opinions based on data, not guarantees. Bet responsibly and within your means.", { optional: true }),
      "footer.predictionsTitle": line("Column heading: predictions", "Predictions"),
      "footer.today": line("Link: today's predictions", "Today's predictions"),
      "footer.tomorrow": line("Link: tomorrow's predictions", "Tomorrow's predictions"),
      "footer.allMarkets": line("Link: all markets", "All markets →"),
      "footer.competitionsTitle": line("Column heading: competitions", "Competitions"),
      "footer.allCompetitions": line("Link: all competitions", "All competitions →"),
      "footer.siteTitle": line("Column heading: about the site", "Sure Match Tips"),
      "footer.about": line("Link: About", "About us"),
      "footer.methodology": line("Link: Methodology", "How our predictions work"),
      "footer.editorial": line("Link: Editorial standards", "Editorial standards"),
      "footer.results": line("Link: Previous results", "Previous results"),
      "footer.responsible": line("Link: Responsible betting", "Responsible betting"),
      "footer.faq": line("Link: FAQ", "FAQ"),
      "footer.contact": line("Link: Contact", "Contact"),
      "footer.blog": line("Link: Blog", "Blog"),
      "footer.terms": line("Bottom link: Terms", "Terms"),
      "footer.privacy": line("Bottom link: Privacy", "Privacy"),
      "footer.cookies": line("Bottom link: Cookies", "Cookies"),
      "footer.disclaimerLink": line("Bottom link: Disclaimer", "Disclaimer"),
      "footer.copyright": line("Copyright line", "© {year} Sure Match Tips", { vars: ["year"] }),
    }
  ),
  notice: group(
    {
      title: "Responsible betting notice",
      section: "Site-wide",
      description: "The 18+ box shown at the bottom of the prediction pages.",
      previewPath: "/",
    },
    {
      "notice.text": line(
        "Notice text",
        "**18+ only. Predictions are not guarantees.** Football is unpredictable and every bet can lose. Only stake what you can afford to lose, never chase losses, and read our [responsible betting guide](/responsible-betting) if betting stops being fun."
      ),
    }
  ),
  cards: group(
    { title: "Market cards & tables", section: "Site-wide", description: "Small labels used on market cards and prediction lists.", previewPath: "/" },
    {
      "chips.allTips": line("Market buttons: first button", "All Tips"),
      "cards.picksToday": line("Card: picks today", "{count} picks today", { vars: ["count"] }),
      "cards.onePickToday": line("Card: one pick today", "1 pick today"),
      "cards.noPicksToday": line("Card: no picks today", "No picks yet today"),
      "list.seeMore": line("Button: see more predictions", "See more"),
      "list.seeLess": line("Button: see fewer predictions", "See less"),
      "list.moreCount": line("Button: how many are hidden", "({count} more)", { vars: ["count"], optional: true }),
    }
  ),

  home: group(
    { title: "Homepage", section: "Pages", previewPath: "/" },
    {
      "home.seoTitle": line("SEO title (browser tab & Google)", "Free Football Predictions Today & Soccer Tips | Sure Match Tips"),
      "home.seoDescription": line(
        "SEO description",
        "Free football predictions today: daily soccer tips by market with odds, confidence and match analysis, plus a verified public record of every result."
      ),
      "home.h1": line("Main heading", "Free Football Predictions Today – Daily Soccer Tips & Match Analysis"),
      "home.intro": text(
        "Intro paragraph",
        "Sure Match Tips publishes free football predictions every day across the match result, goals, both teams to score and double chance markets. Each tip shows its odds and confidence, links to a match preview with head-to-head and form data, and stays on our public results record — win or lose.",
        { optional: true }
      ),
      "home.telegramButton": line("Telegram button (shown when a Telegram link is set)", "Join our Telegram channel", {
        optional: true,
        help: "The link itself is set in Links & Contact.",
      }),
      "home.whatsappButton": line("WhatsApp button (shown when a WhatsApp number is set)", "Chat on WhatsApp", {
        optional: true,
        help: "The number itself is set in Links & Contact.",
      }),
      "home.todayHeading": line("Today's predictions heading", "Today's free predictions"),
      "home.otherDayHeading": line("Heading when another day is picked", "Predictions for {date}", { vars: ["date"] }),
      "home.empty": line(
        "Message when no predictions are published",
        "No predictions have been published for {date} yet. New picks are usually added the day before kickoff — see [upcoming predictions](/predictions) or the [previous results](/previous-results).",
        { vars: ["date"] }
      ),
      "home.tomorrowHeading": line("Tomorrow section heading", "Tomorrow's football predictions"),
      "home.tomorrowLink": line("Tomorrow section link", "All {count} upcoming tips →", { vars: ["count"] }),
      "home.marketsHeading": line("Markets section heading", "Popular betting markets"),
      "home.marketsLink": line("Markets section link", "All markets →"),
      "home.blogHeading": line("Blog section heading", "Football guides & analysis"),
      "home.blogLink": line("Blog section link", "All articles"),
      "home.blogEmpty": line("Blog section text when there are no articles", "Match previews, betting guides and analysis will appear here soon."),
      "home.competitionsHeading": line("Competitions section heading", "Predictions by competition"),
      "home.competitionsLink": line("Competitions section link", "All competitions →"),
      "home.resultsHeading": line("Results section heading", "Previous results"),
      "home.resultsIntro": line("Results section intro", "Verified results from the last 7 days. Losses included.", { optional: true }),
      "home.resultsLink": line("Results section link", "Full results history →"),
      "home.tablesHeading": line("League tables heading", "League tables"),
      "home.tablesIntro": line("League tables intro", "Current standings in Europe's top five leagues, from API-Sports.", { optional: true }),
      "home.trustHeading": line("'How it works' heading", "How Sure Match Tips works"),
      "home.trust1Title": line("Point 1 title", "Every pick stays on the record"),
      "home.trust1Text": line("Point 1 text", "Predictions are published before kickoff and the selection is frozen once the match starts. Losses are never deleted."),
      "home.trust2Title": line("Point 2 title", "Results are verified"),
      "home.trust2Text": line("Point 2 text", "Final scores come from API-Sports and every pick is graded automatically on the 90-minute result, losses included."),
      "home.trust3Title": line("Point 3 title", "Confidence is explained"),
      "home.trust3Text": line("Point 3 text", "For automatic picks, confidence is the bookmaker's implied probability — a ranking aid, not a promise."),
      "home.trustLinks": line("Links under the points", "[Read the full methodology](/methodology) · [About us](/about)", { optional: true }),
    }
  ),
  tomorrow: group(
    { title: "Tomorrow page", section: "Pages", previewPath: "/predictions" },
    {
      "tomorrow.seoTitle": line("SEO title", "Football Predictions Tomorrow – Upcoming Free Tips"),
      "tomorrow.seoDescription": line(
        "SEO description",
        "Free football predictions for tomorrow and the day after: upcoming tips across every market with odds, confidence and links to full match previews."
      ),
      "tomorrow.breadcrumb": line("Breadcrumb", "Upcoming predictions"),
      "tomorrow.h1": line("Main heading", "Football Predictions Tomorrow"),
      "tomorrow.intro": text(
        "Intro paragraph",
        "Free predictions for the next two days of football, published ahead of kickoff so you have time to check team news. Open any match for its head-to-head record, recent form and league position. Looking for today's games? See [football predictions today](/).",
        { optional: true }
      ),
      "tomorrow.day1": line("First day heading", "Tomorrow · {date}", { vars: ["date"] }),
      "tomorrow.day2": line("Second day heading", "Day after tomorrow · {date}", { vars: ["date"] }),
      "tomorrow.empty": line(
        "Message when a day has no predictions",
        "Predictions for {date} haven't been published yet. Picks are added automatically through the day before kickoff — check back later.",
        { vars: ["date"] }
      ),
    }
  ),
  tips: group(
    { title: "Tips by market page", section: "Pages", previewPath: "/tips" },
    {
      "tips.seoTitle": line("SEO title", "Football Betting Tips by Market – Goals, BTTS, 1X2"),
      "tips.seoDescription": line(
        "SEO description",
        "Free football betting tips by market: over/under goals, both teams to score, match result and double chance — with today's picks and verified results."
      ),
      "tips.breadcrumb": line("Breadcrumb", "Tips by market"),
      "tips.h1": line("Main heading", "Football Betting Tips by Market"),
      "tips.intro": text(
        "Intro paragraph",
        "Every free prediction on Sure Match Tips belongs to a betting market. Choose a market to see today's picks, how they are selected, what to consider before betting, and how that market's published tips have performed. For every market at once, see [today's football predictions](/).",
        { optional: true }
      ),
      "tips.group.daily": line("Group heading: daily selections", "Daily selections"),
      "tips.group.result": line("Group heading: match result", "Match result"),
      "tips.group.goals": line("Group heading: goals", "Goals"),
      "tips.group.btts": line("Group heading: both teams to score", "Both teams to score"),
      "tips.noResults": line("Card: no results yet", "No verified results yet"),
      "tips.stats": line("Card: results line", "{rate} win rate · {settled} settled (90 days)", { vars: ["rate", "settled"] }),
      "tips.moreGuides": line("Extra SEO pages heading", "More prediction guides"),
    }
  ),
  marketPage: group(
    {
      title: "Market pages (shared text)",
      section: "Pages",
      description: "Headings used on every market page. Each market's own text is under Markets below.",
      previewPath: "/tips/free",
    },
    {
      "marketPage.todayPicks": line("Picks heading (today)", "Today's {market} picks", { vars: ["market"] }),
      "marketPage.datePicks": line("Picks heading (other day)", "{market} picks for {date}", { vars: ["market", "date"] }),
      "marketPage.empty": line(
        "Message when there are no picks",
        "No {market} picks have been published for {date}. New picks are usually added the day before kickoff. Try [tomorrow]({tomorrowLink}), or browse [all of today's predictions](/).",
        { vars: ["market", "date", "tomorrowLink"] }
      ),
      "marketPage.emptySuperSingle": line(
        "Message when there is no Super Single",
        "No {market} picks have been published for {date}. A super single is only published when a pick qualifies. Try [tomorrow]({tomorrowLink}), or browse [all of today's predictions](/).",
        { vars: ["market", "date", "tomorrowLink"] }
      ),
      "marketPage.howSelectedHeading": line("'How selected' heading", "How these picks are selected"),
      "marketPage.methodologyLink": line("Methodology link", "[Full prediction methodology](/methodology)", { optional: true }),
      "marketPage.factorsHeading": line("'What to consider' heading", "What to consider"),
      "marketPage.recordHeading": line("Results record heading", "{market} results record", { vars: ["market"] }),
      "marketPage.recordHeadingAll": line("Results record heading (mixed markets)", "Results record"),
      "marketPage.recordIntro": line("Results record intro", "Graded results for {market}. Win rate excludes void bets.", {
        vars: ["market"],
        optional: true,
      }),
      "marketPage.allTipsLabel": line("Name used for mixed markets in the record text", "all published tips"),
      "marketPage.latestResults": line("Latest results heading", "Latest verified results"),
      "marketPage.seeAll": line("Link to all results", "See every {market} result", { vars: ["market"] }),
      "marketPage.limitationsHeading": line("Limitations heading", "Limitations"),
      "marketPage.faqHeading": line("FAQ heading", "{market}: frequently asked questions", { vars: ["market"] }),
      "marketPage.relatedHeading": line("Related markets heading", "Related markets"),
      "marketPage.competitionsHeading": line("Competitions heading", "Competitions with {market} picks", { vars: ["market"] }),
      "marketPage.competitionLink": line("Competition link", "{competition} predictions", { vars: ["competition"] }),
      "marketPage.noCompetitions": line(
        "Text when no covered competition has a pick",
        "None of the competitions we cover in depth have a pick on this date. [Browse all competitions](/competitions)."
      ),
      "seoPage.picks": line("SEO pages: picks heading", "Picks for {date}", { vars: ["date"] }),
      "seoPage.empty": line("SEO pages: no picks message", "No matching picks have been published for {date} yet.", { vars: ["date"] }),
      "seoPage.related": line("SEO pages: related links heading", "Related pages"),
    }
  ),
  competitions: group(
    { title: "Competitions", section: "Pages", description: "The competitions list and the shared text on every competition page. Each competition's own heading and introduction are edited under Competitions.", previewPath: "/competitions" },
    {
      "comps.seoTitle": line("List page: SEO title", "Football Predictions by League & Competition"),
      "comps.seoDescription": line(
        "List page: SEO description",
        "Free predictions, fixtures, tables and verified results for the Premier League, La Liga, Serie A, Bundesliga, Ligue 1, the Champions League and more."
      ),
      "comps.breadcrumb": line("List page: breadcrumb", "Competitions"),
      "comps.h1": line("List page: main heading", "Football Predictions by Competition"),
      "comps.intro": text(
        "List page: intro",
        "Each competition hub brings together our free predictions for that league or tournament with upcoming fixtures, the current table, recent results and the verified record of every tip we have published there.",
        { optional: true }
      ),
      "comps.leagues": line("List page: leagues heading", "Domestic leagues"),
      "comps.cups": line("List page: cups heading", "European and international competitions"),
      "comps.empty": line("List page: no competitions", "Competition hubs are being set up — check back soon."),
      "comp.upcomingHeading": line("Competition page: predictions heading", "Upcoming {competition} predictions", { vars: ["competition"] }),
      "comp.noPredictions": line(
        "Competition page: no predictions",
        "No {competition} predictions are published for the coming days yet. Picks are added the day before kickoff — meanwhile see the fixtures below or [today's predictions](/).",
        { vars: ["competition"] }
      ),
      "comp.fixturesHeading": line("Competition page: fixtures heading", "{competition} fixtures", { vars: ["competition"] }),
      "comp.fixturesUnavailable": line("Competition page: fixtures unavailable", "Fixtures are temporarily unavailable from our data provider."),
      "comp.noFixtures": line("Competition page: no fixtures", "No {competition} fixtures are scheduled in the next ten days.", { vars: ["competition"] }),
      "comp.tipsBadge": line("Competition page: badge on fixtures with tips", "Tips"),
      "comp.recentHeading": line("Competition page: recent results heading", "Recent {competition} results", { vars: ["competition"] }),
      "comp.recordHeading": line("Competition page: record heading", "Our {competition} record", { vars: ["competition"] }),
      "comp.recordIntro": line("Competition page: record intro", "Verified results of every {competition} tip we have published.", {
        vars: ["competition"],
        optional: true,
      }),
      "comp.tableHeading": line("Competition page: table heading", "{competition} table", { vars: ["competition"] }),
      "comp.tableUnavailable": line("Competition page: table unavailable", "The league table is temporarily unavailable."),
      "comp.marketsHeading": line("Competition page: markets heading", "Betting markets"),
      "comp.postsHeading": line("Competition page: articles heading", "{competition} analysis", { vars: ["competition"] }),
    }
  ),
  results: group(
    { title: "Previous results page", section: "Pages", previewPath: "/previous-results" },
    {
      "results.seoTitle": line("SEO title", "Previous Results – Verified Football Prediction Record"),
      "results.seoDescription": line(
        "SEO description",
        "Every free prediction Sure Match Tips has published and how it settled — wins, losses and void bets — with win rates for the last 7 days, 30 days and all time."
      ),
      "results.breadcrumb": line("Breadcrumb", "Previous results"),
      "results.h1": line("Main heading", "Previous Results"),
      "results.intro": text(
        "Intro paragraph",
        "A complete, public record of the predictions we have published and how they settled — losses included. Picks are shown exactly as published before kickoff, and graded automatically against the official final score. [How results are verified](/methodology#how-results-are-verified)",
        { optional: true }
      ),
      "results.performance": line("Statistics heading", "Performance"),
      "results.last7": line("Label: last 7 days", "Last 7 days"),
      "results.last30": line("Label: last 30 days", "Last 30 days"),
      "results.allTime": line("Label: all time", "All time"),
      "results.winRateNote": line(
        "Note under the statistics",
        "Win rate = wins ÷ (wins + losses). Void bets (postponed or abandoned matches) are excluded from the rate. Pending covers matches not yet played and picks that can't be graded from the score.",
        { optional: true }
      ),
      "results.listHeading": line("Results list heading", "Verified results"),
      "results.allCompetitions": line("Filter: all competitions", "All competitions"),
      "results.allMarkets": line("Filter: all markets", "All markets"),
      "results.anyResult": line("Filter: any result", "Any result"),
      "results.unavailable": line("Results unavailable", "Results are temporarily unavailable. Please try again shortly."),
      "results.empty": line("No results match the filters", "No verified results match these filters yet."),
      "results.byMarket": line("By-market table heading", "Results by market (last 90 days)"),
    }
  ),
  blog: group(
    { title: "Blog", section: "Pages", description: "The blog list and labels on article pages. Articles themselves are edited under Blog.", previewPath: "/blog" },
    {
      "blog.seoTitle": line("SEO title", "Football Betting Guides & Match Analysis"),
      "blog.seoTitlePaged": line("SEO title on page 2+", "Football Betting Guides & Analysis – Page {page}", { vars: ["page"] }),
      "blog.seoDescription": line(
        "SEO description",
        "Guides to football betting markets, league analysis and explainers on how predictions, odds and probability work — written to help you bet with your eyes open."
      ),
      "blog.breadcrumb": line("Breadcrumb", "Blog"),
      "blog.h1": line("Main heading", "Football Guides & Analysis"),
      "blog.intro": text(
        "Intro paragraph",
        "Explainers on betting markets, league and team analysis, and how to read odds and probability. For today's picks, see [football predictions today](/).",
        { optional: true }
      ),
      "blog.empty": line("No articles yet", "No articles have been published yet."),
      "blog.relatedPredictions": line("Article page: related predictions heading", "Related predictions"),
      "blog.relatedArticles": line("Article page: related articles heading", "Related articles"),
      "blog.competitionLink": line("Article page: competition link", "{competition} predictions and fixtures", { vars: ["competition"] }),
    }
  ),
  match: group(
    { title: "Match pages", section: "Pages", description: "Shared headings and messages on every match page." },
    {
      "match.seoTitle": line("SEO title", "{fixture} Prediction & H2H – {date}", { vars: ["fixture", "date"] }),
      "match.h1": line("Main heading", "{fixture} Prediction", { vars: ["fixture"] }),
      "match.predictionsHeading": line("Predictions heading", "{fixture} predictions", { vars: ["fixture"] }),
      "match.noPrediction": line(
        "Message when there is no prediction",
        "We haven't published a prediction for this match. The statistics below are provided for reference — see [today's predictions](/) for the matches we cover."
      ),
      "match.statsUnavailable": line(
        "Statistics unavailable",
        "Some match statistics are temporarily unavailable from our data provider. Predictions above are unaffected."
      ),
      "match.h2hHeading": line("Head-to-head heading", "{fixture} head to head", { vars: ["fixture"] }),
      "match.h2hSummary": line(
        "Head-to-head summary",
        "In their last {played} meetings, {home} won {homeWins}, {away} won {awayWins} and {draws} ended level, with an average of {avgGoals} goals per game. Both teams scored in {bothScored} and {over25} had three or more goals.",
        { vars: ["played", "home", "away", "homeWins", "awayWins", "draws", "avgGoals", "bothScored", "over25"] }
      ),
      "match.formHeading": line("Recent form heading", "Recent form"),
      "match.noRecent": line("No recent results", "No recent results available."),
      "match.positionHeading": line("League position heading", "League position"),
      "match.fullTable": line("Link to the competition", "Full {competition} table and predictions →", { vars: ["competition"] }),
      "match.morePredictions": line("More predictions heading", "More {league} predictions", { vars: ["league"] }),
      "match.relatedLink": line("Related prediction link", "{fixture} prediction", { vars: ["fixture"] }),
      "match.marketsHeading": line("Markets heading", "Markets for this match"),
    }
  ),
  prediction: group(
    { title: "Single prediction pages", section: "Pages", description: "Labels on the page for one prediction." },
    {
      "prediction.breadcrumb": line("Breadcrumb", "Predictions"),
      "prediction.h1": line("Main heading", "{fixture} Prediction", { vars: ["fixture"] }),
      "prediction.pick": line("Label: our pick", "Our pick"),
      "prediction.odds": line("Label: odds", "Odds"),
      "prediction.confidence": line("Label: confidence", "Confidence"),
      "prediction.result": line("Label: result", "Result"),
      "prediction.why": line("'Why we picked it' heading", "Why we picked it"),
      "prediction.moreInMarket": line("Text before the market link", "More picks in this market:"),
    }
  ),
  contact: group(
    { title: "Contact page", section: "Pages", previewPath: "/contact" },
    {
      "contact.seoTitle": line("SEO title", "Contact Us"),
      "contact.seoDescription": line(
        "SEO description",
        "Contact Sure Match Tips with questions about a prediction or result, to report a mistake, or for general enquiries."
      ),
      "contact.breadcrumb": line("Breadcrumb", "Contact"),
      "contact.h1": line("Main heading", "Contact Us"),
      "contact.intro": text(
        "Intro paragraph",
        "Questions about a prediction, a result you think was graded wrongly, or anything else on the site — send us a message. We read everything. Please don't send betting slips or payment details: we never take bets or payments.",
        { optional: true }
      ),
      "contact.telegram": line("Telegram link label", "Telegram channel"),
      "contact.whatsapp": line("WhatsApp link label", "WhatsApp"),
      "contact.support": line("Support link label", "Chat with support"),
      "contact.formName": line("Form: name label", "Name"),
      "contact.formEmail": line("Form: email label", "Email"),
      "contact.formMessage": line("Form: message label", "Message"),
      "contact.formSend": line("Form: send button", "Send Message"),
      "contact.formSending": line("Form: sending…", "Sending…"),
      "contact.formSuccess": line("Form: success message", "Message sent! We'll get back to you soon."),
    }
  ),
  notFound: group(
    { title: "Page not found (404)", section: "Pages", previewPath: "/this-page-does-not-exist" },
    {
      "notFound.h1": line("Heading", "Page not found"),
      "notFound.text": line(
        "Text",
        "This page doesn't exist or is no longer available. Fixtures and predictions move on quickly — try one of these instead."
      ),
    }
  ),
};

type StaticGroups = typeof STATIC_GROUPS;
export type StaticContentKey = { [G in keyof StaticGroups]: keyof StaticGroups[G]["fields"] & string }[keyof StaticGroups];

// ---------------------------------------------------------------------------
// Long pages (About, Methodology, legal pages, FAQ)
// ---------------------------------------------------------------------------

export const LONG_PAGE_FIELDS = ["title", "intro", "body", "seoTitle", "seoDescription"] as const;
export type LongPageField = (typeof LONG_PAGE_FIELDS)[number];
export type LongPageKey = `page.${LongPageSlug}.${LongPageField}` | "page.faq.outro";

const FORMAT_HELP =
  'Write "## " at the start of a line for a heading, "- " for a bullet point and leave a blank line between paragraphs. **Bold** and [link text](/page) work anywhere.';

function longPageGroup(slug: LongPageSlug): ContentGroup {
  const d = LONG_PAGE_DEFAULTS[slug];
  const fields: ContentField[] = [
    { key: `page.${slug}.title`, ...line("Page heading", d.title) },
    { key: `page.${slug}.intro`, ...text("Intro (larger text under the heading)", d.intro, { optional: true }) },
    {
      key: `page.${slug}.body`,
      ...text("Page text", d.body, {
        help:
          slug === "faq"
            ? 'Each question is a line starting with "## "; its answer goes underneath. ' + FORMAT_HELP
            : slug === "methodology"
              ? `${FORMAT_HELP} Keep {{odds-table}} on its own line where the odds-window table should appear; {draw_min_odds} shows the draw threshold from the selection rules.`
              : FORMAT_HELP,
        vars: slug === "methodology" ? ["draw_min_odds"] : undefined,
      }),
    },
  ];
  if (slug === "faq") fields.push({ key: "page.faq.outro", ...line("Links under the questions", FAQ_OUTRO_DEFAULT, { optional: true }) });
  fields.push(
    { key: `page.${slug}.seoTitle`, ...line("SEO title (browser tab & Google)", d.seoTitle) },
    { key: `page.${slug}.seoDescription`, ...line("SEO description", d.seoDescription) }
  );
  return { id: `page-${slug}`, title: d.title, section: "Long pages", previewPath: `/${slug}`, description: 'Editing this page updates its "Last updated" date.', fields };
}

// ---------------------------------------------------------------------------
// Markets (one group per built-in market page)
// ---------------------------------------------------------------------------

export const MARKET_FIELDS = [
  "tab",
  "h1",
  "intro",
  "explainerHeading",
  "explainer",
  "howSelected",
  "factors",
  "limitations",
  "faq",
  "seoTitle",
  "seoDescription",
] as const;
export type MarketField = (typeof MARKET_FIELDS)[number];
export type MarketContentKey = `market.${string}.${MarketField}`;

export const MARKET_GROUP_LABEL_KEYS: Record<MarketGroup, StaticContentKey | null> = {
  "Daily selections": "tips.group.daily",
  "Match result": "tips.group.result",
  Goals: "tips.group.goals",
  "Both teams to score": "tips.group.btts",
  "Exact score": null,
};

export function faqToText(items: FaqItem[]): string {
  return items.map((i) => `## ${i.question}\n${i.answer}`).join("\n\n");
}

/** "## Question" lines followed by their answer (in the plain-text format). */
export function parseFaqText(input: string): FaqItem[] {
  const items: Array<{ question: string; answer: string[] }> = [];
  for (const raw of input.replace(/\r\n?/g, "\n").split("\n")) {
    const heading = /^#{1,3}\s+(.+?)\s*$/.exec(raw.trim());
    if (heading) {
      items.push({ question: heading[1], answer: [] });
      continue;
    }
    items.at(-1)?.answer.push(raw);
  }
  return items
    .map((i) => ({ question: plainTextOf(i.question), answer: i.answer.join("\n").trim() }))
    .filter((i) => i.question && i.answer);
}

/** One item per non-empty line; leading "- ", "• " or "1. " markers are optional. */
export function listItems(input: string): string[] {
  return input
    .replace(/\r\n?/g, "\n")
    .split("\n")
    .map((l) => l.trim().replace(/^(?:[-*•–]|\d{1,3}[.)])\s+/, ""))
    .filter(Boolean);
}

const toList = (items: string[]) => items.map((i) => `- ${i}`).join("\n");

function marketGroup(page: MarketPage): ContentGroup {
  const k = (f: MarketField) => `market.${page.slug}.${f}`;
  return {
    id: `market-${page.slug}`,
    title: page.tabLabel,
    section: "Markets",
    previewPath: `/tips/${page.slug}`,
    description: "Meta keywords, a social image and extra content for this page are set under SEO Pages.",
    fields: [
      { key: k("tab"), ...line("Tab & menu label", page.tabLabel, { help: "Shown on the market buttons, in the footer and in breadcrumbs." }) },
      { key: k("h1"), ...line("Page heading", page.h1, { help: "Also used for this market's card titles and links." }) },
      { key: k("intro"), ...text("Intro paragraph", page.intro) },
      { key: k("explainerHeading"), ...line("Explainer heading", page.explainer.heading) },
      { key: k("explainer"), ...text("Explainer text", page.explainer.paragraphs.join("\n\n"), { help: FORMAT_HELP }) },
      { key: k("howSelected"), ...text("How these picks are selected (one point per line)", toList(page.howSelected)) },
      { key: k("factors"), ...text("What to consider (one point per line)", toList(page.factors)) },
      { key: k("limitations"), ...text("Limitations", page.limitations) },
      {
        key: k("faq"),
        ...text("FAQ", faqToText(page.faqs), { optional: true, help: 'Each question is a line starting with "## "; its answer goes underneath.' }),
      },
      { key: k("seoTitle"), ...line("SEO title (browser tab & Google)", page.title) },
      { key: k("seoDescription"), ...line("SEO description", page.description) },
    ],
  };
}

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

export type ContentKey = StaticContentKey | LongPageKey | MarketContentKey;

function staticGroups(): ContentGroup[] {
  return Object.entries(STATIC_GROUPS).map(([id, g]) => ({
    id,
    title: g.title,
    section: g.section,
    description: g.description,
    previewPath: g.previewPath,
    fields: Object.entries(g.fields as Record<string, FieldDef>).map(([key, def]) => ({ key, ...def })),
  }));
}

const LONG_PAGE_ORDER: LongPageSlug[] = ["about", "methodology", "faq", "editorial-standards", "responsible-betting", "terms", "privacy", "cookies", "disclaimer"];

let groupsCache: ContentGroup[] | undefined;

/** Every editable group, in the order the admin page lists them. */
export function getContentGroups(): ContentGroup[] {
  groupsCache ??= [
    ...staticGroups(),
    ...LONG_PAGE_ORDER.map(longPageGroup),
    ...MARKET_GROUP_ORDER.flatMap((g) => MARKET_PAGES.filter((p) => p.group === g)).map(marketGroup),
  ];
  return groupsCache;
}

let fieldsCache: Map<string, ContentField> | undefined;

export function getContentField(key: string): ContentField | undefined {
  fieldsCache ??= new Map(getContentGroups().flatMap((g) => g.fields.map((f) => [f.key, f] as const)));
  return fieldsCache.get(key);
}

// ---------------------------------------------------------------------------
// Resolving text
// ---------------------------------------------------------------------------

/** What is stored in site_config under CONTENT_ROW_KEY. */
export interface StoredContent {
  /** Edited text by key; "" hides an optional field. Unedited keys are absent. */
  texts?: Record<string, string>;
  /** yyyy-MM-dd a long page was last edited, by slug. */
  pageUpdated?: Record<string, string>;
}

export const CONTENT_ROW_KEY = "content";

export type TextVars = Record<string, string | number>;

export interface SiteText {
  /** The edited text for a key, or its default; {name} placeholders filled from vars. */
  t(key: ContentKey, vars?: TextVars): string;
  /** "Last updated" date (yyyy-MM-dd) of a long page. */
  pageUpdated(slug: LongPageSlug): string;
}

export function fillVars(value: string, vars?: TextVars): string {
  if (!vars) return value;
  return value.replace(/\{(\w+)\}/g, (match, name: string) => (name in vars ? String(vars[name]) : match));
}

export function createSiteText(stored: StoredContent | null | undefined): SiteText {
  const texts = stored?.texts ?? {};
  const updated = stored?.pageUpdated ?? {};
  return {
    t(key, vars) {
      const field = getContentField(key);
      if (!field) {
        console.warn(`[site-text] unknown key ${key}`);
        return "";
      }
      const edited = Object.prototype.hasOwnProperty.call(texts, key) ? texts[key] : undefined;
      // An empty value only hides optional fields; anything else falls back to the default.
      const value = edited === undefined || (edited.trim() === "" && !field.optional) ? field.default : edited;
      return fillVars(value, vars);
    },
    pageUpdated(slug) {
      const edited = updated[slug];
      const original = LONG_PAGE_DEFAULTS[slug].updated;
      return edited && edited > original ? edited : original;
    },
  };
}

/** A built-in market page with its admin-edited text applied. */
export function applyMarketText(page: MarketPage, text: SiteText): MarketPage {
  const k = (f: MarketField) => text.t(`market.${page.slug}.${f}`);
  return {
    ...page,
    tabLabel: k("tab"),
    h1: k("h1"),
    intro: k("intro"),
    title: k("seoTitle"),
    description: k("seoDescription"),
    explainer: { heading: k("explainerHeading"), paragraphs: [k("explainer")] },
    howSelected: listItems(k("howSelected")),
    factors: listItems(k("factors")),
    limitations: k("limitations"),
    faqs: parseFaqText(k("faq")),
  };
}
