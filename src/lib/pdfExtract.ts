import * as pdfjsLib from 'pdfjs-dist';

// --- THE FIX ---
// We use unpkg.com because it matches the exact npm version installed.
// We also use 'https' to avoid mixed content errors.
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

export interface ExtractedMemoData {
  subject?: string;
  amount?: number;
  currency?: string;
  vendor?: string;
  body?: string;
}

export async function extractMemoFromPDF(file: File): Promise<ExtractedMemoData> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Load the document
  const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;
  
  let fullText = '';
  
  // 1. Extract text from the first page only
  const page = await pdf.getPage(1);
  const textContent = await page.getTextContent();
  
  // Join text items with spaces
  fullText = textContent.items.map((item: any) => item.str).join(' ');

  // 2. CLEAN UP THE TEXT
  const cleanText = fullText.replace(/\s+/g, ' ').trim();

  // 3. EXTRACT SPECIFIC FIELDS
  const extracted: ExtractedMemoData = {};

  // --- A. SUBJECT / TITLE ---
  const subjectMatch = cleanText.match(/(?:Subject|Re|Title|Topic)\s*[:|-]\s*([^.|_]+)/i);
  if (subjectMatch && subjectMatch[1]) {
    extracted.subject = subjectMatch[1].trim();
  }

  // --- B. VENDOR ---
  const vendorMatch = cleanText.match(/(?:Vendor|Supplier|To)\s*[:|-]\s*([^,.\n]+)/i);
  if (vendorMatch && vendorMatch[1]) {
    const v = vendorMatch[1].trim();
    if (!v.toLowerCase().includes('procurement')) {
      extracted.vendor = v;
    }
  }

  // --- C. AMOUNT & CURRENCY ---
  const moneyMatch = cleanText.match(/(?:Total|Cost|Price|Amount)?\s*[:|-]?\s*([A-Z]{3}|[$€£₦])?\s?(\d{1,3}(?:,\d{3})*(?:\.\d{2})?)/i);
  
  if (moneyMatch) {
    const currencyStr = (moneyMatch[1] || '').toUpperCase();
    if (currencyStr.includes('$') || currencyStr.includes('USD')) extracted.currency = 'USD';
    else if (currencyStr.includes('£') || currencyStr.includes('GBP')) extracted.currency = 'GBP';
    else if (currencyStr.includes('€') || currencyStr.includes('EUR')) extracted.currency = 'EUR';
    else extracted.currency = 'NGN'; 

    const amountStr = moneyMatch[2].replace(/,/g, '');
    extracted.amount = parseFloat(amountStr);
  }

  // --- D. JUSTIFICATION / BODY ---
  const justificationExplicit = cleanText.match(/Justification\s*[:|-]\s*(.*?)(?:Budget|Cost|Sincerely|Conclusion|$)/i);
  
  if (justificationExplicit && justificationExplicit[1]) {
    extracted.body = justificationExplicit[1].trim();
  } else {
    // Fallback: grab text between Subject and Footer
    const splitBySubject = cleanText.split(extracted.subject || 'Subject');
    if (splitBySubject[1]) {
      let bodyRaw = splitBySubject[1];
      const stopWords = ['Sincerely', 'Regards', 'Total Cost', 'Budget', 'Approved By', 'Vendor:'];
      for (const word of stopWords) {
        const index = bodyRaw.indexOf(word);
        if (index > -1) {
          bodyRaw = bodyRaw.substring(0, index);
        }
      }
      extracted.body = bodyRaw.trim().replace(/^[:|-]\s*/, '');
    }
  }

  return extracted;
}