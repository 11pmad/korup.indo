export interface ProvinceOption {
  id: string;
  name: string;
}

export const PROVINCES_LIST: ProvinceOption[] = [
  { id: 'pusat', name: 'Pusat / Nasional (Kementerian / Lembaga RI)' },
  { id: 'aceh', name: 'Aceh' },
  { id: 'bali', name: 'Bali' },
  { id: 'banten', name: 'Banten' },
  { id: 'bengkulu', name: 'Bengkulu' },
  { id: 'diy', name: 'DI Yogyakarta' },
  { id: 'dki-jakarta', name: 'DKI Jakarta' },
  { id: 'gorontalo', name: 'Gorontalo' },
  { id: 'jambi', name: 'Jambi' },
  { id: 'jabar', name: 'Jawa Barat' },
  { id: 'jateng', name: 'Jawa Tengah' },
  { id: 'jatim', name: 'Jawa Timur' },
  { id: 'kalbar', name: 'Kalimantan Barat' },
  { id: 'kalsel', name: 'Kalimantan Selatan' },
  { id: 'kalteng', name: 'Kalimantan Tengah' },
  { id: 'kaltim', name: 'Kalimantan Timur' },
  { id: 'kaltara', name: 'Kalimantan Utara' },
  { id: 'babel', name: 'Kepulauan Bangka Belitung' },
  { id: 'kepri', name: 'Kepulauan Riau' },
  { id: 'lampung', name: 'Lampung' },
  { id: 'maluku', name: 'Maluku' },
  { id: 'malut', name: 'Maluku Utara' },
  { id: 'ntb', name: 'Nusa Tenggara Barat' },
  { id: 'ntt', name: 'Nusa Tenggara Timur' },
  { id: 'papua', name: 'Papua' },
  { id: 'papbar', name: 'Papua Barat' },
  { id: 'papbd2', name: 'Papua Barat Daya' },
  { id: 'papbd', name: 'Papua Pegunungan' },
  { id: 'papsel', name: 'Papua Selatan' },
  { id: 'papteng', name: 'Papua Tengah' },
  { id: 'riau', name: 'Riau' },
  { id: 'sulbar', name: 'Sulawesi Barat' },
  { id: 'sulsel', name: 'Sulawesi Selatan' },
  { id: 'sulteng', name: 'Sulawesi Tengah' },
  { id: 'sultra', name: 'Sulawesi Tenggara' },
  { id: 'sulut', name: 'Sulawesi Utara' },
  { id: 'sumbar', name: 'Sumatera Barat' },
  { id: 'sumsel', name: 'Sumatera Selatan' },
  { id: 'sumut', name: 'Sumatera Utara' }
];

export const SECTORS_LIST = [
  { id: 'pengadaan_barang_jasa', label: 'Pengadaan Barang & Jasa', icon: 'hard-hat' },
  { id: 'bansos_bencana', label: 'Bansos & Bencana', icon: 'package' },
  { id: 'suap_gratifikasi', label: 'Suap & Gratifikasi', icon: 'handshake' },
  { id: 'perizinan_sda_tambang', label: 'Perizinan SDA & Tambang', icon: 'tambang' },
  { id: 'mafia_peradilan', label: 'Mafia Peradilan / BUMN', icon: 'scale' }
];

export const PROVINCE_CITIES: Record<string, string[]> = {
  'DKI Jakarta': [
    'Jakarta Pusat',
    'Jakarta Selatan',
    'Jakarta Barat',
    'Jakarta Timur',
    'Jakarta Utara',
    'Kepulauan Seribu'
  ],
  'Jawa Barat': [
    'Kota Bandung',
    'Kota Bekasi',
    'Kota Bogor',
    'Kota Cimahi',
    'Kota Cirebon',
    'Kota Depok',
    'Kota Sukabumi',
    'Kota Tasikmalaya',
    'Kota Banjar',
    'Kabupaten Bandung',
    'Kabupaten Bandung Barat',
    'Kabupaten Bekasi',
    'Kabupaten Bogor',
    'Kabupaten Ciamis',
    'Kabupaten Cianjur',
    'Kabupaten Cirebon',
    'Kabupaten Garut',
    'Kabupaten Indramayu',
    'Kabupaten Karawang',
    'Kabupaten Kuningan',
    'Kabupaten Majalengka',
    'Kabupaten Pangandaran',
    'Kabupaten Purwakarta',
    'Kabupaten Subang',
    'Kabupaten Sukabumi',
    'Kabupaten Sumedang',
    'Kabupaten Tasikmalaya'
  ],
  'Jawa Tengah': [
    'Kota Semarang',
    'Kota Surakarta',
    'Kota Magelang',
    'Kota Pekalongan',
    'Kota Salatiga',
    'Kota Tegal',
    'Kabupaten Banjarnegara',
    'Kabupaten Banyumas',
    'Kabupaten Batang',
    'Kabupaten Blora',
    'Kabupaten Boyolali',
    'Kabupaten Brebes',
    'Kabupaten Cilacap',
    'Kabupaten Demak',
    'Kabupaten Grobogan',
    'Kabupaten Jepara',
    'Kabupaten Karanganyar',
    'Kabupaten Kebumen',
    'Kabupaten Kendal',
    'Kabupaten Klaten',
    'Kabupaten Kudus',
    'Kabupaten Magelang',
    'Kabupaten Pati',
    'Kabupaten Pekalongan',
    'Kabupaten Pemalang',
    'Kabupaten Purbalingga',
    'Kabupaten Purworejo',
    'Kabupaten Rembang',
    'Kabupaten Semarang',
    'Kabupaten Sragen',
    'Kabupaten Sukoharjo',
    'Kabupaten Tegal',
    'Kabupaten Temanggung',
    'Kabupaten Wonogiri',
    'Kabupaten Wonosobo'
  ],
  'Jawa Timur': [
    'Kota Surabaya',
    'Kota Malang',
    'Kota Batu',
    'Kota Blitar',
    'Kota Kediri',
    'Kota Madiun',
    'Kota Mojokerto',
    'Kota Pasuruan',
    'Kota Probolinggo',
    'Kabupaten Banyuwangi',
    'Kabupaten Bangkalan',
    'Kabupaten Blitar',
    'Kabupaten Bojonegoro',
    'Kabupaten Bondowoso',
    'Kabupaten Gresik',
    'Kabupaten Jember',
    'Kabupaten Jombang',
    'Kabupaten Kediri',
    'Kabupaten Lamongan',
    'Kabupaten Lumajang',
    'Kabupaten Madiun',
    'Kabupaten Magetan',
    'Kabupaten Malang',
    'Kabupaten Mojokerto',
    'Kabupaten Nganjuk',
    'Kabupaten Ngawi',
    'Kabupaten Pacitan',
    'Kabupaten Pamekasan',
    'Kabupaten Pasuruan',
    'Kabupaten Ponorogo',
    'Kabupaten Probolinggo',
    'Kabupaten Sampang',
    'Kabupaten Sidoarjo',
    'Kabupaten Situbondo',
    'Kabupaten Sumenep',
    'Kabupaten Trenggalek',
    'Kabupaten Tuban',
    'Kabupaten Tulungagung'
  ],
  'Banten': [
    'Kota Serang',
    'Kota Cilegon',
    'Kota Tangerang',
    'Kota Tangerang Selatan',
    'Kabupaten Lebak',
    'Kabupaten Pandeglang',
    'Kabupaten Serang',
    'Kabupaten Tangerang'
  ],
  'DI Yogyakarta': [
    'Kota Yogyakarta',
    'Kabupaten Bantul',
    'Kabupaten Gunungkidul',
    'Kabupaten Kulon Progo',
    'Kabupaten Sleman'
  ],
  'Bali': [
    'Kota Denpasar',
    'Kabupaten Badung',
    'Kabupaten Bangli',
    'Kabupaten Buleleng',
    'Kabupaten Gianyar',
    'Kabupaten Jembrana',
    'Kabupaten Karangasem',
    'Kabupaten Klungkung',
    'Kabupaten Tabanan'
  ],
  'Aceh': [
    'Kota Banda Aceh',
    'Kota Sabang',
    'Kota Langsa',
    'Kota Lhokseumawe',
    'Kota Subulussalam',
    'Kabupaten Aceh Barat',
    'Kabupaten Aceh Barat Daya',
    'Kabupaten Aceh Besar',
    'Kabupaten Aceh Jaya',
    'Kabupaten Aceh Selatan',
    'Kabupaten Aceh Singkil',
    'Kabupaten Aceh Tamiang',
    'Kabupaten Aceh Tengah',
    'Kabupaten Aceh Tenggara',
    'Kabupaten Aceh Timur',
    'Kabupaten Aceh Utara',
    'Kabupaten Bener Meriah',
    'Kabupaten Bireuen',
    'Kabupaten Gayo Lues',
    'Kabupaten Nagan Raya',
    'Kabupaten Pidie',
    'Kabupaten Pidie Jaya',
    'Kabupaten Simeulue'
  ],
  'Sumatera Utara': [
    'Kota Medan',
    'Kota Binjai',
    'Kota Gunungsitoli',
    'Kota Padangsidimpuan',
    'Kota Pematangsiantar',
    'Kota Sibolga',
    'Kota Tanjungbalai',
    'Kota Tebing Tinggi',
    'Kabupaten Asahan',
    'Kabupaten Batu Bara',
    'Kabupaten Dairi',
    'Kabupaten Deli Serdang',
    'Kabupaten Humbang Hasundutan',
    'Kabupaten Karo',
    'Kabupaten Labuhanbatu',
    'Kabupaten Labuhanbatu Selatan',
    'Kabupaten Labuhanbatu Utara',
    'Kabupaten Langkat',
    'Kabupaten Mandailing Natal',
    'Kabupaten Nias',
    'Kabupaten Nias Barat',
    'Kabupaten Nias Selatan',
    'Kabupaten Nias Utara',
    'Kabupaten Padang Lawas',
    'Kabupaten Padang Lawas Utara',
    'Kabupaten Pakpak Bharat',
    'Kabupaten Samosir',
    'Kabupaten Serdang Bedagai',
    'Kabupaten Simalungun',
    'Kabupaten Tapanuli Selatan',
    'Kabupaten Tapanuli Tengah',
    'Kabupaten Tapanuli Utara',
    'Kabupaten Toba'
  ],
  'Sumatera Barat': [
    'Kota Padang',
    'Kota Bukittinggi',
    'Kota Padang Panjang',
    'Kota Pariaman',
    'Kota Payakumbuh',
    'Kota Sawahlunto',
    'Kota Solok',
    'Kabupaten Agam',
    'Kabupaten Dharmasraya',
    'Kabupaten Kepulauan Mentawai',
    'Kabupaten Lima Puluh Kota',
    'Kabupaten Padang Pariaman',
    'Kabupaten Pasaman',
    'Kabupaten Pasaman Barat',
    'Kabupaten Pesisir Selatan',
    'Kabupaten Sijunjung',
    'Kabupaten Solok',
    'Kabupaten Solok Selatan',
    'Kabupaten Tanah Datar'
  ],
  'Riau': [
    'Kota Pekanbaru',
    'Kota Dumai',
    'Kabupaten Bengkalis',
    'Kabupaten Indragiri Hilir',
    'Kabupaten Indragiri Hulu',
    'Kabupaten Kampar',
    'Kabupaten Kepulauan Meranti',
    'Kabupaten Kuantan Singingi',
    'Kabupaten Pelalawan',
    'Kabupaten Rokan Hilir',
    'Kabupaten Rokan Hulu',
    'Kabupaten Siak'
  ],
  'Kepulauan Riau': [
    'Kota Batam',
    'Kota Tanjungpinang',
    'Kabupaten Bintan',
    'Kabupaten Karimun',
    'Kabupaten Kepulauan Anambas',
    'Kabupaten Lingga',
    'Kabupaten Natuna'
  ],
  'Jambi': [
    'Kota Jambi',
    'Kota Sungai Penuh',
    'Kabupaten Batanghari',
    'Kabupaten Bungo',
    'Kabupaten Kerinci',
    'Kabupaten Merangin',
    'Kabupaten Muaro Jambi',
    'Kabupaten Sarolangun',
    'Kabupaten Tanjung Jabung Barat',
    'Kabupaten Tanjung Jabung Timur',
    'Kabupaten Tebo'
  ],
  'Sumatera Selatan': [
    'Kota Palembang',
    'Kota Lubuklinggau',
    'Kota Pagar Alam',
    'Kota Prabumulih',
    'Kabupaten Banyuasin',
    'Kabupaten Empat Lawang',
    'Kabupaten Lahat',
    'Kabupaten Muara Enim',
    'Kabupaten Musi Banyuasin',
    'Kabupaten Musi Rawas',
    'Kabupaten Musi Rawas Utara',
    'Kabupaten Ogan Ilir',
    'Kabupaten Ogan Komering Ilir',
    'Kabupaten Ogan Komering Ulu',
    'Kabupaten Ogan Komering Ulu Selatan',
    'Kabupaten Ogan Komering Ulu Timur',
    'Kabupaten Penukal Abab Lematang Ilir'
  ],
  'Bengkulu': [
    'Kota Bengkulu',
    'Kabupaten Bengkulu Selatan',
    'Kabupaten Bengkulu Tengah',
    'Kabupaten Bengkulu Utara',
    'Kabupaten Kaur',
    'Kabupaten Kepahiang',
    'Kabupaten Lebong',
    'Kabupaten Mukomuko',
    'Kabupaten Rejang Lebong',
    'Kabupaten Seluma'
  ],
  'Lampung': [
    'Kota Bandar Lampung',
    'Kota Metro',
    'Kabupaten Lampung Barat',
    'Kabupaten Lampung Selatan',
    'Kabupaten Lampung Tengah',
    'Kabupaten Lampung Timur',
    'Kabupaten Lampung Utara',
    'Kabupaten Mesuji',
    'Kabupaten Pesawaran',
    'Kabupaten Pesisir Barat',
    'Kabupaten Pringsewu',
    'Kabupaten Tanggamus',
    'Kabupaten Tulang Bawang',
    'Kabupaten Tulang Bawang Barat',
    'Kabupaten Way Kanan'
  ],
  'Kepulauan Bangka Belitung': [
    'Kota Pangkalpinang',
    'Kabupaten Bangka',
    'Kabupaten Bangka Barat',
    'Kabupaten Bangka Selatan',
    'Kabupaten Bangka Tengah',
    'Kabupaten Belitung',
    'Kabupaten Belitung Timur'
  ],
  'Kalimantan Barat': [
    'Kota Pontianak',
    'Kota Singkawang',
    'Kabupaten Bengkayang',
    'Kabupaten Kapuas Hulu',
    'Kabupaten Kayong Utara',
    'Kabupaten Ketapang',
    'Kabupaten Kubu Raya',
    'Kabupaten Landak',
    'Kabupaten Melawi',
    'Kabupaten Mempawah',
    'Kabupaten Sambas',
    'Kabupaten Sanggau',
    'Kabupaten Sekadau',
    'Kabupaten Sintang'
  ],
  'Kalimantan Tengah': [
    'Kota Palangka Raya',
    'Kabupaten Barito Selatan',
    'Kabupaten Barito Timur',
    'Kabupaten Barito Utara',
    'Kabupaten Gunung Mas',
    'Kabupaten Kapuas',
    'Kabupaten Katingan',
    'Kabupaten Kotawaringin Barat',
    'Kabupaten Kotawaringin Timur',
    'Kabupaten Lamandau',
    'Kabupaten Murung Raya',
    'Kabupaten Pulang Pisau',
    'Kabupaten Seruyan',
    'Kabupaten Sukamara'
  ],
  'Kalimantan Selatan': [
    'Kota Banjarmasin',
    'Kota Banjarbaru',
    'Kabupaten Balangan',
    'Kabupaten Banjar',
    'Kabupaten Barito Kuala',
    'Kabupaten Hulu Sungai Selatan',
    'Kabupaten Hulu Sungai Tengah',
    'Kabupaten Hulu Sungai Utara',
    'Kabupaten Kotabaru',
    'Kabupaten Tabalong',
    'Kabupaten Tanah Bumbu',
    'Kabupaten Tanah Laut',
    'Kabupaten Tapin'
  ],
  'Kalimantan Timur': [
    'Kota Samarinda',
    'Kota Balikpapan',
    'Kota Bontang',
    'Kabupaten Berau',
    'Kabupaten Kutai Barat',
    'Kabupaten Kutai Kartanegara',
    'Kabupaten Kutai Timur',
    'Kabupaten Mahakam Ulu',
    'Kabupaten Paser',
    'Kabupaten Penajam Paser Utara'
  ],
  'Kalimantan Utara': [
    'Kota Tarakan',
    'Kabupaten Bulungan',
    'Kabupaten Malinau',
    'Kabupaten Nunukan',
    'Kabupaten Tana Tidung'
  ],
  'Sulawesi Utara': [
    'Kota Manado',
    'Kota Bitung',
    'Kota Kotamobagu',
    'Kota Tomohon',
    'Kabupaten Bolaang Mongondow',
    'Kabupaten Bolaang Mongondow Selatan',
    'Kabupaten Bolaang Mongondow Timur',
    'Kabupaten Bolaang Mongondow Utara',
    'Kabupaten Kepulauan Sangihe',
    'Kabupaten Kepulauan Siau Tagulandang Biaro',
    'Kabupaten Kepulauan Talaud',
    'Kabupaten Minahasa',
    'Kabupaten Minahasa Selatan',
    'Kabupaten Minahasa Tenggara',
    'Kabupaten Minahasa Utara'
  ],
  'Gorontalo': [
    'Kota Gorontalo',
    'Kabupaten Boalemo',
    'Kabupaten Bone Bolango',
    'Kabupaten Gorontalo',
    'Kabupaten Gorontalo Utara',
    'Kabupaten Pohuwato'
  ],
  'Sulawesi Tengah': [
    'Kota Palu',
    'Kabupaten Banggai',
    'Kabupaten Banggai Kepulauan',
    'Kabupaten Banggai Laut',
    'Kabupaten Buol',
    'Kabupaten Donggala',
    'Kabupaten Morowali',
    'Kabupaten Morowali Utara',
    'Kabupaten Parigi Moutong',
    'Kabupaten Poso',
    'Kabupaten Sigi',
    'Kabupaten Tojo Una-Una',
    'Kabupaten Tolitoli'
  ],
  'Sulawesi Barat': [
    'Kabupaten Majene',
    'Kabupaten Mamasa',
    'Kabupaten Mamuju',
    'Kabupaten Mamuju Tengah',
    'Kabupaten Pasangkayu',
    'Kabupaten Polewali Mandar'
  ],
  'Sulawesi Selatan': [
    'Kota Makassar',
    'Kota Palopo',
    'Kota Parepare',
    'Kabupaten Bantaeng',
    'Kabupaten Barru',
    'Kabupaten Bone',
    'Kabupaten Bulukumba',
    'Kabupaten Enrekang',
    'Kabupaten Gowa',
    'Kabupaten Jeneponto',
    'Kabupaten Kepulauan Selayar',
    'Kabupaten Luwu',
    'Kabupaten Luwu Timur',
    'Kabupaten Luwu Utara',
    'Kabupaten Maros',
    'Kabupaten Pangkajene dan Kepulauan',
    'Kabupaten Pinrang',
    'Kabupaten Sidenreng Rappang',
    'Kabupaten Sinjai',
    'Kabupaten Soppeng',
    'Kabupaten Takalar',
    'Kabupaten Tana Toraja',
    'Kabupaten Toraja Utara',
    'Kabupaten Wajo'
  ],
  'Sulawesi Tenggara': [
    'Kota Kendari',
    'Kota Baubau',
    'Kabupaten Bombana',
    'Kabupaten Buton',
    'Kabupaten Buton Selatan',
    'Kabupaten Buton Tengah',
    'Kabupaten Buton Utara',
    'Kabupaten Kolaka',
    'Kabupaten Kolaka Timur',
    'Kabupaten Kolaka Utara',
    'Kabupaten Konawe',
    'Kabupaten Konawe Kepulauan',
    'Kabupaten Konawe Selatan',
    'Kabupaten Konawe Utara',
    'Kabupaten Muna',
    'Kabupaten Muna Barat',
    'Kabupaten Wakatobi'
  ],
  'Maluku': [
    'Kota Ambon',
    'Kota Tual',
    'Kabupaten Buru',
    'Kabupaten Buru Selatan',
    'Kabupaten Kepulauan Aru',
    'Kabupaten Kepulauan Tanimbar',
    'Kabupaten Maluku Barat Daya',
    'Kabupaten Maluku Tengah',
    'Kabupaten Maluku Tenggara',
    'Kabupaten Seram Bagian Barat',
    'Kabupaten Seram Bagian Timur'
  ],
  'Maluku Utara': [
    'Kota Ternate',
    'Kota Tidore Kepulauan',
    'Kabupaten Halmahera Barat',
    'Kabupaten Halmahera Tengah',
    'Kabupaten Halmahera Timur',
    'Kabupaten Halmahera Selatan',
    'Kabupaten Halmahera Utara',
    'Kabupaten Kepulauan Sula',
    'Kabupaten Pulau Morotai',
    'Kabupaten Pulau Taliabu'
  ],
  'Nusa Tenggara Barat': [
    'Kota Mataram',
    'Kota Bima',
    'Kabupaten Bima',
    'Kabupaten Dompu',
    'Kabupaten Lombok Barat',
    'Kabupaten Lombok Tengah',
    'Kabupaten Lombok Timur',
    'Kabupaten Lombok Utara',
    'Kabupaten Sumbawa',
    'Kabupaten Sumbawa Barat'
  ],
  'Nusa Tenggara Timur': [
    'Kota Kupang',
    'Kabupaten Alor',
    'Kabupaten Belu',
    'Kabupaten Ende',
    'Kabupaten Flores Timur',
    'Kabupaten Kupang',
    'Kabupaten Lembata',
    'Kabupaten Malaka',
    'Kabupaten Manggarai',
    'Kabupaten Manggarai Barat',
    'Kabupaten Manggarai Timur',
    'Kabupaten Nagekeo',
    'Kabupaten Ngada',
    'Kabupaten Rote Ndao',
    'Kabupaten Sabu Raijua',
    'Kabupaten Sikka',
    'Kabupaten Sumba Barat',
    'Kabupaten Sumba Barat Daya',
    'Kabupaten Sumba Tengah',
    'Kabupaten Sumba Timur',
    'Kabupaten Timor Tengah Selatan',
    'Kabupaten Timor Tengah Utara'
  ],
  'Papua': [
    'Kota Jayapura',
    'Kabupaten Biak Numfor',
    'Kabupaten Jayapura',
    'Kabupaten Keerom',
    'Kabupaten Kepulauan Yapen',
    'Kabupaten Mamberamo Raya',
    'Kabupaten Sarmi',
    'Kabupaten Supiori',
    'Kabupaten Waropen'
  ],
  'Papua Barat': [
    'Kabupaten Fakfak',
    'Kabupaten Kaimana',
    'Kabupaten Manokwari',
    'Kabupaten Manokwari Selatan',
    'Kabupaten Pegunungan Arfak',
    'Kabupaten Teluk Bintuni',
    'Kabupaten Teluk Wondama'
  ],
  'Papua Barat Daya': [
    'Kota Sorong',
    'Kabupaten Maybrat',
    'Kabupaten Raja Ampat',
    'Kabupaten Sorong',
    'Kabupaten Sorong Selatan',
    'Kabupaten Tambrauw'
  ],
  'Papua Pegunungan': [
    'Kabupaten Jayawijaya',
    'Kabupaten Lanny Jaya',
    'Kabupaten Mamberamo Tengah',
    'Kabupaten Nduga',
    'Kabupaten Pegunungan Bintang',
    'Kabupaten Tolikara',
    'Kabupaten Yahukimo',
    'Kabupaten Yalimo'
  ],
  'Papua Selatan': [
    'Kabupaten Asmat',
    'Kabupaten Boven Digoel',
    'Kabupaten Mappi',
    'Kabupaten Merauke'
  ],
  'Papua Tengah': [
    'Kabupaten Deiyai',
    'Kabupaten Dogiyai',
    'Kabupaten Intan Jaya',
    'Kabupaten Mimika',
    'Kabupaten Nabire',
    'Kabupaten Paniai',
    'Kabupaten Puncak',
    'Kabupaten Puncak Jaya'
  ],
  'Pusat / Nasional (Kementerian / Lembaga RI)': [
    'Instansi Pusat RI',
    'KPK RI',
    'Kejaksaan Agung RI',
    'Bareskrim Polri',
    'BPK RI',
    'BPKP RI',
    'Mahkamah Agung RI',
    'Kementerian Keuangan RI',
    'LKPP'
  ]
};

export function getCitiesByProvince(provinceName?: string | null): string[] {
  if (!provinceName) return [];
  const trimmed = provinceName.trim();
  if (PROVINCE_CITIES[trimmed]) {
    return PROVINCE_CITIES[trimmed];
  }
  // Try case-insensitive / partial match
  const foundKey = Object.keys(PROVINCE_CITIES).find(
    k => k.toLowerCase() === trimmed.toLowerCase() || trimmed.toLowerCase().includes(k.toLowerCase())
  );
  return foundKey ? PROVINCE_CITIES[foundKey] : [];
}

export function getProvinceKemendagriCode(provinceName?: string | null): string {
  if (!provinceName) return '31';
  const name = provinceName.toLowerCase();
  if (name.includes('aceh')) return '11';
  if (name.includes('sumatera utara')) return '12';
  if (name.includes('sumatera barat')) return '13';
  if (name.includes('riau') && !name.includes('kepulauan')) return '14';
  if (name.includes('jambi')) return '15';
  if (name.includes('sumatera selatan')) return '16';
  if (name.includes('bengkulu')) return '17';
  if (name.includes('lampung')) return '18';
  if (name.includes('bangka')) return '19';
  if (name.includes('kepulauan riau')) return '21';
  if (name.includes('jakarta')) return '31';
  if (name.includes('jawa barat')) return '32';
  if (name.includes('jawa tengah')) return '33';
  if (name.includes('yogyakarta')) return '34';
  if (name.includes('jawa timur')) return '35';
  if (name.includes('banten')) return '36';
  if (name.includes('bali')) return '51';
  if (name.includes('nusa tenggara barat')) return '52';
  if (name.includes('nusa tenggara timur')) return '53';
  if (name.includes('kalimantan barat')) return '61';
  if (name.includes('kalimantan tengah')) return '62';
  if (name.includes('kalimantan selatan')) return '63';
  if (name.includes('kalimantan timur')) return '64';
  if (name.includes('kalimantan utara')) return '65';
  if (name.includes('sulawesi utara')) return '71';
  if (name.includes('sulawesi tengah')) return '72';
  if (name.includes('sulawesi selatan')) return '73';
  if (name.includes('sulawesi tenggara')) return '74';
  if (name.includes('gorontalo')) return '75';
  if (name.includes('sulawesi barat')) return '76';
  if (name.includes('maluku utara')) return '82';
  if (name.includes('maluku')) return '81';
  if (name.includes('papua barat daya')) return '96';
  if (name.includes('papua pegunungan')) return '95';
  if (name.includes('papua tengah')) return '94';
  if (name.includes('papua selatan')) return '93';
  if (name.includes('papua barat')) return '91';
  if (name.includes('papua')) return '92';
  return '31';
}
