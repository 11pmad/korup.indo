import { NextRequest, NextResponse } from 'next/server';
import { handleLegacyApi } from '@/server/v1-compat';

async function safeInvoke(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  try {
    const { path } = await context.params;
    return await handleLegacyApi(req, path);
  } catch (err) {
    console.error('[LKI API] Unhandled error in legacy compat route:', err);
    return NextResponse.json(
      { error: 'Terjadi gangguan internal pada server API.' },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return safeInvoke(req, context);
}

export async function POST(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return safeInvoke(req, context);
}

export async function PUT(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return safeInvoke(req, context);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return safeInvoke(req, context);
}

export async function DELETE(req: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  return safeInvoke(req, context);
}
