import { db, schema } from './index.js';
import { eq, sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

async function seedReactionsAndComments() {
  console.log('🌱 Menyiapkan data awal Reaksi Warga & Komentar...');

  // 1. Buat beberapa profil Warga/Netizen realistis
  const passwordHash = await bcrypt.hash('warga12345', 10);
  const citizens = [
    {
      id: 'usr-budi-jakarta',
      username: 'budi_santoso',
      display_name: 'Budi Santoso',
      email: 'budi.santoso@warga.id',
      password_hash: passwordHash,
      avatar_seed: 'garuda',
      role: 'citizen'
    },
    {
      id: 'usr-dewi-surabaya',
      username: 'dewi_lestari',
      display_name: 'Dewi Lestari (Pegiat Hukum)',
      email: 'dewi.lestari@hukum.or.id',
      password_hash: passwordHash,
      avatar_seed: 'padi',
      role: 'citizen'
    },
    {
      id: 'usr-ridwan-bandung',
      username: 'ridwan_kamil_fans',
      display_name: 'Ridwan Gunawan',
      email: 'ridwan@warga.id',
      password_hash: passwordHash,
      avatar_seed: 'emas',
      role: 'citizen'
    },
    {
      id: 'usr-anita-medan',
      username: 'anita_siregar',
      display_name: 'Anita Siregar (Akuntan Publik)',
      email: 'anita@akuntan.id',
      password_hash: passwordHash,
      avatar_seed: 'merah',
      role: 'citizen'
    },
    {
      id: 'usr-hendra-jogja',
      username: 'hendra_wibowo',
      display_name: 'Hendra Wibowo',
      email: 'hendra@jogja.id',
      password_hash: passwordHash,
      avatar_seed: 'banteng',
      role: 'citizen'
    },
    {
      id: 'usr-faisal-makassar',
      username: 'faisal_daeng',
      display_name: 'Faisal Daeng',
      email: 'faisal@makassar.id',
      password_hash: passwordHash,
      avatar_seed: 'garuda',
      role: 'citizen'
    }
  ];

  for (const c of citizens) {
    await db.insert(schema.citizenUsers).values(c).onConflictDoNothing();
  }

  // 2. Ambil daftar kasus yang ada
  const allCases = await db.select({ id: schema.cases.id, title: schema.cases.title, loss: schema.cases.loss_amount }).from(schema.cases).limit(15);
  if (allCases.length === 0) return;

  // Kasus Mega Korupsi Timah -> Mayoritas Kecaman Keras
  const timahCase = allCases.find(c => c.id.includes('timah')) || allCases[0];
  if (timahCase) {
    const rxns = [
      { id: `rxn-${timahCase.id}-1`, case_id: timahCase.id, user_id: 'usr-budi-jakarta', reaction_type: 'geram' as const },
      { id: `rxn-${timahCase.id}-2`, case_id: timahCase.id, user_id: 'usr-dewi-surabaya', reaction_type: 'rampok' as const },
      { id: `rxn-${timahCase.id}-3`, case_id: timahCase.id, user_id: 'usr-anita-medan', reaction_type: 'rampok' as const },
      { id: `rxn-${timahCase.id}-4`, case_id: timahCase.id, user_id: 'usr-faisal-makassar', reaction_type: 'memalukan' as const },
      { id: `rxn-${timahCase.id}-5`, case_id: timahCase.id, user_id: 'usr-hendra-jogja', reaction_type: 'geram' as const }
    ];
    for (const r of rxns) {
      await db.insert(schema.caseReactions).values(r).onConflictDoNothing();
    }

    // Komentar di Kasus Timah
    await db.insert(schema.caseComments).values([
      {
        id: `cmt-${timahCase.id}-1`,
        case_id: timahCase.id,
        user_id: 'usr-anita-medan',
        reaction_type: 'rampok' as const,
        content: 'Kerugian negara Rp 300 Triliun ini bukan cuma hitungan uang di atas kertas, tapi rusaknya ekosistem laut dan masa depan anak cucu di Bangka Belitung. Tindak TPPU sampai tuntas!',
        upvotes_count: 14,
        is_hidden: 0
      },
      {
        id: `cmt-${timahCase.id}-2`,
        case_id: timahCase.id,
        user_id: 'usr-dewi-surabaya',
        reaction_type: 'geram' as const,
        content: 'Modus sewa smelter dan kerja sama boneka seperti ini membuktikan mafia tambang begitu terstruktur. Aparat penegak hukum jangan sampai kendor di tingkat kasasi.',
        upvotes_count: 8,
        is_hidden: 0
      }
    ]).onConflictDoNothing();
  }

  // Kasus dengan konteks Khilaf Administrasi / Niat Baik / Dimaklumi Masyarakat
  // Ambil kasus yang nominalnya lebih kecil atau kasus kedua
  const case2 = allCases[1] || allCases[0];
  if (case2 && case2.id !== timahCase?.id) {
    const rxns2 = [
      { id: `rxn-${case2.id}-1`, case_id: case2.id, user_id: 'usr-budi-jakarta', reaction_type: 'khilaf_administrasi' as const },
      { id: `rxn-${case2.id}-2`, case_id: case2.id, user_id: 'usr-ridwan-bandung', reaction_type: 'didukung' as const },
      { id: `rxn-${case2.id}-3`, case_id: case2.id, user_id: 'usr-hendra-jogja', reaction_type: 'dimaklumi' as const },
      { id: `rxn-${case2.id}-4`, case_id: case2.id, user_id: 'usr-dewi-surabaya', reaction_type: 'tebang_pilih' as const }
    ];
    for (const r of rxns2) {
      await db.insert(schema.caseReactions).values(r).onConflictDoNothing();
    }

    await db.insert(schema.caseComments).values([
      {
        id: `cmt-${case2.id}-1`,
        case_id: case2.id,
        user_id: 'usr-ridwan-bandung',
        reaction_type: 'khilaf_administrasi' as const,
        content: 'Perlu kita bedakan dengan jernih antara korupsi yang memperkaya diri pribadi dengan pengadaan fasilitas kerja seperti notebook/komputer dinas. Jika pejabat bersangkutan tidak menerima uang sepeser pun dan semata-mata demi kelancaran tugas pelayanan publik, ini lebih tepat dipandang sebagai kekhilafan administrasi birokrasi, bukan kejahatan perampokan uang rakyat.',
        upvotes_count: 23,
        is_hidden: 0
      },
      {
        id: `cmt-${case2.id}-2`,
        case_id: case2.id,
        user_id: 'usr-hendra-jogja',
        reaction_type: 'didukung' as const,
        content: 'Setuju, masyarakat mendukung jika pengadaan memang untuk kebutuhan kerja nyata dan barangnya ada. Aparat jangan memukul rata semua kesalahan prosedural hukum administrasi sebagai tindak pidana korupsi.',
        upvotes_count: 11,
        is_hidden: 0
      },
      {
        id: `cmt-${case2.id}-3`,
        case_id: case2.id,
        user_id: 'usr-dewi-surabaya',
        reaction_type: 'tebang_pilih' as const,
        content: 'Dalam asas hukum pidana, harus ada mens rea (niat jahat). Jika tidak ada keuntungan pribadi dan kerugian telah dipulihkan, penerapan pasal UU Tipikor terasa sangat dipaksakan.',
        upvotes_count: 7,
        is_hidden: 0
      }
    ]).onConflictDoNothing();
  }

  console.log('✅ Berhasil menyemai data reaksi dan komentar warga!');
  process.exit(0);
}

seedReactionsAndComments().catch(err => {
  console.error(err);
  process.exit(1);
});
