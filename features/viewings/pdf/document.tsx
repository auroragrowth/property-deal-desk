import {
  Document,
  Image,
  Link,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";

// Brand palette mirrored from globals.css (literal hex — react-pdf
// doesn't read CSS custom properties at render time).
const COLOR = {
  bgPage: "#f4ecd8",
  bgSurface: "#fdfaf3",
  bgStrong: "#5b2330",
  textPrimary: "#1a1410",
  textSecondary: "#6b5e4d",
  textTertiary: "#75655a",
  accent: "#b8901f",
  border: "#d9c8a3",
  pass: "#2d4a36",
  fail: "#5b2330",
};

const styles = StyleSheet.create({
  page: {
    padding: 36,
    fontSize: 10,
    color: COLOR.textPrimary,
    backgroundColor: COLOR.bgPage,
    fontFamily: "Helvetica",
  },
  brand: {
    fontSize: 22,
    color: COLOR.textPrimary,
    fontFamily: "Times-Roman",
  },
  brandAccent: { color: COLOR.accent, fontStyle: "italic" },
  eyebrow: {
    fontSize: 8,
    color: COLOR.textTertiary,
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  h1: {
    fontSize: 26,
    fontFamily: "Times-Roman",
    color: COLOR.textPrimary,
    marginBottom: 4,
  },
  h2: {
    fontSize: 16,
    fontFamily: "Times-Roman",
    color: COLOR.textPrimary,
    marginBottom: 8,
  },
  h3: {
    fontSize: 12,
    fontFamily: "Times-Roman",
    color: COLOR.textPrimary,
    marginBottom: 4,
  },
  meta: { color: COLOR.textTertiary, fontSize: 9 },
  link: { color: COLOR.accent, textDecoration: "underline" },
  divider: {
    borderBottomWidth: 0.5,
    borderBottomColor: COLOR.border,
    marginVertical: 14,
  },
  card: {
    backgroundColor: COLOR.bgSurface,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    borderRadius: 6,
    padding: 12,
    marginBottom: 10,
  },
  kpiGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 10,
  },
  kpi: {
    width: "32%",
    padding: 10,
    backgroundColor: COLOR.bgSurface,
    borderWidth: 0.5,
    borderColor: COLOR.border,
    borderRadius: 6,
  },
  kpiLabel: {
    fontSize: 7,
    letterSpacing: 1.5,
    color: COLOR.textTertiary,
    textTransform: "uppercase",
  },
  kpiValue: {
    fontSize: 16,
    fontFamily: "Times-Roman",
    marginTop: 4,
    color: COLOR.textPrimary,
  },
  pass: { color: COLOR.pass },
  fail: { color: COLOR.fail },
  photoGrid: {
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 6,
  },
  photo: {
    width: 120,
    height: 120,
    objectFit: "cover",
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 36,
    right: 36,
    paddingTop: 8,
    borderTopWidth: 0.5,
    borderTopColor: COLOR.border,
    color: COLOR.textTertiary,
    fontSize: 8,
    display: "flex",
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export type ViewingPdfData = {
  generatedAtIso: string;
  viewing: {
    visitedAt: string | null;
    propertyAddress: string | null;
    propertyPostcode: string | null;
    propertyPricePence: number | null;
    propertyBedrooms: number | null;
    propertyRentPcmPence: number | null;
    propertyUrl: string | null;
    overallNotes: string | null;
  };
  rooms: {
    id: string;
    name: string;
    notes: string | null;
    photos: { id: string; signedUrl: string }[];
  }[];
  deal: {
    pass: boolean | null;
    grossYield: number | null;
    netYield: number | null;
    grossRoce: number | null;
    netRoce: number | null;
    moneyLeftIn: number | null;
    allMoneyOutOffer: number | null;
    monthlyCashflow: number | null;
    monthlyMortgage: number | null;
    stampDuty: number | null;
    refinanceBudget: number | null;
    passReasons: string[];
    failReasons: string[];
  } | null;
};

const fmtGbp = (pence: number | null | undefined) =>
  pence == null
    ? "—"
    : `£${Math.round(pence / 100).toLocaleString("en-GB")}`;

const fmtPct = (decimal: number | null | undefined, digits = 1) =>
  decimal == null ? "—" : `${(decimal * 100).toFixed(digits)}%`;

const fmtDate = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "—";

const fmtPostcode = (pc: string | null) => {
  if (!pc) return "";
  const u = pc.replace(/\s+/g, "").toUpperCase();
  if (u.length <= 4) return u;
  return `${u.slice(0, -3)} ${u.slice(-3)}`;
};

export function ViewingPdf({ data }: { data: ViewingPdfData }) {
  const { viewing, rooms, deal } = data;
  const generatedAt = fmtDate(data.generatedAtIso);

  return (
    <Document
      title={`Viewing — ${viewing.propertyAddress ?? "Untitled"}`}
      author="DealDesk"
    >
      {/* ── Cover ── */}
      <Page size="A4" style={styles.page}>
        <View
          style={{
            display: "flex",
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <Text style={styles.brand}>
            Deal<Text style={styles.brandAccent}>Desk</Text>
          </Text>
          <Text style={styles.meta}>Generated {generatedAt}</Text>
        </View>

        <View style={{ marginTop: 60 }}>
          <Text style={styles.eyebrow}>Property viewing</Text>
          <Text style={styles.h1}>
            {viewing.propertyAddress ?? "Untitled viewing"}
          </Text>
          <Text style={styles.meta}>
            {fmtPostcode(viewing.propertyPostcode)}
            {viewing.propertyBedrooms
              ? ` · ${viewing.propertyBedrooms} bed`
              : ""}
          </Text>
        </View>

        <View style={[styles.card, { marginTop: 30 }]}>
          <View style={{ display: "flex", flexDirection: "row", gap: 24 }}>
            <Field label="Asking" value={fmtGbp(viewing.propertyPricePence)} />
            <Field
              label="Expected rent"
              value={
                viewing.propertyRentPcmPence
                  ? `${fmtGbp(viewing.propertyRentPcmPence)}/mo`
                  : "—"
              }
            />
            <Field label="Visited" value={fmtDate(viewing.visitedAt)} />
          </View>
          {viewing.propertyUrl && (
            <Link src={viewing.propertyUrl} style={[styles.link, { marginTop: 10 }]}>
              View original listing →
            </Link>
          )}
        </View>

        {viewing.overallNotes && (
          <View style={[styles.card, { marginTop: 8 }]}>
            <Text style={styles.h3}>Overall impressions</Text>
            <Text style={{ marginTop: 4, lineHeight: 1.4 }}>
              {viewing.overallNotes}
            </Text>
          </View>
        )}

        <PageFooter />
      </Page>

      {/* ── Numbers ── */}
      {deal && (
        <Page size="A4" style={styles.page}>
          <Text style={styles.eyebrow}>Mastering the numbers</Text>
          <Text style={styles.h1}>Deal analysis</Text>
          <Text style={[styles.meta, { marginBottom: 16 }]}>
            {viewing.propertyAddress ?? ""}
          </Text>

          <View
            style={[
              styles.card,
              {
                borderLeftWidth: 3,
                borderLeftColor: deal.pass ? COLOR.pass : COLOR.fail,
              },
            ]}
          >
            <Text style={styles.eyebrow}>Verdict</Text>
            <Text
              style={[
                styles.h2,
                deal.pass ? styles.pass : styles.fail,
                { marginTop: 4 },
              ]}
            >
              {deal.pass ? "Pass" : "Fail"}
            </Text>
          </View>

          <View style={styles.kpiGrid}>
            <Kpi label="Gross yield" value={fmtPct(deal.grossYield)} />
            <Kpi label="Net yield" value={fmtPct(deal.netYield)} />
            <Kpi label="Gross ROCE" value={fmtPct(deal.grossRoce)} />
            <Kpi label="Net ROCE" value={fmtPct(deal.netRoce)} />
            <Kpi
              label="Monthly cashflow"
              value={fmtGbp(deal.monthlyCashflow)}
              tone={
                (deal.monthlyCashflow ?? 0) >= 0 ? "pass" : "fail"
              }
            />
            <Kpi label="Money left in" value={fmtGbp(deal.moneyLeftIn)} />
            <Kpi
              label="All-money-out offer"
              value={fmtGbp(deal.allMoneyOutOffer)}
            />
            <Kpi
              label="Refinance budget"
              value={fmtGbp(deal.refinanceBudget)}
            />
            <Kpi label="Stamp duty (BTL)" value={fmtGbp(deal.stampDuty)} />
          </View>

          {(deal.passReasons.length > 0 || deal.failReasons.length > 0) && (
            <View style={styles.card}>
              <Text style={styles.h3}>Reasons</Text>
              {deal.passReasons.map((r, i) => (
                <Text key={`p-${i}`} style={{ marginTop: 2 }}>
                  ✓ {r}
                </Text>
              ))}
              {deal.failReasons.map((r, i) => (
                <Text key={`f-${i}`} style={[styles.fail, { marginTop: 2 }]}>
                  ✗ {r}
                </Text>
              ))}
            </View>
          )}

          <PageFooter />
        </Page>
      )}

      {/* ── Rooms + photos ── */}
      {rooms.length > 0 && (
        <Page size="A4" style={styles.page} wrap>
          <Text style={styles.eyebrow}>Rooms</Text>
          <Text style={styles.h1}>Room-by-room</Text>
          <View style={{ marginTop: 12 }}>
            {rooms.map((r) => (
              <View key={r.id} style={styles.card} wrap={false}>
                <Text style={styles.h3}>{r.name}</Text>
                {r.notes && (
                  <Text style={{ marginTop: 2, lineHeight: 1.4 }}>
                    {r.notes}
                  </Text>
                )}
                {r.photos.length > 0 && (
                  <View style={styles.photoGrid}>
                    {r.photos.map((p) => (
                      // eslint-disable-next-line jsx-a11y/alt-text
                      <Image
                        key={p.id}
                        src={p.signedUrl}
                        style={styles.photo}
                      />
                    ))}
                  </View>
                )}
              </View>
            ))}
          </View>
          <PageFooter />
        </Page>
      )}
    </Document>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, { fontSize: 14 }]}>{value}</Text>
    </View>
  );
}

function Kpi({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "pass" | "fail";
}) {
  const toneStyle =
    tone === "pass" ? styles.pass : tone === "fail" ? styles.fail : {};
  return (
    <View style={styles.kpi}>
      <Text style={styles.kpiLabel}>{label}</Text>
      <Text style={[styles.kpiValue, toneStyle]}>{value}</Text>
    </View>
  );
}

function PageFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text>
        Deal<Text style={styles.brandAccent}>Desk</Text> — UK property
        investor toolkit
      </Text>
      <Text>Indicative analysis only · Not financial advice</Text>
    </View>
  );
}
