import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";

const API_BASE =
  (import.meta.env.VITE_API_BASE as string | undefined)?.replace(/\/$/, "") ||
  "";

const DEFAULT_FORM = {
  BatchNo: "16",
  SubDiv: "11264",
  RefNo: "1741670",
  RU: "U",
  CapCode: "RXQP",
};

export default function App() {
  const [billData, setBillData] = useState<string>("");
  const [billMonth, setBillMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [formValues] = useState(DEFAULT_FORM);

  useEffect(() => {
    fetchBill();
  }, []);

  useEffect(() => {
    if (loading) {
      document.title = "Fetching Khokhar’s Home Bill...";
    } else if (billData) {
      document.title = "Khokhar’s Home Bill";
    } else {
      document.title = "Khokhar’s Home – LESCO";
    }
  }, [loading, billData]);

  const fetchBill = async () => {
    setLoading(true);
    setError("");

    try {
      const formData = new URLSearchParams();
      formData.append("BatchNo", formValues.BatchNo);
      formData.append("SubDiv", formValues.SubDiv);
      formData.append("RefNo", formValues.RefNo);
      formData.append("RU", formValues.RU);
      formData.append("CapCode", formValues.CapCode);

      const response = await fetch(
        `${API_BASE}/api/lesco-proxy?path=Bill.aspx`,
        {
          method: "POST",
          headers: {
            Accept:
              "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8",
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: formData,
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      let htmlContent = await response.text();

      htmlContent = htmlContent
        .replace(/<div id="printPageButton[\s\S]*?<\/div>/gi, "")
        .replace(/<img[^>]*GB_New\.png[^>]*>/gi, "");

      const code = extractBillMonth(htmlContent);
      setBillMonth(code || "");

      setBillData(htmlContent);
    } catch (err) {
      console.error("Error fetching bill:", err);
      setError("Failed to fetch bill.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-3">
          <img src="/lightning.png" width={40} height={40} alt="Logo" />
          <div>
            <h1 className="text-xl font-bold text-gray-800">
              Khokhar’s Home Bill{" "}
              {billMonth && `- ${prettyBillMonth(billMonth)}`}
            </h1>
            <p className="text-sm text-gray-600">
              LESCO – Lahore Electric Supply Company
            </p>
          </div>
        </div>
      </div>

      {/* Bill Content */}
      <div className="max-w-6xl mx-auto px-4 py-8">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
            <p className="mt-4 text-gray-600">Fetching your bill...</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
            {billData ? (
              <div
                className="relative w-full min-h-screen"
                style={{
                  backgroundSize: "cover",
                  backgroundImage:
                    "url(https://www.lesco.gov.pk:36260/Images/GB_New.png)",
                  backgroundPosition: "center",
                  backgroundRepeat: "no-repeat",
                  width: "885px",
                  height: "1248px",
                  margin: "0 auto",
                }}
              >
                <div
                  className="absolute inset-0 w-full h-full"
                  dangerouslySetInnerHTML={{ __html: billData }}
                  style={{ background: "transparent" }}
                />
              </div>
            ) : (
              <div className="text-center py-12">
                <FileText className="w-8 h-8 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Oops.. Abhi bill nai aaya Khokhar Sahab 😎
                </h3>
              </div>
            )}
          </div>
        )}

        {error && (
          <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/** ========== Helpers ========== **/

function extractBillMonth(html: string): string {
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");

    const candidates = Array.from(doc.querySelectorAll("p.ft14 b"));
    for (const b of candidates) {
      const p = b.parentElement;
      const style = (p?.getAttribute("style") || "")
        .replace(/\s+/g, " ")
        .trim();
      const text = (b.textContent || "").trim();
      if (
        /top:\s*138px/i.test(style) &&
        /left:\s*455px/i.test(style) &&
        /width:\s*65px/i.test(style) &&
        /^[A-Z]{3}\s*\d{2}$/.test(text)
      ) {
        return text;
      }
    }
  } catch {}

  const m = html.match(
    /<p[^>]*class=["']ft14["'][^>]*style=["'][^"']*top:\s*138px;[^"']*left:\s*455px;[^"']*width:\s*65px;?[^"']*["'][^>]*>\s*<b>\s*([A-Z]{3}\s*\d{2})\s*<\/b>\s*<\/p>/i
  );
  return m ? m[1].trim() : "";
}

/** Converts "AUG 25" -> "August 2025" */
function prettyBillMonth(code: string): string {
  const monMap: Record<string, string> = {
    JAN: "January",
    FEB: "February",
    MAR: "March",
    APR: "April",
    MAY: "May",
    JUN: "June",
    JUL: "July",
    AUG: "August",
    SEP: "September",
    OCT: "October",
    NOV: "November",
    DEC: "December",
  };

  const cleaned = code.toUpperCase().replace(/\s+/g, " ").trim();
  const parts = cleaned.split(" ");
  if (parts.length < 2) return code;

  const mon = parts[0];
  const yy = parts[1].padStart(2, "0");
  const fullMonth = monMap[mon] || mon;
  const year = 2000 + parseInt(yy, 10);

  return `${fullMonth} ${isNaN(year) ? yy : year}`;
}
