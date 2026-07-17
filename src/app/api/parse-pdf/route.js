import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const pdf = require('pdf-parse');
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: "請提供 PDF 檔案" }, { status: 400 });
    }

    // 將 File 轉換成 Buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    // 解析 PDF
    const data = await pdf(buffer);

    return NextResponse.json({ text: data.text });
  } catch (error) {
    console.error("PDF 解析錯誤:", error);
    return NextResponse.json({ error: "解析 PDF 失敗" }, { status: 500 });
  }
}
