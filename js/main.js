if('serviceWorker' in navigator){
    window.addEventListener('load', function(){
        navigator.serviceWorker.register('/serviceworker.js').then(
            function(reg){
                document.getElementById('load-in-bg')
                .addEventListener('click', ()=>{
                    reg.sync.register('image-fetch')
                    .then(()=>{
                        console.log('sync registered');
                    }).catch((err)=>{
                        console.log('unable to fetch image. err: ', err);
                    })
                })
                
            }, function(err){
                //registrasi failed
                console.log('service worker registration failed : ', err);
            }
        )
    })
}


/*
* IndexedDB
* */
createDatabase();
function createDatabase() {
    if (!('indexedDB' in window)){
        console.log('Web Browser tidak mendukung Indexed DB');
        return;
    }
    var request = window.indexedDB.open('responsi-uts',1);
    request.onerror = errordbHandle;
    request.onupgradeneeded = (e)=>{
        var db = e.target.result;
        db.onerror = errordbHandle;
        var objectStore = db.createObjectStore('obat',
            {keyPath: 'kode_produk'});
        console.log('Object store obat berhasil dibuat');
    }
    request.onsuccess = (e) => {
        db = e.target.result;
        db.error = errordbHandle;
        console.log('Berhasil melakukan koneksi ke database lokal');
        // lakukan sesuatu ...
        bacaDariDB();
    }
}

function errordbHandle(e) {
    console.log('Error DB : '+e.target.errorCode);
}

var tabel = document.getElementById('tabel-obat'),
    kode_produk = document.getElementById('kode_produk'),
    nama_obat = document.getElementById('nama_obat'),
    harga_obat = document.getElementById('harga_obat'),
    form = document.getElementById('form-tambah');

form.addEventListener('submit',tambahBaris);
tabel.addEventListener('click',hapusBaris);

function tambahBaris(e){
    // cek kode apakah sudah ada
    if (tabel.rows.namedItem(kode_produk.value)){
        alert('Error: kode sudah terdaftar');
        e.preventDefault();
        return;
    }
    // masukkan data ke database
    tambahKeDB({
        kode_produk : kode_produk.value,
        nama_obat : nama_obat.value,
        harga_obat : harga_obat.valueph
    });

    // append baris baru dari data form
    var baris = tabel.insertRow();
    baris.id = kode_produk.value;
    baris.insertCell().appendChild(document.createTextNode(kode_produk.value));
    baris.insertCell().appendChild(document.createTextNode(nama_obat.value));
    baris.insertCell().appendChild(document.createTextNode("Rp "+harga_obat.value+",-"));

    // tambah bagian button delete
    var btn = document.createElement('input');
    btn.type = 'button';
    btn.value = 'Hapus';
    btn.id = kode_produk.value;
    btn.className = 'btn btn-sm btn-danger';
    baris.insertCell().appendChild(btn);
    e.preventDefault();
}

function tambahKeDB(obat) {
    var objectStore = buatTransaksi().objectStore('obat');
    var request = objectStore.add(obat);
    request.onerror = errordbHandle;
    request.onsuccess = console.log('Obat ['+obat.kode_produk+'] '
        +'berhasil di tambahkan')
}

function buatTransaksi() {
    var transaction = db.transaction(['obat'],'readwrite');
    transaction.onerror = errordbHandle;
    transaction.complete = console.log('Transaksi selesai');

    return transaction;
}

function bacaDariDB() {
    var objectStore = buatTransaksi().objectStore('obat');
    objectStore.openCursor().onsuccess = (e) => {
        var result = e.target.result;
        if (result){
            console.log('Membaca [' + result.value.kode_produk +'] dari DB');
            // append baris dari database
            var baris = tabel.insertRow();
            baris.id = kode_produk.value;
            baris.insertCell().appendChild(document.createTextNode(result.value.kode_produk));
            baris.insertCell().appendChild(document.createTextNode(result.value.nama_obat));
            baris.insertCell().appendChild(document.createTextNode(result.value.harga_obat));

            // append tombol hapus
            var btn = document.createElement('input');
            btn.type = 'button';
            btn.value = 'Hapus';
            btn.id = result.value.kode_produk;
            btn.className = 'btn btn-sm btn-danger';
            baris.insertCell().appendChild(btn);
            result.continue();
        }
    }
}

function hapusBaris(e) {
    if (e.target.type ==='button'){
        var hapus = confirm('Apakah yakin menghapus data?');
        if (hapus){
            tabel.deleteRow(tabel.rows.namedItem(e.target.id).sectionRowIndex);
            hapusDariDB(e.target.id);
        }
    }
}

function hapusDariDB(kode_produk) {
    var objectStore = buatTransaksi().objectStore('obat');
    var request = objectStore.delete(kode_produk);
    request.onerror = errordbHandle;
    request.onsuccess = console.log('Obat ['+kode_produk+'] terhapus');
}