import { renderToBuffer } from "@react-pdf/renderer";

import { BriefingPdfDocument } from "@/lib/briefing-pdf-document";
import type { BriefingDocument } from "@/types/domain";

export async function renderBriefingPdfBuffer(
  briefing: Pick<BriefingDocument, "role" | "date" | "generatedAt" | "sections" | "sources">,
  exportedAt: string,
): Promise<Buffer> {
  return renderToBuffer(
    <BriefingPdfDocument briefing={briefing} exportedAt={exportedAt} />,
  );
}
