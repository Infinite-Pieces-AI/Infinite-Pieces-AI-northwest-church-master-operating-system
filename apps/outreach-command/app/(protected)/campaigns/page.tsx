import { CampaignCommand } from "@/components/campaign-command";
import { PageHeading } from "@/components/page-heading";

export default function CampaignsPage() {
  return (
    <>
      <PageHeading
        eyebrow="Contextual, local, and consent-aware"
        title="Campaign Command"
        description="Plan geographic and keyword-context campaigns that point people toward useful public pages and voluntary forms—never member-list targeting or inferred religious-belief audiences."
      />
      <CampaignCommand />
    </>
  );
}
