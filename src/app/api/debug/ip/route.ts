import { NextResponse } from 'next/server';

export async function GET() {
  const res = await fetch('https://api.ipify.org?format=json');
  const data = await res.json();
  return NextResponse.json({ ip: data.ip, note: 'This IP is dynamic and will change between deployments/invocations. For stable whitelisting, use Vercel NAT Gateway (Pro) or allow 0.0.0.0/0.' });
}
