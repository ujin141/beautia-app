// Swagger API 문서 엔드포인트

import { NextResponse } from 'next/server';
import { swaggerSpec } from '@/lib/swagger';

export async function GET() {
  return NextResponse.json(swaggerSpec);
}
