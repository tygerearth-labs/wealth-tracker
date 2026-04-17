import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth();
    if (!userId) return userId;

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    const fileName = file.name.toLowerCase();

    // Check file type
    if (!fileName.endsWith('.xlsx') && !fileName.endsWith('.xls') && !fileName.endsWith('.csv')) {
      if (fileName.endsWith('.pdf')) {
        return NextResponse.json(
          { error: 'PDF import not yet supported, please use Excel (.xlsx, .xls, .csv)' },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'Unsupported file format. Please upload an Excel file (.xlsx, .xls, .csv)' },
        { status: 400 }
      );
    }

    // Read file buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Parse Excel/CSV file
    const workbook = XLSX.read(buffer, { type: 'buffer' });

    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return NextResponse.json(
        { error: 'No sheets found in the file' },
        { status: 400 }
      );
    }

    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const rawData = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
      defval: '',
    });

    // Get column names from the first row
    const columns = rawData.length > 0 ? Object.keys(rawData[0]) : [];

    // Clean up data: convert empty strings to null where appropriate
    const data = rawData.map((row) => {
      const cleanedRow: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row)) {
        if (value === '') {
          cleanedRow[key] = null;
        } else {
          cleanedRow[key] = value;
        }
      }
      return cleanedRow;
    });

    return NextResponse.json({
      success: true,
      data,
      columns,
      rowCount: data.length,
    });
  } catch (error) {
    console.error('Import POST error:', error);
    return NextResponse.json(
      { error: 'Failed to parse file' },
      { status: 500 }
    );
  }
}
