import { ImageResponse } from 'next/og';
import { queryCaseDetailBySlugOrId } from '@/server/queries';
import { formatRupiah, LEGAL_STATUS_META, LegalStatusValue } from '@/lib/formatters';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function CaseOgImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const detail = await queryCaseDetailBySlugOrId(slug);

  const title = detail?.case_title || 'Berkas Perkara — Liga Korupsi Indonesia';
  const status =
    (detail && LEGAL_STATUS_META[detail.current_legal_status as LegalStatusValue]?.label) ||
    'Arsip Transparansi';
  const amount = detail
    ? detail.display_loss_amount > 0
      ? formatRupiah(detail.display_loss_amount, { compact: true })
      : formatRupiah(detail.display_bribe_amount, { compact: true })
    : '';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          backgroundColor: '#FAF7EE',
          padding: '56px',
          border: '12px solid #1C1917',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 28, fontWeight: 800, color: '#B91C1C' }}>
            LIGA KORUPSI INDONESIA (LKI)
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: 700,
              color: '#1C1917',
              backgroundColor: '#FDE047',
              padding: '8px 20px',
              borderRadius: 8,
            }}
          >
            {status}
          </div>
        </div>
        <div style={{ fontSize: 48, fontWeight: 800, color: '#1C1917', lineHeight: 1.2 }}>
          {title.slice(0, 110)}
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
          <div style={{ fontSize: 38, fontWeight: 800, color: '#B91C1C' }}>{amount}</div>
          <div style={{ fontSize: 20, color: '#57534E' }}>
            Patuh Asas Praduga Tak Bersalah (Pasal 8 ayat 1 UU 48/2009)
          </div>
        </div>
      </div>
    ),
    size
  );
}
