const API_URL =
  "https://script.google.com/macros/s/AKfycbzSRkLyYQWCWLlp-D_1wDMd1BOa8aR4YR5XNPD8H8nBGwoukhWOF-zX-CxRQvYAdHE/exec";

// Elemen HTML
const btnTambah = document.getElementById("btn-tambah");
const formSection = document.getElementById("form-section");
const formKegiatan = document.getElementById("form-kegiatan");
const btnBatal = document.getElementById("btn-batal");
const daftarKegiatan = document.getElementById("daftar-kegiatan");
const btnSubmit = document.getElementById("btn-submit");
const btnDownloadWord = document.getElementById("btn-download-word");

let dataGlobalKegiatan = [];
const ITEM_PER_PAGE = 5; // Batas jumlah kegiatan per halaman

btnTambah.addEventListener("click", function () {
  formSection.hidden = false;
  btnTambah.hidden = true;
});

btnBatal.addEventListener("click", function () {
  formKegiatan.reset();
  formSection.hidden = true;
  btnTambah.hidden = false;
});

// ==========================================
// PENGIRIMAN DATA (SIMPAN)
// ==========================================
formKegiatan.addEventListener("submit", function (e) {
  e.preventDefault();
  btnSubmit.textContent = "Menyimpan...";
  btnSubmit.disabled = true;

  const dataForm = {
    tanggal: document.getElementById("tanggal").value,
    aktivitas: document.getElementById("aktivitas").value,
    mulai: document.getElementById("mulai").value,
    selesai: document.getElementById("selesai").value,
    action: "save",
  };

  const fotoInput = document.getElementById("foto");
  if (fotoInput.files.length > 0) {
    const file = fotoInput.files[0];
    const reader = new FileReader();

    reader.onload = function (event) {
      const img = new Image();
      img.onload = function () {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 600;
        const scaleSize = MAX_WIDTH / img.width;
        canvas.width = MAX_WIDTH;
        canvas.height = img.height * scaleSize;

        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const compressedBase64 = canvas.toDataURL("image/jpeg", 0.7);

        dataForm.fotoBase64 = compressedBase64;
        dataForm.namaFoto = file.name;
        dataForm.mimeType = "image/jpeg";

        kirimData(dataForm);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  } else {
    kirimData(dataForm);
  }
});

function kirimData(dataForm) {
  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(dataForm),
  })
    .then((response) => response.json())
    .then((result) => {
      btnSubmit.textContent = "Simpan Kegiatan";
      btnSubmit.disabled = false;
      if (result.success) {
        alert("Kegiatan berhasil disimpan!");
        formKegiatan.reset();
        formSection.hidden = true;
        btnTambah.hidden = false;
        muatKegiatan();
      } else {
        alert("Gagal menyimpan: " + result.message);
      }
    })
    .catch((error) => {
      btnSubmit.textContent = "Simpan Kegiatan";
      btnSubmit.disabled = false;
      alert("Terjadi kesalahan jaringan.");
    });
}

// ==========================================
// FUNGSI MENGHAPUS KEGIATAN
// ==========================================
function hapusKegiatan(idKegiatan) {
  if (!confirm("Apakah Anda yakin ingin menghapus kegiatan ini?")) {
    return;
  }

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "delete", id: idKegiatan }),
  })
    .then((response) => response.json())
    .then((result) => {
      if (result.success) {
        alert("Kegiatan berhasil dihapus!");
        muatKegiatan();
      } else {
        alert("Gagal menghapus: " + result.message);
      }
    })
    .catch((error) => {
      alert("Terjadi kesalahan jaringan.");
    });
}

// ==========================================
// MENAMPILKAN DATA WEB (DENGAN PAGINASI)
// ==========================================
function formatTanggal(tanggal) {
  if (!tanggal) return "-";
  const bagian = tanggal.split("-");
  if (bagian.length !== 3) return tanggal;
  return `${bagian[2]}/${bagian[1]}/${bagian[0]}`;
}

function buatSel(teks) {
  const td = document.createElement("td");
  td.textContent = teks || "-";
  return td;
}

let halamanSekarang = 1;

function tampilkanKegiatan(halamanAktif = 1) {
  daftarKegiatan.replaceChildren();

  const semuaKegiatan = [...dataGlobalKegiatan].sort((a, b) => {
    const tanggalA = (a.tanggal || "").split("T")[0];
    const tanggalB = (b.tanggal || "").split("T")[0];
    if (tanggalA < tanggalB) return -1;
    if (tanggalA > tanggalB) return 1;
    return dataGlobalKegiatan.indexOf(a) - dataGlobalKegiatan.indexOf(b);
  });

  const totalData = semuaKegiatan.length;
  const totalHalaman = Math.max(1, Math.ceil(totalData / ITEM_PER_PAGE));
  halamanSekarang = Math.min(Math.max(1, halamanAktif), totalHalaman);

  if (totalData === 0) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 6;
    td.textContent = "Belum ada kegiatan yang tersimpan.";
    td.style.textAlign = "center";
    tr.appendChild(td);
    daftarKegiatan.appendChild(tr);
    buatTombolHalaman(0, 1);
    return;
  }

  const startIndex = (halamanSekarang - 1) * ITEM_PER_PAGE;
  const dataHalamanIni = semuaKegiatan.slice(
    startIndex,
    startIndex + ITEM_PER_PAGE,
  );

  dataHalamanIni.forEach(function (item, index) {
    const tr = document.createElement("tr");

    const nomorUrut = startIndex + index + 1;
    tr.appendChild(buatSel(String(nomorUrut)));

    let tglDisplay = item.tanggal || "-";
    if (tglDisplay.includes("T")) {
      tglDisplay = tglDisplay.split("T")[0];
    }

    tr.appendChild(buatSel(formatTanggal(tglDisplay)));
    tr.appendChild(buatSel(item.aktivitas));
    tr.appendChild(buatSel(item.waktu));

    const tdFoto = document.createElement("td");
    if (item.fotoUrl) {
      const link = document.createElement("a");
      link.href = item.fotoUrl;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.textContent = "Lihat foto";
      tdFoto.appendChild(link);
    } else {
      tdFoto.textContent = "-";
    }
    tr.appendChild(tdFoto);

    // Pembuatan Tombol Hapus Menggunakan Class CSS
    const tdAksi = document.createElement("td");
    const btnHapus = document.createElement("button");
    btnHapus.textContent = "✖";
    btnHapus.className = "btn-hapus"; // <-- Diatur di styles.css
    btnHapus.title = "Hapus Kegiatan";
    btnHapus.onclick = function () {
      hapusKegiatan(item.id);
    };

    tdAksi.appendChild(btnHapus);
    tr.appendChild(tdAksi);
    daftarKegiatan.appendChild(tr);
  });

  buatTombolHalaman(totalData, halamanSekarang);
}

function buatTombolHalaman(totalData, halamanAktif) {
  let wadahHalaman = document.getElementById("wadah-halaman");

  if (!wadahHalaman) {
    wadahHalaman = document.createElement("div");
    wadahHalaman.id = "wadah-halaman";
    wadahHalaman.className = "pagination-container"; // <-- Diatur di styles.css
    daftarKegiatan.parentElement.insertAdjacentElement(
      "afterend",
      wadahHalaman,
    );
  }

  wadahHalaman.replaceChildren();

  const totalHalaman = Math.ceil(totalData / ITEM_PER_PAGE);
  if (totalHalaman <= 1) return;

  function buatTombol(teks, tujuan, nonaktif = false, aktif = false) {
    const tombol = document.createElement("button");
    tombol.type = "button";
    tombol.textContent = teks;
    tombol.disabled = nonaktif;
    tombol.className = "page-btn"; // <-- Diatur di styles.css

    if (aktif) tombol.classList.add("active");

    tombol.addEventListener("click", function () {
      if (!nonaktif) tampilkanKegiatan(tujuan);
    });

    wadahHalaman.appendChild(tombol);
  }

  buatTombol("‹ Sebelumnya", halamanAktif - 1, halamanAktif === 1);

  for (let i = 1; i <= totalHalaman; i++) {
    buatTombol(String(i), i, false, i === halamanAktif);
  }

  buatTombol("Berikutnya ›", halamanAktif + 1, halamanAktif === totalHalaman);

  const info = document.createElement("div");
  const awal = (halamanAktif - 1) * ITEM_PER_PAGE + 1;
  const akhir = Math.min(halamanAktif * ITEM_PER_PAGE, totalData);

  info.textContent = `Menampilkan ${awal}–${akhir} dari ${totalData} kegiatan | Halaman ${halamanAktif} dari ${totalHalaman}`;
  info.className = "page-info"; // <-- Diatur di styles.css

  wadahHalaman.appendChild(info);
}

function muatKegiatan() {
  const callbackName = "kodeLookbookCallback_" + Date.now();
  const script = document.createElement("script");
  const timeout = setTimeout(function () {
    bersihkan();
    console.error("Waktu pemuatan kegiatan habis.");
  }, 15000);

  function bersihkan() {
    clearTimeout(timeout);
    delete window[callbackName];
    script.remove();
  }

  window[callbackName] = function (hasil) {
    bersihkan();
    if (hasil && hasil.success) {
      dataGlobalKegiatan = Array.isArray(hasil.data) ? hasil.data : [];
      tampilkanKegiatan(1);
    } else {
      console.error(
        "Gagal memuat kegiatan:",
        hasil?.message || "Respons tidak valid.",
      );
    }
  };

  script.onerror = function () {
    bersihkan();
    console.error("Gagal menghubungi Google Sheets.");
  };

  script.src =
    API_URL + "?action=list&callback=" + encodeURIComponent(callbackName);
  document.body.appendChild(script);
}

// ==========================================
// LOGIKA DOWNLOAD KE WORD (KRONOLOGIS / TIDAK DIBALIK)
// ==========================================
function formatTanggalWord(tanggalStr) {
  if (!tanggalStr) return "-";
  let d = tanggalStr.includes("T")
    ? new Date(tanggalStr.split("T")[0])
    : new Date(tanggalStr);
  if (isNaN(d.getTime())) return tanggalStr;
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${hari[d.getDay()]},<br>${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function hitungMenit(waktuStr) {
  if (!waktuStr) return 0;
  let normalized = waktuStr.replace("–", "-").replace(" - ", "-");
  if (!normalized.includes("-")) return 0;

  let parts = normalized.split("-");
  let mParts = parts[0].trim().split(":");
  let sParts = parts[1].trim().split(":");
  if (mParts.length < 2 || sParts.length < 2) return 0;

  let totalMulai = parseInt(mParts[0]) * 60 + parseInt(mParts[1]);
  let totalSelesai = parseInt(sParts[0]) * 60 + parseInt(sParts[1]);

  let selisihMenit = totalSelesai - totalMulai;
  return selisihMenit > 0 ? selisihMenit : 0;
}

function formatTotalWaktu(totalMenit) {
  if (totalMenit <= 0) return "-";
  let jam = Math.floor(totalMenit / 60);
  let menit = totalMenit % 60;
  if (jam > 0 && menit === 0) return `${jam} jam`;
  if (jam > 0 && menit > 0) return `${jam} jam ${menit} menit`;
  return `${menit} menit`;
}

btnDownloadWord.addEventListener("click", function () {
  if (!dataGlobalKegiatan || dataGlobalKegiatan.length === 0) {
    alert("Belum ada data untuk diunduh.");
    return;
  }

  let groupedData = {};
  let dateKeys = [];

  dataGlobalKegiatan.forEach((item) => {
    let dateKey = item.tanggal;
    if (dateKey.includes("T")) dateKey = dateKey.split("T")[0];

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = [];
      dateKeys.push(dateKey);
    }
    groupedData[dateKey].push(item);
  });

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Logbook Kegiatan</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; }
        th, td { border: 1pt solid black; padding: 8px; vertical-align: middle; }
        th { text-align: center; font-weight: bold; }
      </style>
    </head>
    <body>
    <h2 style="text-align:center; font-family: 'Times New Roman', Times, serif;">Logbook Kegiatan Magang</h2>
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>Hari, Tanggal</th>
          <th>Waktu</th>
          <th>Aktivitas/Kegiatan</th>
          <th>Jumlah Waktu<br>Kegiatan<br>(menit/jam)</th>
          <th>Dokumentasi<br>Kegiatan</th>
        </tr>
      </thead>
      <tbody>
  `;

  let nomor = 1;

  dateKeys.forEach((dateKey) => {
    let activities = groupedData[dateKey];
    let rowCount = activities.length;
    let totalMenitHari = 0;

    activities.forEach((act) => {
      totalMenitHari += hitungMenit(act.waktu);
    });

    let durasiHariStr = formatTotalWaktu(totalMenitHari);
    let tanggalStr = formatTanggalWord(dateKey);

    activities.forEach((item, index) => {
      let waktuFormat = (item.waktu || "")
        .replace("–", "-")
        .replace(/:/g, ".")
        .replace("-", " - ");
      let fotoHTML = "-";
      if (item.fotoBase64) {
        fotoHTML = `<img src="${item.fotoBase64}" alt="Dokumentasi" height="113">`;
      }

      tableHTML += `<tr>`;
      if (index === 0) {
        tableHTML += `<td rowspan="${rowCount}" style="text-align:center;">${nomor}</td>`;
        tableHTML += `<td rowspan="${rowCount}">${tanggalStr}</td>`;
      }
      tableHTML += `<td style="text-align:center;">${waktuFormat}</td>`;
      tableHTML += `<td>${item.aktivitas}</td>`;
      if (index === 0) {
        tableHTML += `<td rowspan="${rowCount}" style="text-align:center;">${durasiHariStr}</td>`;
      }
      tableHTML += `<td style="text-align:center; padding: 4px;">${fotoHTML}</td>`;
      tableHTML += `</tr>`;
    });
    nomor++;
  });

  tableHTML += `</tbody></table></body></html>`;

  const blob = new Blob(["\ufeff", tableHTML], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Logbook_Magang.doc";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

muatKegiatan();

// ==========================================
// LOGIKA GAMBAR MENGAMBANG RANDOM & POSISI ACAK
// ==========================================
function setGambarRandom() {
  const imgElement = document.getElementById("gambar-random");
  if (!imgElement) return;

  // 1. Daftar 10 gambar lokal
  const daftarGambar = [
    "Gambar1.jpg",
    "Gambar2.jpg",
    "Gambar3.jpg",
    "Gambar4.jpg",
    "Gambar5.jpg",
    "Gambar6.jpg",
    "Gambar7.jpg",
    "Gambar8.jpg",
    "Gambar9.jpg",
    "Gambar10.jpg",
    "Gambar11.jpg",
    "Gambar12.jpg",
    "Gambar13.jpg",
    "Gambar14.jpg",
    "Gambar15.jpg",
    "Gambar16.jpg",
    "Gambar17.jpg",
    "Gambar18.jpg",
    "Gambar19.jpg",
    "Gambar20.jpg",
    "Gambar21.jpg",
    "Gambar22.jpg",
    "Gambar23.jpg",
    "Gambar24.jpg",
    "Gambar25.jpg",
    "Gambar26.jpg",
    "Gambar27.jpg",
    "Gambar28.jpg",
    "Gambar29.jpg",
    "Gambar30.jpg",
    "Gambar31.jpg",
    "Gambar32.jpg",
    "Gambar33.jpg",
    "Gambar34.jpg",
    "Gambar35.jpg",
    "Gambar36.jpg",
    "Gambar37.jpg",
    "Gambar38.jpg",
    "Gambar39.jpg",
    "Gambar40.jpg",
  ];

  // 1. Pilih file gambar secara acak saat pertama dimuat
  const indeksGambar = Math.floor(Math.random() * daftarGambar.length);
  imgElement.src = daftarGambar[indeksGambar];

  // 2. Fungsi untuk memindahkan gambar ke posisi acak baru di area yang aman
  function pindahKePosisiAcak() {
    // Batasi area acak agar tidak keluar layar atau menutupi form utama
    const randomTop = Math.floor(Math.random() * 400) + 80; // Jarak aman dari atas (80px - 480px)
    const randomSide = Math.random(); // Menentukan kiri atau kanan

    imgElement.style.top = randomTop + "px";

    if (randomSide < 0.5) {
      imgElement.style.left = Math.floor(Math.random() * 150) + 20 + "px";
      imgElement.style.right = "auto";
    } else {
      imgElement.style.right = Math.floor(Math.random() * 150) + 20 + "px";
      imgElement.style.left = "auto";
    }
  }

  // Set posisi awal secara acak
  pindahKePosisiAcak();

  // 3. FITUR LAPTOP: Gambar "menghindar" ke arah acak saat kursor mendekat
  imgElement.onmouseenter = function () {
    pindahKePosisiAcak();
  };

  // 4. FITUR HP: Gambar berpindah tempat saat disentuh/dipencet
  imgElement.onclick = function () {
    pindahKePosisiAcak();
  };
}

// Panggil fungsinya saat halaman pertama kali dimuat
setGambarRandom();

// ==========================================
// LOGIKA DOWNLOAD KE WORD (PENGATURAN GAMBAR 30mm)
// ==========================================
function formatTanggalWord(tanggalStr) {
  if (!tanggalStr) return "-";
  let d = tanggalStr.includes("T")
    ? new Date(tanggalStr.split("T")[0])
    : new Date(tanggalStr);
  if (isNaN(d.getTime())) return tanggalStr;
  const hari = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
  const bulan = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  return `${hari[d.getDay()]},<br>${d.getDate()} ${bulan[d.getMonth()]} ${d.getFullYear()}`;
}

function hitungMenit(waktuStr) {
  if (!waktuStr) return 0;
  let normalized = waktuStr.replace("–", "-").replace(" - ", "-");
  if (!normalized.includes("-")) return 0;

  let parts = normalized.split("-");
  let mParts = parts[0].trim().split(":");
  let sParts = parts[1].trim().split(":");
  if (mParts.length < 2 || sParts.length < 2) return 0;

  let totalMulai = parseInt(mParts[0]) * 60 + parseInt(mParts[1]);
  let totalSelesai = parseInt(sParts[0]) * 60 + parseInt(sParts[1]);

  let selisihMenit = totalSelesai - totalMulai;
  return selisihMenit > 0 ? selisihMenit : 0;
}

function formatTotalWaktu(totalMenit) {
  if (totalMenit <= 0) return "-";
  let jam = Math.floor(totalMenit / 60);
  let menit = totalMenit % 60;
  if (jam > 0 && menit === 0) return `${jam} jam`;
  if (jam > 0 && menit > 0) return `${jam} jam ${menit} menit`;
  return `${menit} menit`;
}

btnDownloadWord.addEventListener("click", function () {
  if (!dataGlobalKegiatan || dataGlobalKegiatan.length === 0) {
    alert("Belum ada data untuk diunduh.");
    return;
  }

  let groupedData = {};
  let dateKeys = [];

  dataGlobalKegiatan.forEach((item) => {
    let dateKey = item.tanggal;
    if (dateKey.includes("T")) dateKey = dateKey.split("T")[0];

    if (!groupedData[dateKey]) {
      groupedData[dateKey] = [];
      dateKeys.push(dateKey);
    }
    groupedData[dateKey].push(item);
  });

  let tableHTML = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
      <meta charset="utf-8">
      <title>Logbook Kegiatan</title>
      <style>
        table { border-collapse: collapse; width: 100%; font-family: 'Times New Roman', Times, serif; }
        th, td { border: 1pt solid black; padding: 8px; vertical-align: middle; }
        th { text-align: center; font-weight: bold; }
      </style>
    </head>
    <body>
    <h2 style="text-align:center; font-family: 'Times New Roman', Times, serif;">Logbook Kegiatan Magang</h2>
    <table>
      <thead>
        <tr>
          <th>No.</th>
          <th>Hari, Tanggal</th>
          <th>Waktu</th>
          <th>Aktivitas/Kegiatan</th>
          <th>Jumlah Waktu<br>Kegiatan<br>(menit/jam)</th>
          <th>Dokumentasi<br>Kegiatan</th>
        </tr>
      </thead>
      <tbody>
  `;

  let nomor = 1;

  dateKeys.forEach((dateKey) => {
    let activities = groupedData[dateKey];
    let rowCount = activities.length;
    let totalMenitHari = 0;

    activities.forEach((act) => {
      totalMenitHari += hitungMenit(act.waktu);
    });

    let durasiHariStr = formatTotalWaktu(totalMenitHari);
    let tanggalStr = formatTanggalWord(dateKey);

    activities.forEach((item, index) => {
      let waktuFormat = (item.waktu || "")
        .replace("–", "-")
        .replace(/:/g, ".")
        .replace("-", " - ");

      let fotoHTML = "-";
      if (item.fotoBase64) {
        // PERBAIKAN 2: Membatasi tinggi maksimum (height="113" setara 30mm)
        // serta memaksa lebar maksimum sel agar Word tidak melar ke samping
        fotoHTML = `<img src="${item.fotoBase64}" alt="Dokumentasi" height="113" style="max-width: 120px; height: auto;">`;
      }

      tableHTML += `<tr>`;
      if (index === 0) {
        tableHTML += `<td rowspan="${rowCount}" style="text-align:center;">${nomor}</td>`;
        tableHTML += `<td rowspan="${rowCount}">${tanggalStr}</td>`;
      }
      tableHTML += `<td style="text-align:center;">${waktuFormat}</td>`;
      tableHTML += `<td>${item.aktivitas}</td>`;
      if (index === 0) {
        tableHTML += `<td rowspan="${rowCount}" style="text-align:center;">${durasiHariStr}</td>`;
      }
      // PERBAIKAN 3: Membatasi lebar kolom tabel dokumentasi agar tidak melebar
      tableHTML += `<td style="text-align:center; padding: 4px; width: 130px;">${fotoHTML}</td>`;
      tableHTML += `</tr>`;
    });
    nomor++;
  });

  tableHTML += `</tbody></table></body></html>`;

  const blob = new Blob(["\ufeff", tableHTML], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "Logbook_Magang.doc";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
});

muatKegiatan();
