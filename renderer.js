"use strict";

var ipc = require("electron").ipcRenderer;
const process = require("child_process");
const $ = require("jquery");
const path = require("path");
var moment = require("moment");

const fs = require("fs");
var { shell } = require("electron");
//var remote = require("electron").remote;

getStates();

let tmr;

$("#stop").hide();

$("#minimise").on("click", (e) => {
  ipc.send("window-status", "minimise");
});
$("#maximize").on("click", (e) => {
  ipc.send("window-status", "maximize");
  getData();
});
getVersion();

function showAbout() {
  ipc.send("window-status", "about");
}
async function getVersion() {
  const ver = await ipc.invoke("get-version", "foo");
  $("#appVersion").html(ver);
}
async function setOptions() {
  var state = await ipc.invoke("get-store", "state");
  var district = await ipc.invoke("get-store", "district");
  console.log(state);
  if (state != "") {
    $("#states select").val(state).trigger();
  }
  if (district != "") {
    $("#districts select").val(district).trigger();
  }
}
function getData() {
  var pin = $("#pin").val();
  $("#centers").html("");

  let t_date = moment().format("DD-MM-YYYY");
  $.ajax({
    url:
      "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode=" +
      pin +
      "&date=" +
      t_date,
  }).then(function (data) {
    $.each(data.centers, function (index, item) {
      //console.log(item.name);
      let seesions = item.sessions;

      var item_data = `<div class="card text-white bg-${
        item.fee_type === "Free" ? "success" : "secondary"
      } mb-2">
            <div class="card-header">${item.name}</div>
              
            <div class="card-body">
            <h5 class="card-title">${item.center_id}</h5>
            <p class="card-text">
            ${item.address}<br>
            ${item.pincode}
            <small>${item.fee_type}</small>
            <ul class="list-group" id="lg_${index}"></ul>
            </p>
            </div>
          </div>`;
      $("#centers").append(item_data);
      $("#lg_" + index).html("");
      $.each(seesions, function (index, ses_item) {
        let ses_item_data = `
            <li class="list-group-item">${ses_item.date}/${ses_item.min_age_limit}/${ses_item.vaccine}/${ses_item.available_capacity}</li>
            `;
        $("#lg_" + index).append(ses_item_data);
      });
    });
  });
}

function getStates() {
  $("#centers").html("");
  $.ajax({
    url: "https://cdn-api.co-vin.in/api/v2/admin/location/states",
  }).then(function (data) {
    console.log(data);
    $.each(data.states, function (index, item) {
      var item_data = `<option value="${item.state_id}">${item.state_name}</option>
            `;
      $("#states").append(item_data);
    });
    setOptions();
  });
}
function getDistricts() {
  var states = $("#states").val();
  ipc.send("set-store", { key: "state", value: states });
  $("#districts").html("");
  $.ajax({
    url: "https://cdn-api.co-vin.in/api/v2/admin/location/districts/" + states,
  }).then(function (data) {
    console.log(data);
    $.each(data.districts, function (index, item) {
      var item_data = `<option value="${item.district_id}">${item.district_name}</option>
            `;
      $("#districts").append(item_data);
    });
  });
}

async function getCenters() {
  var dt = await ipc.invoke("get-store", "district_text");
  var d = await ipc.invoke("get-store", "district");
  console.log(dt);
  var num = Math.floor(Math.random() * 1000 + 1);
  var district_text = $("#districts").val()
    ? $("#districts option:selected").html()
    : dt;

  var district = $("#districts").val() ? $("#districts").val() : d;
  $("#searching").html(district_text);
  if (district != "") {
    let t_date = moment().format("DD-MM-YYYY");
    $("#centers1").html("");
    $.ajax({
      url:
        "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=" +
        district +
        "&date=" +
        t_date +
        "&t=" +
        num,
    }).then(function (data) {
      //console.log(data);
      ipc.send("set-store", { key: "district", value: district });
      ipc.send("set-store", { key: "district_text", value: district_text });

      let filter = data.centers
        .map((dd) => {
          var o = new Object();

          o.center_id = dd.center_id;
          o.pincode = dd.pincode;
          o.fee_type = dd.fee_type;
          o.name = dd.name;
          o.address = dd.address;
          o.available_capacity = dd.sessions.reduce((s, a) => {
            return s + a.available_capacity;
          }, 0);
          o.vaccine = dd.sessions.map((s) => {
            return s.vaccine;
          });
          o.fee_type = dd.fee_type;
          //o.available_capacity = dd.available_capacity;

          return o;
        })
        .filter((data) => {
          return data.available_capacity > 0;
        });

      console.log(filter);
      if (filter.length > 0) {
        var myNotification = new Notification("Vaccinator ", {
          body:
            "Vaccination Slot available at " +
            filter.length +
            " Centers in " +
            district_text,
          title: "Vaccinator Slots",
          icon: "icon.png",
        });
        myNotification.onclick = () => {
          console.log("Notification clicked");
          NotifyStop();
          ipc.send("window-status", "show");
        };

        $.each(filter, function (index, item) {
          let seesions = item.sessions;

          var item_data = `<div class="card text-white bg-${
            item.fee_type === "Free" ? "success" : "secondary"
          } mb-2">
                <div class="card-header">${item.name}/${item.center_id}</div>
                  
                <div class="card-body">
                <h5 class="card-title">Availability: ${
                  item.available_capacity
                }</h5>
                <p class="card-text">
                ${item.address}<br>
                ${item.pincode}
                <small>${item.fee_type} - ${item.vaccine}</small>
                <ul class="list-group" id="lg_${index}"></ul>
                </p>
                </div>
              </div>`;
          $("#centers1").append(item_data);
        });
      } else {
        var item_data = `<div class="card text-white bg-danger mb-2">
                <div class="card-header">No center Found</div>
                  
                <div class="card-body">
                    <h5 class="card-title">No Slot available, check back latter.</h5>
                </div>
              </div>`;
        $("#centers1").append(item_data);
      }
    });
  } else {
    alert("Select District");
  }
}
function NotifyStart() {
  tmr = setInterval(getCenters, 6000);
  $("#start").hide(200);
  $("#stop").show(200);
}
function NotifyStop() {
  clearInterval(tmr);
  $("#start").show(200);
  $("#stop").hide(200);
}
