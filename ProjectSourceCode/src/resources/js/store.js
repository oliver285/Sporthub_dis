function updateFilter() {
  document.getElementById("applyFilter").href =
    "/store?min=" +
    document.getElementById("min-range").value +
    "&max=" +
    document.getElementById("max-range").value;
}
function search() {
  document.getElementById("searchButton").href =
    "/store?tags=" + document.getElementById("searchField").value;
}
document.getElementById("min-range").addEventListener("change", updateFilter);
document.getElementById("max-range").addEventListener("change", updateFilter);
document.getElementById("searchField").addEventListener("change", search);
