import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from '@google/genai';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeRaw from 'rehype-raw';
import { saveAs } from 'file-saver';
import { Download, Loader2, Play, Settings2, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { cn } from './lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

const MATA_PELAJARAN = [
  "Al-Qur'an Hadis", "Akidah Akhlak", "Fikih", "Sejarah Kebudayaan Islam", "Bahasa Arab",
  "Pendidikan Agama Islam", "PPKn", "Bahasa Indonesia", "Matematika", "Ilmu Pengetahuan Alam (IPA)",
  "Ilmu Pengetahuan Sosial (IPS)", "Bahasa Inggris", "Pendidikan Jasmani Olahraga dan Kesehatan",
  "Seni Budaya", "Prakarya", "Informatika", "Fisika", "Kimia", "Biologi", "Sejarah",
  "Geografi", "Ekonomi", "Sosiologi", "Antropologi", "Muatan Lokal",
  "Bahasa dan Sastra Indonesia", "Bahasa dan Sastra Inggris", "Bahasa dan Sastra Arab",
  "Bahasa dan Sastra Asing Lainnya",
  "Ilmu Kalam", "Tafsir", "Hadis", "Ilmu Fikih (Ushul Fikih)", "Keterampilan Madrasah"
];

const METODE_PEMBELAJARAN = [
  "Discovery Learning", "Problem Based Learning", "Project Based Learning",
  "Inquiry Learning", "Cooperative Learning", "Contextual Teaching and Learning",
  "Ceramah & Tanya Jawab Interaktif", "Demonstrasi", "Eksperimen", "Flipped Classroom"
];

const KELAS_OPTIONS = [
  "SD/MI Kelas 1", "SD/MI Kelas 2", "SD/MI Kelas 3", "SD/MI Kelas 4", "SD/MI Kelas 5", "SD/MI Kelas 6",
  "SMP/MTs Kelas 7", "SMP/MTs Kelas 8", "SMP/MTs Kelas 9",
  "SMA/MA Kelas 10", "SMA/MA Kelas 11", "SMA/MA Kelas 12"
];

export default function App() {
  const [formData, setFormData] = useState({
    tingkatKelas: 'SMA/MA Kelas 11',
    mataPelajaran: 'Fisika',
    semester: 'Ganjil',
    namaMadrasah: 'MAS AR RAHMAN AR RAHIM',
    jumlahPertemuan: 10,
    metodePembelajaran: 'Discovery Learning',
    judulMateri: 'Gelombang, Bunyi dan Cahaya',
    tanggal: format(new Date(), 'yyyy-MM-dd'),
    tempatTandaTangan: 'Jakarta',
    namaGuru: 'Azmir Zahrani',
    nipGuru: '199001012020121001',
    namaKamad: 'Dr. H. Ahmad Fulan, M.Pd.',
    nipKamad: '197505152000031002'
  });

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState('');
  const [error, setError] = useState('');
  const [retryTimer, setRetryTimer] = useState(0);

  // Timer logic for API rate limits
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (retryTimer > 0) {
      timer = setTimeout(() => setRetryTimer(prev => prev - 1), 1000);
    } else if (retryTimer === 0 && error && error.includes('limit')) {
      // Auto retry when timer hits 0 if it was a rate limit error
      setError('');
      generateDocument();
    }
    return () => clearTimeout(timer);
  }, [retryTimer]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generateDocument = async () => {
    if (!process.env.GEMINI_API_KEY) {
      setError('GEMINI_API_KEY tidak ditemukan. Silakan atur di pengaturan AI Studio.');
      return;
    }

    setLoading(true);
    setError('');
    setResult('');

    const formattedDate = format(new Date(formData.tanggal), 'dd MMMM yyyy', { locale: id });

    const prompt = `Anda adalah asisten AI pembuat Perangkat Ajar Madrasah (RPP/Modul Ajar) tingkat profesional.
Anda diinstruksikan untuk membuat perangkat ajar dengan data berikut:
- Madrasah: ${formData.namaMadrasah}
- Mata Pelajaran: ${formData.mataPelajaran}
- Fase/Kelas: ${formData.tingkatKelas}
- Semester: ${formData.semester}
- Alokasi Waktu: ${formData.jumlahPertemuan} Pertemuan
- Topik / Judul Materi: ${formData.judulMateri}
- Metode Pembelajaran: ${formData.metodePembelajaran}

PRINSIP KERJA WAJIB:
1. Kepatuhan Regulasi: Seluruh administrasi wajib selaras dengan CP 046/H/KR/2025 dan KMA 1503 Tahun 2025 (6 hari kerja).
2. Transisi Cerdas: Ganti istilah P5RA menjadi "Kegiatan Kokurikuler Panca Cita". Kembangkan aktivitas kokurikuler yang inspiratif, aplikatif, dan relevan dengan kehidupan siswa.
3. Fleksibilitas Informatif: Berikan penjelasan yang detail dan kaya akan konteks.
4. Gaya Bahasa: Gunakan nada bicara yang profesional namun suportif, inspiratif, dan mudah dipahami oleh rekan sejawat guru.
5. Anti-Halusinasi Terkendali: Tetaplah jujur jika data tidak ada di CP, namun berikan alternatif solusi atau saran profesional yang tetap masuk akal secara pedagogis.

FORMAT WAJIB:
DILARANG KERAS memberikan intro/outro, kalimat sapaan, atau kalimat penutup apapun. Jawaban Anda harus LANGSUNG dimulai dengan "# RENCANA PELAKSANAAN KBC DAN PM" tanpa ada teks lain sebelumnya.
Anda WAJIB menggunakan struktur Markdown di bawah ini sebagai template. Ganti teks dalam kurung siku dengan data yang dikembangkan secara cerdas. JANGAN mengubah struktur heading dan JANGAN mengubah format tabel di bagian akhir.
PENTING: Pada bagian tabel penandatanganan di akhir, gunakan format Markdown standard, namun secara eksplisit instruksikan agar rendering tabel saat dicopy ke Ms. Word disetel border-nya ke 'None' atau 'Invisible' sehingga tidak ada garis yang terlihat.

# RENCANA PELAKSANAAN KBC DAN PM

<ul style="list-style-type: disc; margin-left: 20px; font-family: monospace; white-space: pre-wrap;">
<li>Madrasah       : ${formData.namaMadrasah}</li>
<li>Mata Pelajaran : ${formData.mataPelajaran}</li>
<li>Fase/Kelas     : ${formData.tingkatKelas}</li>
<li>Semester       : ${formData.semester}</li>
<li>Alokasi Waktu  : ${formData.jumlahPertemuan} Pertemuan</li>
<li>Nama Penyusun  : ${formData.namaGuru}</li>
</ul>

## A. Identifikasi

| Kategori | Deskripsi |
| :--- | :--- |
| **Peserta Didik** | [Analisis kesiapan kognitif, minat belajar dan pengetahuan awal peserta didik terhadap ${formData.judulMateri}] |
| **Materi Pelajaran** | [Cakupan materi, tingkat kesulitan, dan integrasi nilai agama/kebaikan] |
| **Dimensi Profil Lulusan** | [Pilih dan centang (Gunakan ☑ dan ☐) minimal 3 dimensi yang relevan dari: DPL1 Keimanan, DPL2 Kewargaan, DPL3 Penalaran Kritis, DPL4 Kreativitas, DPL5 Kolaborasi, DPL6 Kemandirian, DPL7 Kesehatan, DPL8 Komunikasi] |
| **Topik Kurikulum Berbasis Cinta** | [Pilih dan centang (Gunakan ☑ dan ☐) minimal 2 dari: Cinta Allah dan Rasulnya, Cinta Ilmu, Cinta Lingkungan, Cinta Diri dan Sesama Manusia, Cinta Tanah Air] |
| **Materi Integrasi KBC** | [Penjelasan merenungi materi sebagai manifestasi kasih sayang Tuhan atau integrasi kebaikan] |

## B. Desain Pembelajaran

| Kategori | Deskripsi |
| :--- | :--- |
| **Capaian Pembelajaran** | [Capaian pembelajaran sesuai CP 046/2025 untuk ranah ini] |
| **Lintas Disiplin Ilmu** | [Keterkaitan dengan mapel lain] |
| **Tujuan Pembelajaran** | [Target tujuan instruksional spesifik untuk ${formData.jumlahPertemuan} pertemuan menggunakan ${formData.metodePembelajaran}] |
| **Topik Pembelajaran** | **${formData.judulMateri.toUpperCase()}** |
| **Praktik Pedagogis** | **${formData.metodePembelajaran}**: [Penjelasan singkat alur metode ini] |
| **Kemitraan Pembelajaran** | [Siapa mitra belajar yang bisa dilibatkan. misal: Orang tua, ahli profesi tertentu] |
| **Lingkungan Pembelajaran** | [Tempat pembelajaran misal kelas, lab, lapangan] |
| **Pemanfaatan Digital** | [Alat/Aplikasi digital pendukung yang tepat] |

## C. Pengalaman Belajar (Langkah-langkah)

**Dalil/Kutipan Inspiratif:** [Berikan satu ayat, hadis, kutipan pahlawan, atau pepatah inspiratif yang sangat relevan dengan materi ${formData.judulMateri}]

### KEGIATAN PEMBELAJARAN
[PENTING: Buatlah rincian pertemuan sebanyak tepat ${formData.jumlahPertemuan} pertemuan. Untuk setiap pertemuannya berikan tabel aktivitas:]

**PERTEMUAN KE-[N] ([Topik/Fokus Pertemuan])**

| Tahap | Deskripsi |
| :--- | :--- |
| **AWAL** | (Prinsip: Berkesadaran, Bermakna, Menggembirakan)<br> [Tulis aktivitas pembuka] |
| **INTI** | **Memahami**: [Tulis aktivitas perolehan konsep]<br><br>**Mengaplikasi**: [Tulis aktivitas praktik/penerapan]<br><br>**Merefleksi**: [Tulis aktivitas perenungan makna/nilai] |
| **PENUTUP** | (Prinsip: Konstruktif, Umpan Balik)<br> [Tulis aktivitas penutup] |

## D. Asesmen Pembelajaran

| Jenis Asesmen | Deskripsi |
| :--- | :--- |
| **Asesmen Awal** | [Rencana asesmen diagnostik] |
| **Asesmen Proses** | [Rencana asesmen formatif selama pembelajaran] |
| **Asesmen Akhir** | [Rencana asesmen sumatif] |

<br><br>

Tabel berikut harus dirender dengan border='0' atau borderless saat di-copy ke Word (tidak boleh ada garis):

| Mengetahui,<br>Kepala Madrasah | ${formData.tempatTandaTangan}, ${formattedDate}<br>Guru Mata Pelajaran |
| :---: | :---: |
| <br><br><br><br> | <br><br><br><br> |
| **${formData.namaKamad}**<br>NIP. ${formData.nipKamad} | **${formData.namaGuru}**<br>NIP. ${formData.nipGuru} |

`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-pro',
        contents: prompt,
      });

      if (response.text) {
        setResult(response.text);
      } else {
        throw new Error("Tidak ada balasan dari AI.");
      }
    } catch (err: any) {
      console.error(err);
      let errMsg = err.message || "Terjadi kesalahan saat menghubungi API.";
      
      // Auto-retry handling for rate limits or overloaded servers
      if (errMsg.toLowerCase().includes('quota') || errMsg.toLowerCase().includes('limit') || errMsg.toLowerCase().includes('429') || errMsg.toLowerCase().includes('503')) {
        setError('Server sibuk atau limit kuota tercapai. Menunggu untuk mencoba kembali secara otomatis...');
        setRetryTimer(30); // 30 seconds countdown
      } else {
        setError(errMsg);
      }
    } finally {
      if (retryTimer === 0) setLoading(false);
    }
  };

  const handleDownloadWord = () => {
    if (!result) return;
    
    // Convert current Markdown + HTML string to a Word compatible format
    const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' "+
            "xmlns:w='urn:schemas-microsoft-com:office:word' "+
            "xmlns='http://www.w3.org/TR/REC-html40'>"+
            "<head><meta charset='utf-8'><title>Perangkat Ajar</title>"+
            "<style>"+
            "body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; }"+
            "table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }"+
            "table, th, td { border: 1px solid black; }"+
            "th, td { padding: 8px; text-align: left; }"+
            ".no-border, .no-border th, .no-border td { border: none; }"+
            "h1 { font-size: 16pt; text-align: center; }"+
            "h2 { font-size: 14pt; margin-top: 20px; }"+
            "h3 { font-size: 12pt; margin-top: 15px; }"+
            "</style>"+
            "</head><body>";
            
     const footer = "</body></html>";
     
     // Basic Markdown to HTML conversion for Word Document
     let htmlContent = result
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/\*\*(.*?)\*\*/gim, '<b>$1</b>')
        .replace(/\*(.*?)\*/gim, '<i>$1</i>')
        .replace(/!\[.*?\]\((.*?)\)/gim, '')
        .replace(/\[(.*?)\]\((.*?)\)/gim, '<a href="$2">$1</a>')
        .replace(/\n\n/gim, '<p></p>')
        .replace(/\n/gim, '<br>');
        
     // Markdown tables to HTML tables (super basic conversion logic for standard cases)
     // To make it better, we fetch the rendered HTML from the preview div
     const previewEl = document.getElementById('preview-content');
     if (previewEl) {
        // Use the actual rendered HTML preserving the layout
        htmlContent = previewEl.innerHTML;
     }

     const sourceHTML = header + htmlContent + footer;
     const blob = new Blob(['\uFEFF', sourceHTML], { type: 'application/msword' });
     saveAs(blob, `Perangkat_Ajar_${formData.mataPelajaran.replace(/\s+/g, '_')}_${formData.tingkatKelas.replace(/[^a-zA-Z0-9]/g, '_')}.doc`);
  };

  return (
    <div className="min-h-screen bg-emerald-50 text-slate-800 font-sans p-4 md:p-6 lg:p-8">
      {/* Header */}
      <header className="max-w-7xl mx-auto mb-8 flex items-center gap-3 border-b-2 border-emerald-200 pb-4">
        <div className="bg-emerald-600 text-white p-2.5 rounded-lg">
          <FileText className="w-6 h-6" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-emerald-800 tracking-tight">Perangkat Mengajar Madrasahku</h1>
          <p className="text-emerald-600/80 font-medium text-sm md:text-base">Asisten AI Cepat & Akurat untuk Pendidik Madrasah</p>
        </div>
      </header>

      {/* Main Grid */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: Input Form */}
        <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col h-auto lg:h-[calc(100vh-140px)]">
          <div className="bg-emerald-800 text-white p-4 flex items-center gap-2">
            <Settings2 className="w-5 h-5 text-emerald-300" />
            <h2 className="font-semibold">Pusat Pengaturan</h2>
          </div>
          
          <div className="p-5 overflow-y-auto flex-1 space-y-5 scrollbar-thin">
            
            {/* Identity Group */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">Identitas Dasar</h3>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Tingkat / Kelas</label>
                <select name="tingkatKelas" value={formData.tingkatKelas} onChange={handleChange} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow">
                  {KELAS_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Mata Pelajaran</label>
                <select name="mataPelajaran" value={formData.mataPelajaran} onChange={handleChange} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow">
                  {MATA_PELAJARAN.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Semester</label>
                  <select name="semester" value={formData.semester} onChange={handleChange} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow">
                    <option value="Ganjil">Ganjil</option>
                    <option value="Genap">Genap</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Jml Pertemuan</label>
                  <input type="number" name="jumlahPertemuan" value={formData.jumlahPertemuan} onChange={handleChange} min={1} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Nama Madrasah</label>
                <input type="text" name="namaMadrasah" value={formData.namaMadrasah} onChange={handleChange} placeholder="Contoh: MIN 1 Jakarta" className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow" />
              </div>
            </div>

            {/* Content Group */}
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">Materi & Metode</h3>
              
              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Judul Materi Pembelajaran</label>
                <input type="text" name="judulMateri" value={formData.judulMateri} onChange={handleChange} placeholder="Contoh: Sifat-sifat Cahaya" className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow" />
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-slate-700">Metode Pembelajaran</label>
                <select name="metodePembelajaran" value={formData.metodePembelajaran} onChange={handleChange} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow">
                  {METODE_PEMBELAJARAN.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                </select>
              </div>
            </div>

            {/* Signature Group */}
            <div className="space-y-4 pt-2 pb-4">
              <h3 className="text-xs font-bold text-emerald-600 uppercase tracking-wider bg-emerald-50 px-2 py-1 rounded">Administrasi Tanda Tangan</h3>
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Tempat</label>
                  <input type="text" name="tempatTandaTangan" value={formData.tempatTandaTangan} onChange={handleChange} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow" />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-slate-700">Tanggal</label>
                  <input type="date" name="tanggal" value={formData.tanggal} onChange={handleChange} className="w-full bg-white border border-slate-200 text-sm rounded-lg p-2.5 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition-shadow" />
                </div>
              </div>

              <div className="space-y-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase">Penyusun / Guru</label>
                  <div className="mt-1 space-y-2">
                    <input type="text" name="namaGuru" value={formData.namaGuru} onChange={handleChange} placeholder="Nama Lengkap & Gelar" className="w-full bg-white border border-slate-200 text-sm rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                    <input type="text" name="nipGuru" value={formData.nipGuru} onChange={handleChange} placeholder="NIP / NPK" className="w-full bg-white border border-slate-200 text-sm rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <label className="text-xs font-semibold text-slate-500 uppercase">Kepala Madrasah</label>
                  <div className="mt-1 space-y-2">
                    <input type="text" name="namaKamad" value={formData.namaKamad} onChange={handleChange} placeholder="Nama Lengkap & Gelar" className="w-full bg-white border border-slate-200 text-sm rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                    <input type="text" name="nipKamad" value={formData.nipKamad} onChange={handleChange} placeholder="NIP / NPK" className="w-full bg-white border border-slate-200 text-sm rounded-md p-2 focus:ring-1 focus:ring-emerald-500 focus:border-emerald-500" />
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Action Footer */}
          <div className="p-4 bg-white border-t border-emerald-100">
            <button
              onClick={generateDocument}
              disabled={loading || retryTimer > 0}
              className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-semibold py-3 px-4 rounded-xl shadow-sm transition-all transform active:scale-95"
            >
              {loading ? (
                 <><Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses AI...</>
              ) : retryTimer > 0 ? (
                 <>Menunggu {retryTimer}s untuk mencoba lagi...</>
              ) : (
                 <><Play className="w-5 h-5 fill-current" /> Buat Perangkat Ajar</>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400 mt-2">Selaras dengan KMA 1503 & CP 046 Tahun 2025</p>
          </div>
        </div>

        {/* RIGHT COLUMN: Preview & Results */}
        <div className="lg:col-span-8 bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden flex flex-col h-auto lg:h-[calc(100vh-140px)]">
          <div className="bg-emerald-50 border-b border-emerald-100 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sticky top-0 z-10 hidden-scrollbar">
            <h2 className="font-semibold text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Lembar Kerja (A4 Draft)
            </h2>
            {result && (
              <button
                onClick={handleDownloadWord}
                className="flex items-center gap-2 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 px-4 py-2 min-h-[44px] rounded-lg text-sm font-semibold transition-colors w-full sm:w-auto justify-center"
              >
                <Download className="w-4 h-4" />
                Unduh DOCX / Word
              </button>
            )}
          </div>

          <div className="flex-1 p-0 overflow-y-auto bg-slate-100 hidden-scrollbar">
             {error && (
                <div className="m-6 p-4 bg-orange-50 border border-orange-200 rounded-xl flex items-start gap-3">
                  <AlertTriangle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-orange-800 font-semibold mb-1">Peringatan Sistem</h4>
                    <p className="text-orange-700 text-sm">{error}</p>
                    {retryTimer > 0 && (
                      <p className="text-orange-600 text-xs mt-2 font-mono">Retrying in {retryTimer}s...</p>
                    )}
                  </div>
                </div>
              )}

            {!result && !loading && !error && (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 p-8 text-center">
                <FileText className="w-16 h-16 text-slate-200 mb-4" />
                <p className="font-medium text-slate-500 mb-2">Belum ada dokumen</p>
                <p className="text-sm max-w-sm">Isi parameter pengajaran di sebelah kiri, lalu tekan "Buat Perangkat Ajar" untuk melihat kehebatan AI menyusun RPP otomatis sesuai CP terbaru.</p>
              </div>
            )}

            {loading && (
               <div className="h-full flex flex-col items-center justify-center p-8">
                  <div className="w-16 h-16 relative mb-6">
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-100"></div>
                    <div className="absolute inset-0 rounded-full border-4 border-emerald-600 border-t-transparent animate-spin"></div>
                  </div>
                  <h3 className="text-lg font-semibold text-emerald-800 mb-2">AI Sedang Meracik Modul...</h3>
                  <div className="space-y-2 max-w-md text-center">
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Menyesuaikan dengan regulasi terbaru CP 046/2025.</p>
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Mengintegrasikan Pendidikan Berbasis Cinta.</p>
                    <p className="text-sm text-slate-500 flex items-center justify-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400"/> Menyusun rencana {formData.jumlahPertemuan} pertemuan detail.</p>
                  </div>
               </div>
            )}

            {result && !loading && (
              <div className="p-4 md:p-8 flex justify-center">
                 {/* A4 Paper Container */}
                 <div 
                   id="preview-content"
                   className="bg-white w-full max-w-[210mm] min-h-[297mm] shadow-[0_0_15px_rgba(0,0,0,0.1)] rounded-sm p-6 md:p-12"
                   style={{ 
                     // Added some styling that might translate well to the downloaded doc
                     '--tw-prose-body': '#1e293b',
                     '--tw-prose-headings': '#0f172a',
                     '--tw-prose-links': '#059669',
                     '--tw-prose-bold': '#0f172a',
                     '--tw-prose-counters': '#64748b',
                     '--tw-prose-bullets': '#cbd5e1',
                     '--tw-prose-hr': '#e2e8f0',
                     '--tw-prose-quotes': '#111827',
                     '--tw-prose-quote-borders': '#e2e8f0',
                     '--tw-prose-captions': '#64748b',
                     '--tw-prose-code': '#111827',
                     '--tw-prose-pre-code': '#e2e8f0',
                     '--tw-prose-pre-bg': '#1e293b',
                     '--tw-prose-th-borders': '#cbd5e1',
                     '--tw-prose-td-borders': '#e2e8f0',
                   } as React.CSSProperties}
                 >
                   <ReactMarkdown 
                     remarkPlugins={[remarkGfm]}
                     rehypePlugins={[rehypeRaw]}
                     components={{
                       h1: ({node, ...props}) => <h1 className="text-xl font-bold uppercase text-center mb-6" {...props} />,
                       h2: ({node, ...props}) => <h2 className="text-lg font-bold mt-8 mb-4 border-b border-slate-200 pb-2" {...props} />,
                       h3: ({node, ...props}) => <h3 className="text-base font-bold mt-6 mb-3" {...props} />,
                       p: ({node, ...props}) => <p className="mb-4 text-sm leading-relaxed text-justify" {...props} />,
                       table: ({node, ...props}) => (
                         <div className="overflow-x-auto mb-6 w-full">
                           <table className="w-full border-collapse border border-slate-300 text-sm" {...props} />
                         </div>
                       ),
                       thead: ({node, ...props}) => <thead className="bg-slate-100" {...props} />,
                       th: ({node, ...props}) => <th className="border border-slate-300 px-4 py-2 font-semibold text-left align-top" {...props} />,
                       td: ({node, ...props}) => <td className="border border-slate-300 px-4 py-2 align-top" {...props} />,
                       ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 text-sm space-y-1" {...props} />,
                       ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-4 text-sm space-y-1" {...props} />,
                       li: ({node, ...props}) => <li className="pl-1" {...props} />,
                       strong: ({node, ...props}) => <strong className="font-semibold" {...props} />,
                     }}
                   >
                     {result}
                   </ReactMarkdown>
                 </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Required style to handle custom scrollbar for better UI */}
      <style dangerouslySetInnerHTML={{__html: `
        .hidden-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .hidden-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .hidden-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .hidden-scrollbar:hover::-webkit-scrollbar-thumb {
          background-color: rgba(16, 185, 129, 0.4);
        }
        
        /* Specific CSS rules added for word export compatibility */
        #preview-content table {
           page-break-after: auto;
        }
        #preview-content tr {
           page-break-inside: avoid;
           page-break-after: auto;
        }
        #preview-content td {
           page-break-inside: avoid;
           page-break-after: auto;
        }
      `}} />
    </div>
  );
}

