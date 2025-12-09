/**
 * CSV Parser for bulk importing exam questions
 * 
 * Expected CSV format:
 * text,type,points,options,correctAnswers,subQuestions
 * 
 * - text: Question text (required)
 * - type: CHOICE | SHORT | CODEMSA (required)
 * - points: Number (default: 1)
 * - options: For CHOICE type, pipe-separated values (e.g., "A|B|C|D")
 * - correctAnswers: Pipe-separated values (e.g., "A" or "A|B")
 * - subQuestions: For CODEMSA type, pipe-separated values
 */

export interface ParsedQuestion {
  text: string;
  type: 'CHOICE' | 'SHORT' | 'CODEMSA';
  points: number;
  options: string[];
  correctAnswers: string[];
  subQuestions: string[];
}

export interface ParseResult {
  success: boolean;
  questions: ParsedQuestion[];
  errors: { row: number; message: string }[];
}

export function parseCSV(csvContent: string): ParseResult {
  const lines = csvContent
    .split('\n')
    .map(line => line.trim())
    .filter(line => line.length > 0);

  if (lines.length < 2) {
    return {
      success: false,
      questions: [],
      errors: [{ row: 0, message: 'ไฟล์ CSV ต้องมีหัวตารางและข้อมูลอย่างน้อย 1 แถว' }],
    };
  }

  const headers = parseCSVLine(lines[0]).map(h => h.toLowerCase().trim());
  const requiredHeaders = ['text', 'type'];
  const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));

  if (missingHeaders.length > 0) {
    return {
      success: false,
      questions: [],
      errors: [{ row: 0, message: `หัวตารางขาด: ${missingHeaders.join(', ')}` }],
    };
  }

  const questions: ParsedQuestion[] = [];
  const errors: { row: number; message: string }[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    const rowData: Record<string, string> = {};

    headers.forEach((header, index) => {
      rowData[header] = values[index] || '';
    });

    // Validate required fields
    if (!rowData.text?.trim()) {
      errors.push({ row: i + 1, message: 'ข้อความคำถามจำเป็นต้องมี' });
      continue;
    }

    const type = rowData.type?.toUpperCase().trim();
    if (!['CHOICE', 'SHORT', 'CODEMSA'].includes(type)) {
      errors.push({ row: i + 1, message: `ประเภทคำถามไม่ถูกต้อง: ${type}` });
      continue;
    }

    const points = parseInt(rowData.points || '1', 10) || 1;
    const options = rowData.options ? rowData.options.split('|').map(o => o.trim()) : [];
    const correctAnswers = rowData.correctanswers 
      ? rowData.correctanswers.split('|').map(a => a.trim()) 
      : [];
    const subQuestions = rowData.subquestions 
      ? rowData.subquestions.split('|').map(q => q.trim()) 
      : [];

    // Validate CHOICE has options
    if (type === 'CHOICE' && options.length < 2) {
      errors.push({ row: i + 1, message: 'คำถามแบบเลือกต้องมีตัวเลือกอย่างน้อย 2 ตัว' });
      continue;
    }

    // Validate CODEMSA has subQuestions
    if (type === 'CODEMSA' && subQuestions.length === 0) {
      errors.push({ row: i + 1, message: 'คำถามแบบ CODEMSA ต้องมีคำถามย่อย' });
      continue;
    }

    questions.push({
      text: rowData.text.trim(),
      type: type as 'CHOICE' | 'SHORT' | 'CODEMSA',
      points,
      options,
      correctAnswers,
      subQuestions,
    });
  }

  return {
    success: errors.length === 0,
    questions,
    errors,
  };
}

// Parse CSV line handling quoted values
function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      current += '"';
      i++; // Skip next quote
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

// Generate sample CSV content for download
export function generateSampleCSV(): string {
  const BOM = '\uFEFF';
  const headers = 'text,type,points,options,correctAnswers,subQuestions';
  const samples = [
    '"ข้อใดเป็นภาษาโปรแกรมมิ่ง?",CHOICE,1,"Python|Microsoft Word|Google Chrome|Facebook",Python,',
    '"จงเขียนโค้ด Hello World",SHORT,2,,,',
    '"print(1+2)",CODEMSA,3,,,ผลลัพธ์คือ|ประเภทข้อมูลคือ',
  ];
  
  return BOM + [headers, ...samples].join('\n');
}
