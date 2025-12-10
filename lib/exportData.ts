/**
 * Export Data Utilities
 * For exporting exam results to CSV/Excel formats
 */

interface ExportSubmission {
  studentName: string;
  studentId: string;
  studentNumber?: string;
  classroom?: string;
  score: number;
  totalPoints: number;
  percentage: number;
  examTitle: string;
  submittedAt: string;
}

interface ExportStatistics {
  n: number;
  mean: number;
  median: number;
  mode: number[];
  min: number;
  max: number;
  range: number;
  variance: number;
  standardDeviation: number;
  skewness: number;
  kurtosis: number;
  q1: number;
  q2: number;
  q3: number;
}

// Convert to CSV string
function toCSV(headers: string[], rows: string[][]): string {
  const escapeCSV = (value: string) => {
    if (value.includes(",") || value.includes('"') || value.includes("\n")) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  };

  const headerLine = headers.map(escapeCSV).join(",");
  const dataLines = rows.map(row => row.map(escapeCSV).join(","));
  
  // Add BOM for Excel to recognize UTF-8
  return "\uFEFF" + [headerLine, ...dataLines].join("\n");
}

// Download file utility
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// Format date for export
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// Export submissions to CSV
export function exportSubmissionsToCSV(
  submissions: ExportSubmission[],
  filename = "exam_results"
) {
  const headers = [
    "ลำดับ",
    "เลขที่",
    "ชื่อ-นามสกุล",
    "ห้อง",
    "รหัสนักเรียน",
    "ชุดข้อสอบ",
    "คะแนนที่ได้",
    "คะแนนเต็ม",
    "เปอร์เซ็นต์",
    "ผลสอบ",
    "วันที่",
  ];

  const rows = submissions.map((sub, index) => [
    (index + 1).toString(),
    sub.studentNumber || "-",
    sub.studentName,
    sub.classroom || "-",
    sub.studentId,
    sub.examTitle,
    sub.score.toString(),
    sub.totalPoints.toString(),
    sub.percentage.toString() + "%",
    sub.percentage >= 60 ? "ผ่าน" : "ไม่ผ่าน",
    formatDate(sub.submittedAt),
  ]);

  const csv = toCSV(headers, rows);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `${filename}_${timestamp}.csv`, "text/csv;charset=utf-8");
}

// Export statistics summary to CSV
export function exportStatisticsToCSV(
  stats: ExportStatistics,
  examTitle: string,
  filename = "statistics"
) {
  const headers = ["สถิติ", "ค่า"];
  const rows = [
    ["ชุดข้อสอบ", examTitle],
    ["จำนวนผู้สอบ (N)", stats.n.toString()],
    ["ค่าเฉลี่ย (Mean)", stats.mean.toFixed(2)],
    ["มัธยฐาน (Median)", stats.median.toFixed(2)],
    ["ฐานนิยม (Mode)", stats.mode.join(", ") || "-"],
    ["ค่าต่ำสุด (Min)", stats.min.toFixed(2)],
    ["ค่าสูงสุด (Max)", stats.max.toFixed(2)],
    ["พิสัย (Range)", stats.range.toFixed(2)],
    ["ความแปรปรวน (Variance)", stats.variance.toFixed(4)],
    ["ส่วนเบี่ยงเบนมาตรฐาน (SD)", stats.standardDeviation.toFixed(4)],
    ["ความเบ้ (Skewness)", stats.skewness.toFixed(4)],
    ["ความโด่ง (Kurtosis)", stats.kurtosis.toFixed(4)],
    ["Quartile 1 (Q1)", stats.q1.toFixed(2)],
    ["Quartile 2 (Q2)", stats.q2.toFixed(2)],
    ["Quartile 3 (Q3)", stats.q3.toFixed(2)],
  ];

  const csv = toCSV(headers, rows);
  const timestamp = new Date().toISOString().slice(0, 10);
  downloadFile(csv, `${filename}_${timestamp}.csv`, "text/csv;charset=utf-8");
}

// Export complete research report
export function exportResearchReport(
  submissions: ExportSubmission[],
  stats: ExportStatistics,
  examTitle: string,
  filename = "research_report"
) {
  const timestamp = new Date().toISOString().slice(0, 10);
  
  // Build comprehensive report
  let content = "\uFEFF"; // BOM
  
  // Title
  content += `รายงานผลการสอบเพื่อการวิจัย\n`;
  content += `ชุดข้อสอบ: ${examTitle}\n`;
  content += `วันที่ส่งออก: ${new Date().toLocaleString("th-TH")}\n`;
  content += `\n`;
  
  // Statistics section
  content += `=== สถิติเชิงพรรณนา ===\n`;
  content += `จำนวนผู้สอบ (N),${stats.n}\n`;
  content += `ค่าเฉลี่ย (Mean),${stats.mean.toFixed(2)}\n`;
  content += `มัธยฐาน (Median),${stats.median.toFixed(2)}\n`;
  content += `ฐานนิยม (Mode),${stats.mode.join("; ") || "-"}\n`;
  content += `ค่าต่ำสุด (Min),${stats.min.toFixed(2)}\n`;
  content += `ค่าสูงสุด (Max),${stats.max.toFixed(2)}\n`;
  content += `พิสัย (Range),${stats.range.toFixed(2)}\n`;
  content += `ส่วนเบี่ยงเบนมาตรฐาน (SD),${stats.standardDeviation.toFixed(4)}\n`;
  content += `ความแปรปรวน (Variance),${stats.variance.toFixed(4)}\n`;
  content += `ความเบ้ (Skewness),${stats.skewness.toFixed(4)}\n`;
  content += `ความโด่ง (Kurtosis),${stats.kurtosis.toFixed(4)}\n`;
  content += `Q1 (25th percentile),${stats.q1.toFixed(2)}\n`;
  content += `Q2 (50th percentile),${stats.q2.toFixed(2)}\n`;
  content += `Q3 (75th percentile),${stats.q3.toFixed(2)}\n`;
  content += `\n`;
  
  // Pass/Fail summary
  const passCount = submissions.filter(s => s.percentage >= 60).length;
  const passRate = submissions.length > 0 ? ((passCount / submissions.length) * 100).toFixed(2) : "0";
  content += `=== สรุปผลสอบ ===\n`;
  content += `จำนวนผ่าน,${passCount}\n`;
  content += `จำนวนไม่ผ่าน,${submissions.length - passCount}\n`;
  content += `อัตราการผ่าน,${passRate}%\n`;
  content += `\n`;
  
  // Raw data
  content += `=== ข้อมูลดิบ ===\n`;
  content += `ลำดับ,เลขที่,ชื่อ-นามสกุล,ห้อง,รหัสนักเรียน,คะแนน,คะแนนเต็ม,เปอร์เซ็นต์,ผลสอบ,วันที่\n`;
  
  submissions.forEach((sub, index) => {
    content += `${index + 1},${sub.studentNumber || "-"},${sub.studentName},${sub.classroom || "-"},${sub.studentId},${sub.score},${sub.totalPoints},${sub.percentage}%,${sub.percentage >= 60 ? "ผ่าน" : "ไม่ผ่าน"},"${formatDate(sub.submittedAt)}"\n`;
  });
  
  downloadFile(content, `${filename}_${timestamp}.csv`, "text/csv;charset=utf-8");
}
