import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";

import type { BriefingDocument, BriefingRole } from "@/types/domain";

const ROLE_TITLES: Record<BriefingRole, string> = {
  investor: "Investor",
  consultant: "Consultant",
  service_company: "Service Company",
  compliance: "Compliance",
  engineer: "Engineer",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#c4c4c4",
    paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    marginBottom: 4,
  },
  meta: {
    fontSize: 9,
    color: "#555",
  },
  section: {
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    color: "#8b4513",
    marginBottom: 4,
  },
  sectionContent: {
    fontSize: 10,
    lineHeight: 1.45,
  },
  sources: {
    marginTop: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e0e0e0",
  },
  sourceItem: {
    fontSize: 8,
    color: "#444",
    marginBottom: 3,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    fontSize: 8,
    color: "#888",
    textAlign: "center",
  },
});

type BriefingPdfDocumentProps = {
  briefing: Pick<BriefingDocument, "role" | "date" | "generatedAt" | "sections" | "sources">;
  exportedAt: string;
};

export function BriefingPdfDocument({ briefing, exportedAt }: BriefingPdfDocumentProps) {
  const roleTitle = ROLE_TITLES[briefing.role] ?? briefing.role;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.title}>PetroSignal · {roleTitle} Briefing</Text>
          <Text style={styles.meta}>
            Briefing date: {briefing.date} · Generated {briefing.generatedAt}
          </Text>
          <Text style={styles.meta}>Exported {exportedAt}</Text>
        </View>

        {briefing.sections.map((section) => (
          <View key={section.label} style={styles.section}>
            <Text style={styles.sectionLabel}>{section.label}</Text>
            <Text style={styles.sectionContent}>{section.content}</Text>
          </View>
        ))}

        {briefing.sources.length > 0 ? (
          <View style={styles.sources}>
            <Text style={styles.sectionLabel}>Sources</Text>
            {briefing.sources.map((source) => (
              <Text key={source.url} style={styles.sourceItem}>
                {source.title ? `${source.title} — ` : ""}
                {source.url}
              </Text>
            ))}
          </View>
        ) : null}

        <Text style={styles.footer}>PetroSignal intelligence briefing · Confidential</Text>
      </Page>
    </Document>
  );
}
