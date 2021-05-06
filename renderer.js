'use strict';

var ipc = require('electron').ipcRenderer;
const process = require('child_process')
const $ = require('jquery')
const path = require('path')
var moment = require('moment');  

const fs = require('fs')
var {shell } = require('electron');
var remote= require('electron').remote;

$('#minimise').on('click', e => {
    ipc.send("window-status","minimise");
})
$('#maximize').on('click', e => {
    ipc.send("window-status","maximize");
    getData();
})
function getData(){
    var pin = $("#pin").val();
    $("#centers").html('');
    console.log(moment().format('DD-MM-YYYY'));
    let t_date = moment().format('DD-MM-YYYY');
    $.ajax({
        url: "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode="+ pin + "&date=" + t_date
    }).then(function(data) {
        
        $.each(data.centers, function(index, item){  
            console.log(item.name);  
            let seesions = item.sessions;
            

            var item_data = `<div class="card text-white bg-${item.fee_type==='Free'?'success':'secondary'} mb-2">
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
          $("#lg_"+index).html('');
          $.each(seesions, function(index, ses_item){  
            let ses_item_data = `
            <li class="list-group-item">${ses_item.date}/${ses_item.min_age_limit}/${ses_item.vaccine}/${ses_item.available_capacity}</li>
            `;
            $("#lg_"+index).append(ses_item_data);
        });

        });
    });
}