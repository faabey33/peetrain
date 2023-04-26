// fill dropdown

let fuse;

function load_data() {
  $.getJSON("dbCodes_filtered.json", function (data) {
    let codes = data["data"];
    const options = {
      // isCaseSensitive: false,
      // includeScore: false,
      shouldSort: false,
      includeMatches: true,
      // findAllMatches: false,
      minMatchCharLength: 2,
      // location: 0,
      threshold: 0.1,
      distance: 2,
      useExtendedSearch: false,
      // ignoreLocation: false,
      // ignoreFieldNorm: false,
      // fieldNormWeight: 1,
      keys: ["1"],
    };
    fuse = new Fuse(codes, options);
  });
}

function update_dropdown(new_entries) {
  // compare old with new entries and remove or add html elements
  items = new_entries;
  $("#search_id").empty();
  new_entries.forEach((entry) => {
    let display_text = entry.item[1];
    let code = entry.item[0];

    $("#search_id").append(
      $("<option class='dd_entry'>").val(code).text(display_text)
    );
  });
  document.querySelector("#search_id").fstdropdown.rebind();
}

$(document).ready(function () {
  //init dropdown

  document.querySelector("#search_id").fstdropdown.rebind();

  $(".fstsearchinput").on("input", function () {
    let search_string = $(this).val();
    console.log(search_string);
    results = fuse.search(search_string);
    update_dropdown(results);
  });
  load_data();

  $("#btn_search").on("click", function () {
    let code = $(".fstlist").children(".selected").attr("data-value");
    console.log(code);
  });
});
