function XmlListConfig(xml) {
    var obj = {};
    if (xml.nodeType == 1) {
        if (xml.attributes.length > 0) {
            obj["attr"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["attr"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType == 3) {
        obj = xml.nodeValue;
    }
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof (obj[nodeName]) == "undefined") {
                obj[nodeName] = XmlListConfig(item);
            } else {
                if (typeof (obj[nodeName].push) == "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(XmlListConfig(item));
            }
        }
    }
    return obj;
}

function updateTable(data) {
    // Get the table element
    const table = document.querySelector('#timetable');
    table.innerHTML = "";

    // Define the table head column names as an array
    const columnNames = ['Number', 'Platform', 'Arrival', 'Departure', 'Delta(min)'];

    // Create the table head element
    const thead = document.createElement('thead');

    // Create the table row element
    const tr = document.createElement('tr');

    // Loop through the array and create a table header cell for each column name
    for (let i = 0; i < columnNames.length; i++) {
        const th = document.createElement('th');
        th.textContent = columnNames[i];
        tr.appendChild(th);
    }

    // Append the table row element to the table head element
    thead.appendChild(tr);

    // Append the table head element to the table
    table.appendChild(thead);

    const keys = ['n', 'pp_dp', 't_ar', 't_dp', 'delta_minutes']
    // Get a reference to the table element

    // Loop through the array of data
    for (let i = 0; i < data.length; i++) {

        // Create a new row for the table
        const newRow = table.insertRow(-1);

        for (const key of keys) {
            var cell = newRow.insertCell(-1);
            cell.innerHTML = data[i][key]

        }
    }
}


async function run(pattern = "BLS") {

    let planFullDataRaw = [];
    let changesFullData = {};
    let finalData;

    const now = moment().add({ minutes: 0 });
    let YYMMDD = now.format("YYMMDD");
    let HH = now.format("HH");
    let evas;
    let stationsArray;

    const url = `https://iris.noncd.db.de/iris-tts/timetable/station/${pattern}`;

    try {
        const response = await $.ajax({
            url: url,
            type: 'GET',
        });

        console.log(response);
        const xmljson = XmlListConfig(response);
        stationsArray = xmljson.stations;

        // One station can have multiple eva ids e.g Berlin HBF: [Berlin HBF, Berlin HBF S, Berlin HBF tief]
        evas = [stationsArray.station['attr'].eva];
        console.log(evas);
    } catch (error) {
        console.error('Request failed. Returned status of ' + error.status);
    }

    async function transformPlanToNiceJSON(response) {

        if (!response) return [];

        const timetableArray = XmlListConfig(response);

        if (!(timetableArray.timetable.hasOwnProperty("attr"))) return [];

        const timetableArray_s = timetableArray.timetable.s;

        const filteredData = timetableArray_s.filter(row => row.ar && row.dp);

        const newData = filteredData.map(row => {
            const arDateTime = moment(row.ar['attr'].pt, "YYMMDDHHmm").toDate();
            const dpDateTime = moment(row.dp['attr'].pt, "YYMMDDHHmm").toDate();

            return {
                c: row.tl['attr'].c,
                n: row.tl['attr'].n,
                pp_ar: row.ar['attr'].pp,
                pp_dp: row.dp['attr'].pp,
                pt_ar: arDateTime,
                pt_dp: dpDateTime,
                id: row['attr'].id,
            };
        });

        return newData;
    }

    async function transformChangesToNiceJSON(response) {

        if (!response) return [];

        const timetableArray = XmlListConfig(response);

        if (!(timetableArray.timetable.hasOwnProperty("attr"))) return [];

        const timetableArray_s = timetableArray.timetable.s;

        const filteredData = timetableArray_s.filter(row => row.ar && row.dp);

        const newData = filteredData.map(row => {

            let arDateTime = undefined;
            let dpDateTime = undefined;

            try {
                arDateTime = moment(row.ar['attr'].ct, "YYMMDDHHmm").toDate();
                dpDateTime = moment(row.dp['attr'].ct, "YYMMDDHHmm").toDate();
            } catch (error) {
                // console.log(error);
            }

            //try to access cp and save it in variable
            let cp_ar = undefined;
            let cp_dp = undefined;

            try {
                cp_ar = row.ar['attr'].cp;
                cp_dp = row.dp['attr'].cp;
            } catch (error) {
                // console.log(error);
            }

            return {
                ar: row.ar['attr'],
                dp: row.dp['attr'],
                ct_ar: arDateTime,
                ct_dp: dpDateTime,
                id: row['attr'].id,
                cp_ar: cp_ar,
                cp_dp: cp_dp,
            };

        });

        let dictionary = Object.assign({}, ...newData.map((x) => ({ [x.id]: x })));
        return dictionary;
    }


    async function getTimeTable(evaArray, YYMMDD, HH) {

        for (let hourOffset = -1; hourOffset < 2; hourOffset++) {
            time = moment(Date.now()).add({ hours: hourOffset });
            HH = time.format("HH");
            YYMMDD = time.format("YYMMDD");

            for (const eva of evaArray) {
                try {
                    const response = await $.ajax({
                        url: `https://iris.noncd.db.de/iris-tts/timetable/plan/${eva}/${YYMMDD}/${HH}`,
                        type: 'GET',
                    });

                    planFullDataRaw = planFullDataRaw.concat(await transformPlanToNiceJSON(response));

                } catch (e) {
                    console.log(e);
                }

                try {
                    const response = await $.ajax({
                        url: `https://iris.noncd.db.de/iris-tts/timetable/fchg/${eva}`,
                        type: 'GET',
                    });

                    //merge dictionaries
                    changesFullData = Object.assign({}, changesFullData, await transformChangesToNiceJSON(response));

                    // changesFullData = changesFullData.concat(await transformChangesToNiceJSON(response));

                } catch (e) {
                    console.log(e);
                }
            }
        }

        planFullData = planFullDataRaw.map(row => {
            const changes = changesFullData[row.id];
            row.ct_ar = "";
            row.ct_dp = "";
            row.cp_ar = "";
            row.cp_dp = "";
            row.changes = "";
            if (changes) {
                if (changes.ct_ar && changes.ct_dp) {
                    row.ct_ar = changes.ct_ar;
                    row.ct_dp = changes.ct_dp;
                    row.changes = "ct";
                    console.log(row);
                }
                else if (changes.cp_ar && changes.cp_dp) {
                    row.cp_ar = changes.cp_ar;
                    row.cp_dp = changes.cp_dp;
                    row.changes = "cp";
                    console.log(row);
                }
            }
            return row;
        });


        planFullData = planFullData.map(row => {

            let t_ar = row.pt_ar;
            let t_dp = row.pt_dp;

            let delta = 0;
            if (row.ct_ar && row.ct_dp) {
                delta = row.ct_dp - row.ct_ar;

                if (row.ct_ar > row.pt_ar) {
                    t_ar = row.ct_ar
                }
                if (row.ct_dp > row.pt_dp) {
                    t_dp = row.ct_dp
                }

            } else {
                delta = row.pt_dp - row.pt_ar;
            }
            return {
                c: row.c,
                n: row.n,
                changes: row.changes,
                ct_ar: row.ct_ar,
                ct_dp: row.ct_dp,
                cp_dp: row.cp_dp,
                pp_dp: row.pp_dp,
                pt_ar: row.pt_ar,
                pt_dp: row.pt_dp,
                t_ar: t_ar,
                t_dp: t_dp,
                delta: delta,
            }
        });

        planFullData = planFullData.filter(a => a.delta > 0)

        planFullData = planFullData.sort((a, b) => a.t_ar - b.t_ar);
        planFullData = planFullData.filter(a => moment(a.pt_dp).add({ minutes: 3 }) > now);

        formatData = planFullData.map(row => {

            let t_ar = row.t_ar
            let t_dp = row.t_dp
            if (t_ar > row.pt_ar) {
                t_ar = moment(row.pt_ar).format("HH:mm").strike();
                t_ar = t_ar + " " + "<span>" + moment(row.ct_ar).format("HH:mm") + "</span>";
            } else {
                t_ar = moment(t_ar).format("HH:mm");
            }
            if (t_dp > row.pt_dp) {
                t_dp = moment(row.pt_dp).format("HH:mm").strike();
                t_dp = t_dp + " " + "<span>" + moment(row.ct_dp).format("HH:mm") + "</span>";
            } else {
                t_dp = moment(t_dp).format("HH:mm");
            }

            const delta_minutes = Math.round(row.delta / (1000 * 60));

            return {
                n: row.c + " " + row.n,
                changes: row.changes,
                ct_ar: moment(row.ct_ar).format("HH:mm"),
                ct_dp: moment(row.ct_dp).format("HH:mm"),
                cp_dp: row.cp_dp,
                pp_dp: row.pp_dp,
                pt_ar: moment(row.pt_ar).format("HH:mm"),
                pt_dp: moment(row.pt_dp).format("HH:mm"),
                t_ar: t_ar,
                t_dp: t_dp,
                delta_minutes: delta_minutes,
            }
        });


        console.table(formatData);
        return formatData;
    }

    finalData = await getTimeTable(evas, YYMMDD, HH);
    updateTable(finalData);

}