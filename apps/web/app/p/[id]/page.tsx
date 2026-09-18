import { SavedProfile } from "@/components/profile/SavedProfile";

export default async function SavedProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <SavedProfile id={id} />;
}
