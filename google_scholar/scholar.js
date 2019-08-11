
function go() {
  console.log(data);
  var rows = [];
  rows.push([
    "include", "title", "abstract", "author", "url", "eprint"
  ]);
  data.forEach((hit) => {
    rows.push([
      "SI",
      hit.title,
      hit.abstract,
      hit.author,
      hit.url,
      hit.eprint
    ])
  });
  saveCSV(rows);
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
  saveAs(blob, "google_scholar.csv");
}
