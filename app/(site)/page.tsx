import { HeroSection } from "@/components/home/hero-section";
import { FreePredictionsSection } from "@/components/home/free-predictions-section";
import { CtaRow } from "@/components/home/cta-row";
import { VipWinningsSection } from "@/components/home/vip-winnings-section";
import { VipPackagesSection } from "@/components/home/vip-packages-section";
import { CorrectScorePreviewSection } from "@/components/home/correct-score-preview-section";
import { BlogSection } from "@/components/home/blog-section";
import { LeagueTableSection } from "@/components/home/league-table-section";
import { AboutSection } from "@/components/home/about-section";
import type { DateNavPeriod } from "@/lib/utils/date";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const period = (params.period as DateNavPeriod) ?? "today";
  const correctScorePeriod = params.section === "correct-score" ? period : "today";
  const freePredictionsPeriod = params.section === "correct-score" ? "today" : period;
  const correctScoreDate = params.section === "correct-score" ? params.date : undefined;
  const freePredictionsDate = params.section === "correct-score" ? undefined : params.date;

  return (
    <>
      <HeroSection />
      <FreePredictionsSection period={freePredictionsPeriod} filter={params.filter ?? "free"} date={freePredictionsDate} />
      <CtaRow />
      <VipWinningsSection beforeDate={params.winningsBefore} />
      <VipPackagesSection />
      <CorrectScorePreviewSection period={correctScorePeriod} date={correctScoreDate} />
      <BlogSection />
      <LeagueTableSection />
      <AboutSection />
    </>
  );
}
