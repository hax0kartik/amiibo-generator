
var g_data = null;
const populateTable = () => {
    $.getJSON("https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/database/amiibo.json", function(data) {
        g_data = data;
        var t = $('#dataTable').DataTable();
        Object.keys(data.amiibos).forEach(function(key) {
  	        var ami = data.amiibos[key];
            var name = ami.name;
            var keytext = key.substring(2).padStart(16, '0');
            var link = "https://github.com/Falco20019/libamiibo/raw/master/libamiibo.images/Images/icon_" + keytext + ".png"
            var image = `<img src="${link}" height=46 width=46></img>`;
            t.row.add([image, name, keytext]);
        });
        t.draw(false);
    });
};

const generate = (name, id) => {
    var arr = new Uint8Array(540);
    arr[2] = 0x0F;
    arr[3] = 0xE0;
    // write key/amiibo num in big endian as a 64 bit value starting from offset off
    var off = 0x1DC;
    for(var i = 0; i < 16; i += 2, off += 1)
    {
  	    arr[off] = parseInt(id.substring(i, i + 2), 16);
    }

    var out_s = "";
    for(var i = 0; i < arr.length; i += 1)
          out_s += String.fromCharCode(arr[i]);
          
    file = name + ".bin";
    console.log(file)
    download("data:application/octet-stream;base64," + btoa(out_s), file, "application/octet-stream");
    //g_aelem.href = "data:application/octet-stream;charset=utf-8;base64," + btoa(out_s);
}