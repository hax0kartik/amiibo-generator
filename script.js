(function() {
    var keysLoaded = false;
    var amiiboDatabase = null;
    var amiiboZip = null;
    var g_data = null;

    function populateTable() {
        $.getJSON("https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/database/amiibo.json", function(data) {
            amiiboDatabase = data;
            g_data = data;
            var t = $('#dataTable').DataTable();
            Object.keys(data.amiibos).forEach(function(key) {
                var ami = data.amiibos[key];
                var name = ami.name;
                var keytext = key.padStart(16, '0');
                var keylink = key.substring(2).padStart(16, '0');
                
                var link = "https://raw.githubusercontent.com/N3evin/AmiiboAPI/master/images/icon_" + keylink.substr(0, 8) + "-" + keylink.substr(8, 8) + ".png"
                var image = `<div class="amiibo-image"><img src="${link}" /></div>`;
                t.row.add([image, `<span class="table-text">${name}</span>`, `<span class="table-text">${keytext}</span>`]);
            });
            t.draw(false);
            generateZip();
        });
    };

    function getRandomBytes(count) {
        var output = new Uint8Array(count);
    
        for (var i = 0; i < output.length; i++) {
            output[i] = Math.round(Math.random() * 255);
        }
    
        return output;
    }

    function generateData(id) {
        var arr = new Uint8Array(540);
        arr.set([0x00, 0x00, 0x00, 0x88, 0x00, 0x00, 0x00, 0x00, 0x00, 0x48, 0x0f, 0xe0, 0xf1, 0x10, 0xff, 0xee, 0xa5, 0x00, 0x00, 0x00], 0);
        arr.set([0x01, 0x00, 0x0F, 0xBD, 0x00, 0x00, 0x00, 0x04, 0x5F, 0x00, 0x00, 0x00], 520);

        // Set the salt
        arr.set(getRandomBytes(32), 96);

        // write key/amiibo num in big endian as a 64 bit value starting from offset off
        id = id.substring(2);

        for(var i = 0, off = 84; i < 16; i += 2, off += 1) {
            arr[off] = parseInt(id.substring(i, i + 2), 16);
        }

        return arr;
    };

    function downloadBin(name, id) {
        var data = generateData(id);

        file = name + " (" + id.substr(4, 12) + (keysLoaded ? "" : ", Decrypted") + ").bin";
        console.log(file)
        download("data:application/octet-stream;base64," + base64.fromBytes(data), file, "application/octet-stream");
    };

    function generateZip() {
        const specialCharacters = ["<", ">", ":", "\"", "/", "\\", "|", "?", "*"];
        var zip = new JSZip();
        Object.keys(amiiboDatabase.amiibos).forEach(function(key) {
            var ami = amiiboDatabase.amiibos[key];
            ami.series = amiiboDatabase.amiibo_series["0x"+key.substr(14, 2)]

            var file = ami.name + " (" + key.substr(4, 12) + (keysLoaded ? "" : ", Decrypted") + ").bin";

            specialCharacters.forEach(function(char) {
                file = file.replace(char, "_");
            });
            
            var folder = zip.folder(ami.series);
            folder.file(file, generateData(key))
        })

        zip.generateAsync({type:"blob"}).then(function(content) {
            amiiboZip = content;
            $(".hide_until_zipped").removeClass("hide_until_zipped");
            $("a#downloadZip").click(function(e) {
                e.preventDefault();
                download(amiiboZip, 'amiibo.zip', 'application/octet-stream');
            })
        })
    };

    // Run on page load
    $(function() {
        populateTable(); 
        oTable = $('#dataTable').DataTable({
            "lengthMenu": [[10, 25, 50, 100, -1], [10, 25, 50, 100, "All"]],
        }); 

        $('#dataTable tbody').on('click', 'tr', function() {
            var data = oTable.row( this ).data();
            downloadBin($(data[1]).text(), $(data[2]).text());
        });

        $('#input').keyup(function() {
            oTable.search(jQuery.fn.DataTable.ext.type.search.string($(this).val())).draw();  
        })
    });
})();
