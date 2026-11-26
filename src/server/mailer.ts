import { env } from '@/env';

interface SendOtpEmailParams {
  to: string;
  displayName: string;
  otpCode: string;
}

export async function sendCitizenOtpEmail({ to, displayName, otpCode }: SendOtpEmailParams): Promise<{
  sent: boolean;
  provider: 'resend' | 'dev_log';
}> {
  if (!env.RESEND_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('RESEND_API_KEY belum dikonfigurasi untuk pengiriman OTP produksi.');
    }
    console.info(`[LKI DEV MAILER] OTP untuk ${to} (${displayName}): ${otpCode}`);
    return { sent: true, provider: 'dev_log' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${env.RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: env.EMAIL_FROM,
      to: [to],
      subject: 'Kode Verifikasi Akun Warga — Liga Korupsi Indonesia (LKI)',
      text: `Halo ${displayName},\n\nKode verifikasi OTP Anda adalah: ${otpCode}\nKode berlaku selama 15 menit.\n\nSalam,\nLiga Korupsi Indonesia`,
    }),
  });

  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Gagal mengirim email OTP (${res.status}): ${body.slice(0, 200)}`);
  }

  return { sent: true, provider: 'resend' };
}
