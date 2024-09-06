var croppie = new Croppie(document.getElementById("upload-demo"), {
  enableExif: true,
  viewport: {
    width: 200,
    height: 200,
    type: "rectangle",
  },
  boundary: {
    width: 300,
    height: 300,
  },
});
function readFile(input) {
  if (input.files && input.files[0]) {
    var reader = new FileReader();

    reader.onload = function (e) {
      $(".upload-demo").addClass("ready");
      croppie
        .bind({
          url: e.target.result,
        })
        .then(function () {
          console.log("jQuery bind complete");
        });
    };

    reader.readAsDataURL(input.files[0]);
  } else {
    swal("Sorry - you're browser doesn't support the FileReader API");
  }
}
$("#upload").on("change", function () {
  readFile(this);
});
function postData() {
  croppie
    .result({
      type: "canvas",
      size: "viewport",
      rectangle: true,
    })
    .then(function (resp) {
      $("#pictureInput").val(resp);
      var xhr = new XMLHttpRequest();
      xhr.open("POST", "/sell-item", true);
      xhr.setRequestHeader("Content-Type", "application/json");
      xhr.send(
        JSON.stringify({
          pictureInput: $("#pictureInput").val(),
          itemName: $("#itemName").val(),
          itemType: $("#itemType").val(),
          league: $("#league").val(),
          itemPrice: $("#itemPrice").val(),
          itemQuantity: $("#itemQuantity").val(),
          itemDescription: $("#itemDescription").val(),
        })
      );
      setTimeout('window.location.href = "/marketplace"', 100);
    });
}
