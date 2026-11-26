export interface CanonicalProvince {
  id: string;
  name: string;
  island_cluster: string;
  bps_code: string;
  aliases: string[];
}

export const CANONICAL_PROVINCES: CanonicalProvince[] = [
  { id: 'nasional', name: 'Nasional / Pusat', island_cluster: 'Nasional', bps_code: '00', aliases: ['pusat', 'nasional', 'pemerintah pusat'] },
  { id: 'aceh', name: 'Aceh', island_cluster: 'Sumatera', bps_code: '11', aliases: ['nanggroe aceh darussalam', 'nad'] },
  { id: 'sumut', name: 'Sumatera Utara', island_cluster: 'Sumatera', bps_code: '12', aliases: ['sumut'] },
  { id: 'sumbar', name: 'Sumatera Barat', island_cluster: 'Sumatera', bps_code: '13', aliases: ['sumbar'] },
  { id: 'riau', name: 'Riau', island_cluster: 'Sumatera', bps_code: '14', aliases: [] },
  { id: 'jambi', name: 'Jambi', island_cluster: 'Sumatera', bps_code: '15', aliases: [] },
  { id: 'sumsel', name: 'Sumatera Selatan', island_cluster: 'Sumatera', bps_code: '16', aliases: ['sumsel'] },
  { id: 'bengkulu', name: 'Bengkulu', island_cluster: 'Sumatera', bps_code: '17', aliases: [] },
  { id: 'lampung', name: 'Lampung', island_cluster: 'Sumatera', bps_code: '18', aliases: [] },
  { id: 'babel', name: 'Kepulauan Bangka Belitung', island_cluster: 'Sumatera', bps_code: '19', aliases: ['bangka belitung', 'babel'] },
  { id: 'kepri', name: 'Kepulauan Riau', island_cluster: 'Sumatera', bps_code: '21', aliases: ['kepri'] },
  { id: 'dki-jakarta', name: 'DKI Jakarta', island_cluster: 'Jawa', bps_code: '31', aliases: ['jakarta', 'daerah khusus ibukota jakarta'] },
  { id: 'jabar', name: 'Jawa Barat', island_cluster: 'Jawa', bps_code: '32', aliases: ['jabar'] },
  { id: 'jateng', name: 'Jawa Tengah', island_cluster: 'Jawa', bps_code: '33', aliases: ['jateng'] },
  { id: 'diy', name: 'DI Yogyakarta', island_cluster: 'Jawa', bps_code: '34', aliases: ['daerah istimewa yogyakarta', 'yogyakarta', 'jogja'] },
  { id: 'jatim', name: 'Jawa Timur', island_cluster: 'Jawa', bps_code: '35', aliases: ['jatim'] },
  { id: 'banten', name: 'Banten', island_cluster: 'Jawa', bps_code: '36', aliases: [] },
  { id: 'bali', name: 'Bali', island_cluster: 'Bali & Nusa Tenggara', bps_code: '51', aliases: [] },
  { id: 'ntb', name: 'Nusa Tenggara Barat', island_cluster: 'Bali & Nusa Tenggara', bps_code: '52', aliases: ['ntb'] },
  { id: 'ntt', name: 'Nusa Tenggara Timur', island_cluster: 'Bali & Nusa Tenggara', bps_code: '53', aliases: ['ntt'] },
  { id: 'kalbar', name: 'Kalimantan Barat', island_cluster: 'Kalimantan', bps_code: '61', aliases: ['kalbar'] },
  { id: 'kalteng', name: 'Kalimantan Tengah', island_cluster: 'Kalimantan', bps_code: '62', aliases: ['kalteng'] },
  { id: 'kalsel', name: 'Kalimantan Selatan', island_cluster: 'Kalimantan', bps_code: '63', aliases: ['kalsel'] },
  { id: 'kaltim', name: 'Kalimantan Timur', island_cluster: 'Kalimantan', bps_code: '64', aliases: ['kaltim'] },
  { id: 'kaltara', name: 'Kalimantan Utara', island_cluster: 'Kalimantan', bps_code: '65', aliases: ['kaltara'] },
  { id: 'sulut', name: 'Sulawesi Utara', island_cluster: 'Sulawesi', bps_code: '71', aliases: ['sulut'] },
  { id: 'sulteng', name: 'Sulawesi Tengah', island_cluster: 'Sulawesi', bps_code: '72', aliases: ['sulteng'] },
  { id: 'sulsel', name: 'Sulawesi Selatan', island_cluster: 'Sulawesi', bps_code: '73', aliases: ['sulsel'] },
  { id: 'sultra', name: 'Sulawesi Tenggara', island_cluster: 'Sulawesi', bps_code: '74', aliases: ['sultra'] },
  { id: 'gorontalo', name: 'Gorontalo', island_cluster: 'Sulawesi', bps_code: '75', aliases: [] },
  { id: 'sulbar', name: 'Sulawesi Barat', island_cluster: 'Sulawesi', bps_code: '76', aliases: ['sulbar'] },
  { id: 'maluku', name: 'Maluku', island_cluster: 'Maluku & Papua', bps_code: '81', aliases: [] },
  { id: 'malut', name: 'Maluku Utara', island_cluster: 'Maluku & Papua', bps_code: '82', aliases: ['malut'] },
  { id: 'papua', name: 'Papua', island_cluster: 'Maluku & Papua', bps_code: '91', aliases: [] },
  { id: 'papbar', name: 'Papua Barat', island_cluster: 'Maluku & Papua', bps_code: '92', aliases: [] },
  { id: 'papsel', name: 'Papua Selatan', island_cluster: 'Maluku & Papua', bps_code: '93', aliases: [] },
  { id: 'papteng', name: 'Papua Tengah', island_cluster: 'Maluku & Papua', bps_code: '94', aliases: [] },
  { id: 'papeg', name: 'Papua Pegunungan', island_cluster: 'Maluku & Papua', bps_code: '95', aliases: [] },
  { id: 'papbd', name: 'Papua Barat Daya', island_cluster: 'Maluku & Papua', bps_code: '96', aliases: [] },
];

const LOOKUP_MAP = new Map<string, string>();
for (const prov of CANONICAL_PROVINCES) {
  LOOKUP_MAP.set(prov.id.toLowerCase(), prov.id);
  LOOKUP_MAP.set(prov.name.toLowerCase(), prov.id);
  for (const alias of prov.aliases) {
    LOOKUP_MAP.set(alias.toLowerCase(), prov.id);
  }
}

export function resolveProvinceId(input: string | null | undefined): string {
  if (!input) return 'nasional';
  const cleaned = input.trim().toLowerCase();
  return LOOKUP_MAP.get(cleaned) ?? 'nasional';
}

export function getProvinceById(id: string | null | undefined): CanonicalProvince | undefined {
  if (!id) return undefined;
  return CANONICAL_PROVINCES.find((p) => p.id === id);
}
