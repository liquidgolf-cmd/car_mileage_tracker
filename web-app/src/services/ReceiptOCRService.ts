import { createWorker } from 'tesseract.js';
import { ReceiptExtractedData } from '../types';

export class ReceiptOCRService {
  private static workerPromise: Promise<any> | null = null;

  private static async getWorker() {
    if (!this.workerPromise) {
      this.workerPromise = createWorker('eng');
      const worker = await this.workerPromise;
      await worker.load();
      await worker.loadLanguage('eng');
      await worker.initialize('eng');
    }
    return this.workerPromise;
  }

  static async scanReceipt(imageData: string): Promise<ReceiptExtractedData> {
    try {
      const worker = await this.getWorker();
      
      // Perform OCR
      const { data: { text, confidence } } = await worker.recognize(imageData);
      
      // Extract structured data from text
      const extractedData: ReceiptExtractedData = {
        amount: this.extractAmount(text),
        date: this.extractDate(text),
        merchant: this.extractMerchant(text),
        items: this.extractItems(text),
        confidence: confidence / 100, // Convert to 0-1 scale
        rawText: text
      };

      return extractedData;
    } catch (error) {
      console.error('OCR error:', error);
      return {
        confidence: 0,
        rawText: '',
        amount: undefined,
        date: undefined,
        merchant: undefined,
        items: undefined
      };
    }
  }

  private static extractAmount(text: string): number | undefined {
    // Look for patterns like $XX.XX, TOTAL: $XX.XX, etc.
    const patterns = [
      /total[:\s]+[$]?([\d,]+\.?\d{0,2})/i,
      /amount[:\s]+[$]?([\d,]+\.?\d{0,2})/i,
      /[$]([\d,]+\.?\d{0,2})\s*$/m,
      /[$]([\d,]+\.?\d{2})/g
    ];

    for (const pattern of patterns) {
      const matches = text.match(pattern);
      if (matches && matches[1]) {
        const amount = parseFloat(matches[1].replace(/,/g, ''));
        if (!isNaN(amount) && amount > 0) {
          // Take the largest amount found (likely the total)
          return amount;
        }
      }
    }

    // Try to find all dollar amounts and return the largest
    const allAmounts = [...text.matchAll(/[$]([\d,]+\.?\d{2})/g)];
    if (allAmounts.length > 0) {
      const amounts = allAmounts.map(m => parseFloat(m[1].replace(/,/g, ''))).filter(a => !isNaN(a) && a > 0);
      if (amounts.length > 0) {
        return Math.max(...amounts);
      }
    }

    return undefined;
  }

  private static extractDate(text: string): Date | undefined {
    // Common date patterns
    const patterns = [
      /(\d{1,2})\/(\d{1,2})\/(\d{4})/,
      /(\d{1,2})-(\d{1,2})-(\d{4})/,
      /(\d{4})-(\d{1,2})-(\d{1,2})/,
      /([A-Z][a-z]+)\s+(\d{1,2}),\s+(\d{4})/,
      /(\d{1,2})\s+([A-Z][a-z]+)\s+(\d{4})/
    ];

    const monthNames = ['january', 'february', 'march', 'april', 'may', 'june', 
                       'july', 'august', 'september', 'october', 'november', 'december'];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        try {
          let date: Date | undefined;
          
          if (pattern === patterns[0] || pattern === patterns[1]) {
            // MM/DD/YYYY or MM-DD-YYYY
            const month = parseInt(match[1]) - 1;
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            date = new Date(year, month, day);
          } else if (pattern === patterns[2]) {
            // YYYY-MM-DD
            const year = parseInt(match[1]);
            const month = parseInt(match[2]) - 1;
            const day = parseInt(match[3]);
            date = new Date(year, month, day);
          } else if (pattern === patterns[3]) {
            // Month DD, YYYY
            const month = monthNames.indexOf(match[1].toLowerCase());
            const day = parseInt(match[2]);
            const year = parseInt(match[3]);
            if (month >= 0) {
              date = new Date(year, month, day);
            }
          } else if (pattern === patterns[4]) {
            // DD Month YYYY
            const day = parseInt(match[1]);
            const month = monthNames.indexOf(match[2].toLowerCase());
            const year = parseInt(match[3]);
            if (month >= 0) {
              date = new Date(year, month, day);
            }
          }

          if (date && !isNaN(date.getTime())) {
            // Validate date is reasonable (not too far in past/future)
            const now = new Date();
            const fiveYearsAgo = new Date();
            fiveYearsAgo.setFullYear(now.getFullYear() - 5);
            const oneYearFromNow = new Date();
            oneYearFromNow.setFullYear(now.getFullYear() + 1);

            if (date >= fiveYearsAgo && date <= oneYearFromNow) {
              return date;
            }
          }
        } catch (e) {
          // Continue to next pattern
        }
      }
    }

    // Fallback: use current date if no date found
    return new Date();
  }

  private static extractMerchant(text: string): string | undefined {
    // Usually merchant name is at the top of receipt
    const lines = text.split('\n').filter(line => line.trim().length > 0);
    
    // Look for first line that looks like a business name (not a date, not a number, not too long)
    for (let i = 0; i < Math.min(5, lines.length); i++) {
      const line = lines[i].trim();
      // Skip if it's clearly a date, amount, or address
      if (!/^\d+/.test(line) && // Doesn't start with number
          !/\$/.test(line) && // Doesn't contain dollar sign
          !/\d{1,2}\/\d{1,2}\/\d{4}/.test(line) && // Doesn't contain date
          line.length > 2 && 
          line.length < 50) {
        return line;
      }
    }

    return undefined;
  }

  private static extractItems(text: string): string[] | undefined {
    // Extract lines that might be items (have prices)
    const lines = text.split('\n');
    const items: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      // Look for lines with dollar amounts that might be items
      if (trimmed.includes('$') && trimmed.length > 5 && trimmed.length < 60) {
        // Remove the price part
        const withoutPrice = trimmed.replace(/\s*[$][\d,]+\.?\d{0,2}\s*$/, '').trim();
        if (withoutPrice.length > 0) {
          items.push(withoutPrice);
        }
      }
    }

    return items.length > 0 ? items : undefined;
  }
}

