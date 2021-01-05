var keysLoaded = false;
var amiiboDatabase = null;
var amiiboZip

var g_data = null;
const populateTable = () => {
    $.getJSON("https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/database/amiibo.json", function(data) {
        amiiboDatabase = data;
        g_data = data;
        var t = $('#dataTable').DataTable();
        Object.keys(data.amiibos).forEach(function(key) {
            var ami = data.amiibos[key];
            var name = ami.name;
            var keytext = key.padStart(16, '0');
            var keylink = key.substring(2).padStart(16, '0');
            var link = "https://github.com/Falco20019/libamiibo/raw/master/libamiibo.images/Images/icon_" + keylink + ".png"
            var image = `<img src="${link}" height=46 width=46></img>`;
            t.row.add([image, name, keytext]);
        });
        t.draw(false);
        $(".hide_until_loaded").removeClass("hide_until_loaded");
        generateZip();
    });
};

const generateData = (id) => {
    var arr = new Uint8Array(540);
    arr[2] = 0x0F;
    arr[3] = 0xE0;
    // write key/amiibo num in big endian as a 64 bit value starting from offset off
    var off = 0x1DC;
    id = id.substring(2);
    for(var i = 0; i < 16; i += 2, off += 1)
    {
        arr[off] = parseInt(id.substring(i, i + 2), 16);
    }

    return arr;
};

const downloadBin = (name, id) => {
    var data = generateData(id);

    file = name + " (" + id.substr(4, 12) + (keysLoaded ? "" : ", Decrypted") + ").bin";
    console.log(file)
    download("data:application/octet-stream;base64," + base64.fromBytes(data), file, "application/octet-stream");
};

const generateZip = () => {
    const specialCharacters = ["<", ">", ":", "\"", "/", "\\", "|", "?", "*"];
    var zip = new JSZip();
    Object.keys(amiiboDatabase.amiibos).forEach((key) => {
        var ami = amiiboDatabase.amiibos[key];
        ami.series = amiiboDatabase.amiibo_series["0x"+key.substr(14, 2)]

        var file = ami.name + " (" + key.substr(4, 12) + (keysLoaded ? "" : ", Decrypted") + ").bin";

        specialCharacters.forEach((char) => {
            file = file.replace(char, "_");
        });
        
        var folder = zip.folder(ami.series);
        folder.file(file, generateData(key))
    })
    zip.generateAsync({type:"blob"}).then((content) => {
        amiiboZip = content;
        $(".hide_until_zipped").removeClass("hide_until_zipped");
    })
};
