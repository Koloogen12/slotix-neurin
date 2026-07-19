import { FormatEditorClient } from "./FormatEditorClient";

export default async function FormatEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <FormatEditorClient id={id} />;
}
