let queries = [
  ["open-source hardware" , "citizen science"],
  ["open-source hardware" , "community science"],
  ["open-source hardware" , "crowd science"],
  ["open-source hardware" , "crowd-sourced science"],
  ["open-source hardware" , "civic science"],
  ["open-source hardware" , "volunteer monitoring"],
  ["open-design movement" , "citizen science"],
  ["open-design movement" , "community science"],
  ["open-design movement" , "crowd science"],
  ["open-design movement" , "crowd-sourced science"],
  ["open-design movement" , "civic science"],
  ["open-design movement" , "volunteer monitoring"],
  ["open design" , "citizen science"],
  ["open design" , "community science"],
  ["open design" , "crowd science"],
  ["open design" , "crowd-sourced science"],
  ["open design" , "civic science"],
  ["open design" , "volunteer monitoring"],
  ["open hardware" , "citizen science"],
  ["open hardware" , "community science"],
  ["open hardware" , "crowd science"],
  ["open hardware" , "crowd-sourced science"],
  ["open hardware" , "civic science"],
  ["open hardware" , "volunteer monitoring"],
  ["open machine design" , "citizen science"],
  ["open machine design" , "community science"],
  ["open machine design" , "crowd science"],
  ["open machine design" , "crowd-sourced science"],
  ["open machine design" , "civic science"],
  ["open machine design" , "volunteer monitoring"],
];

function log(data) {
  console.log(data);
}

function fetchData(page, size, q) {
  // NOTE(Richo): Instead of querying the actual api we go through our local server to avoid CORS error
  let url = "http://localhost:4242/zenodo";
  let data = {
    page: page,
    size: size,
    q: encodeURI(q),
  };
  return ajax.POST(url, data);
}

function fetchAllData(q) {
  return new Promise(function (resolve, reject) {
    let results = [];
    let page = 0;
    let size = 200;
    let query = q.map((s) => '"' + s + '"').join("+");

    function errorHandler(err) {
      console.log(err);
      reject(err);
    }

    function fetchNext(data) {
      if (data != undefined) {
        results.push(data);
        console.log("Received " + data.hits.hits.length + "/" + data.hits.total);
      }
      if (data == undefined || data.links.next != undefined) {
        page++;
        fetchData(page, size, query)
          .then(fetchNext)
          .catch(errorHandler);
      } else {
        resolve(results);
      }
    }

    fetchNext();
  });
}

function processAllQueries() {
  return new Promise(function (resolve, reject) {
    let i = 0;
    let results = [];

    function processNext() {
      if (i >= queries.length) {
        resolve(results);
      } else {
        let q = queries[i];
        console.log("Starting to process query " + i);
        console.log(q);
        i++;
        fetchAllData(q)
          .then(function (data) { results.push(data); })
          .then(processNext)
          .catch(reject);
      }
    }

    processNext();
  });
}
////////////////////////

function removeDuplicates(results) {
  let ids = new Set();
  let hits = [];
  results.forEach((result) => {
    result.forEach((data) => {
      data.hits.hits.forEach((hit) => {
        if (!ids.has(hit.id)) {
          ids.add(hit.id);
          hits.push(hit);
        }
      })
    });
  });
  return hits;
}

function go() {
  processAllQueries().then(removeDuplicates).then((data) => {
    console.log(data);
    var rows = [];
    rows.push([
      "title",
      "description",
      "keywords",
      "type",
      "type_title",
      "type_subtype",
      "publication_date",
      "conceptdoi",
      "conceptrecid",
      "doi",
      "id",
      "authors",
      "language",
    ]);
    data.forEach((hit) => {
      // NOTE(Richo): We trust zenodo
      document.body.innerHTML = hit.metadata.description;
      rows.push([
        hit.metadata.title,
        document.body.innerText, //description
        (hit.metadata.keywords || []).map((k) => "- " + k).join("\n"),
        hit.metadata.resource_type.type,
        hit.metadata.resource_type.title,
        hit.metadata.resource_type.subtype,
        hit.metadata.publication_date,
        hit.conceptdoi,
        hit.conceptrecid,
        hit.doi,
        hit.id,
        (hit.metadata.creators || []).map((c) => "- " + c.name).join("\n"), // authors
        hit.metadata.language,
      ])
    });
    saveCSV(rows);
  });
}


function saveCSV(data, separator) {
  if (!separator) { separator = ";"; }

  function escape(cell) {
    if (cell == undefined) { return ""; }
    cell = cell.toString();
    cell = cell.replace(/"/g, '""');
    if (cell.includes(separator) ||
          cell.includes('"') ||
          cell.includes("\r") ||
          cell.includes("\n")) {
      cell = '"' + cell + '"';
    }
    return cell;
  }

  var csv = "";
  data.forEach((row) => {
    row.forEach((cell, i) => {
      if (i > 0) { csv += separator; }
      csv += escape(cell);
    });
    csv += "\n";
  });
  var blob = new Blob([csv], {type: "text/plain;charset=utf-8"});
  saveAs(blob, "zenodo_data.csv");
}
