import { NextResponse } from 'next/server';

// Mock database or condition to check if an icon has been set
const iconMapping = {
  activeFiles: '/icons/myIcon.svg', // You can map this to any identifier
  default: null,
};

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const buttonId = searchParams.get('buttonId');

  // Check if an icon exists for the provided button ID
  const icon = iconMapping[buttonId as keyof typeof iconMapping] || iconMapping.default;

  return NextResponse.json({ icon });
}