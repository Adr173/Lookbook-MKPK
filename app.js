// ==========================================
// LOGIKA GAMBAR MENGAMBANG (DIBATASI KHUSUS LAPTOP)
// ==========================================
function setGambarRandom() {
  const imgElement = document.getElementById("gambar-random");
  if (!imgElement) return;

  // JIKA DI BUKA DI HP (Lebar layar <= 900px), Hapus elemen gambar dari HTML agar tidak memuat apa pun!
  if (window.innerWidth <= 900) {
    imgElement.remove();
    return;
  }

  // Daftar 10 gambar lokal (hanya berjalan di Laptop/Komputer)
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
    "Gambar10.jpg"
  ];

  const indeksGambar = Math.floor(Math.random() * daftarGambar.length);
  imgElement.src = daftarGambar[indeksGambar];

  function pindahKePosisiAcak() {
    const randomTop = Math.floor(Math.random() * 400) + 80;
    const randomSide = Math.random();

    imgElement.style.top = randomTop + "px";
    
    if (randomSide < 0.5) {
      imgElement.style.left = (Math.floor(Math.random() * 150) + 20) + "px";
      imgElement.style.right = "auto";
    } else {
      imgElement.style.right = (Math.floor(Math.random() * 150) + 20) + "px";
      imgElement.style.left = "auto";
    }
  }

  pindahKePosisiAcak();

  imgElement.onmouseenter = function () {
    pindahKePosisiAcak();
  };
}

setGambarRandom();
