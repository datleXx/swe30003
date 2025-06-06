import CampaignForm from "../_components/CampaignForm";

interface EditCampaignPageProps {
  params: {
    id: string;
  };
}

export default function EditCampaignPage({ params }: EditCampaignPageProps) {
  return <CampaignForm campaignId={params.id} />;
}
