const stampToTime = (timestamp) => {
  if (timestamp.toString().slice(0, 1) != "2") {
    var month = timestamp.split(" ")[1];
    var day = timestamp.split(" ")[2];
    var year = timestamp.split(" ")[3];
  } else {
    var year = timestamp.toString().slice(0, 4);
    var month = timestamp.toString().slice(5, 7);
    var day = timestamp.toString().slice(8, 10);
  }
  var suffix = "th";
  switch (month) {
    case "Jan":
    case "01":
      month = "January";
      break;
    case "Feb":
    case "02":
      month = "February";
      break;
    case "Mar":
    case "03":
      month = "March";
      break;
    case "Apr":
    case "04":
      month = "April";
      break;
    case "May":
    case "05":
      month = "May";
      break;
    case "Jun":
    case "06":
      month = "June";
      break;
    case "Jul":
    case "07":
      month = "July";
      break;
    case "Aug":
    case "08":
      month = "August";
      break;
    case "Sep":
    case "09":
      month = "September";
      break;
    case "Oct":
    case "10":
      month = "October";
      break;
    case "Nov":
    case "11":
      month = "November";
      break;
    case "Dec":
    case "12":
      month = "December";
      break;
  }
  if (day.slice(0, 1) != "1") {
    switch (day.slice(1, 2)) {
      case "1":
        suffix = "st";
        break;
      case "2":
        suffix = "nd";
        break;
      case "3":
        suffix = "rd";
        break;
    }
  }
  if (day.slice(0, 1) == "0") {
    day = day.slice(1, 2);
  }
  return month + " " + day + "<sup>" + suffix + "</sup>, " + year;
};
function updateTeamCounter() {
  var nSelected = $(".team-selected").length;
  $("#teamCounter").html(nSelected + "/5");
}

function updateTeamInput(id, mode) {
  if (id == null) {
    $(".team-selected").each(function () {
      updateTeamInput(this.id, "Add");
    });
  } else {
    var currVal = $("#teamsInput").val();
    var thisID = id.replace("team", "");
    if (mode == "Add") {
      if ($("#teamsInput").val() == "") {
        $("#teamsInput").val(thisID);
      } else {
        $("#teamsInput").val(currVal + "," + thisID);
      }
    } else {
      var newString = "";
      var teamArray = $("#teamsInput").val().split(",");
      var newArray = [];
      if (teamArray.length == 1) {
        newString = "";
      } else {
        for (i = 0; i < teamArray.length; i++) {
          if (teamArray[i] != thisID) {
            newArray.push(teamArray[i]);
          }
        }
        for (i = 0; i < newArray.length; i++) {
          if (i == 0) {
            newString = newArray[i];
          } else {
            newString += "," + newArray[i];
          }
        }
      }
      $("#teamsInput").val(newString);
    }
  }
}

$(".team").click(function (e) {
  e.preventDefault();
  if ($(".team-selected").length == 5) {
    if ($("#" + this.id).hasClass("team-selected")) {
      updateTeamInput(this.id, "Subtract");
      $("#" + this.id).removeClass("team-selected");
    }
  } else {
    if ($("#" + this.id).hasClass("team-selected")) {
      updateTeamInput(this.id, "Subtract");
    } else {
      updateTeamInput(this.id, "Add");
    }
    $("#" + this.id).toggleClass("team-selected");
  }
  updateTeamCounter();
});

function numberWithCommas(x) {
  return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
var croppie = new Croppie(document.getElementById("upload-demo"), {
  enableExif: true,
  viewport: {
    width: 200,
    height: 200,
    type: "circle",
  },
  boundary: {
    width: 300,
    height: 300,
  },
});
$("#pictureModal").on("shown.bs.modal", function () {
  croppie.bind({
    url: document.getElementById("profilePicture").src,
  });
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
$("#pictureSubmit").on("click", function (ev) {
  croppie
    .result({
      type: "canvas",
      size: "viewport",
      circle: true,
    })
    .then(function (resp) {
      document.getElementById("submitPictureImage").src = resp;
      $("#pictureInput").val(resp);
      $("#pictureModal").modal("hide");
      $("#submitPictureModal").modal("show");
    });
});
$("#pictureSubmitNo").on("click", function () {
  $("#submitPictureModal").modal("hide");
  $("#pictureModal").modal("show");
});
