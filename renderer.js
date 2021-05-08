'use strict';

var ipc = require('electron').ipcRenderer;
const process = require('child_process')
const $ = require('jquery')
const path = require('path')
var moment = require('moment');  

const fs = require('fs')
var {shell } = require('electron');
var remote= require('electron').remote;

const Store = require('electron-store');
getStates();
const store = new Store();
store.set('unicorn', '🦄');

$('#minimise').on('click', e => {
    ipc.send("window-status","minimise");
})
$('#maximize').on('click', e => {
    ipc.send("window-status","maximize");
    getData();
})
function getData(){
    console.log(store.get('unicorn'));

    var pin = $("#pin").val();
    $("#centers").html('');

    let t_date = moment().format('DD-MM-YYYY');
    $.ajax({
        url: "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByPin?pincode="+ pin + "&date=" + t_date
    }).then(function(data) {
        
        $.each(data.centers, function(index, item){  
            //console.log(item.name);  
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

function getStates(){
    var pin = $("#pin").val();
    $("#centers").html('');
    $.ajax({
        url: "https://cdn-api.co-vin.in/api/v2/admin/location/states"
    }).then(function(data) {
        console.log(data);
        $.each(data.states, function(index, item){  
            var item_data = `<option value="${item.state_id}">${item.state_name}</option>
            `;
          $("#states").append(item_data);
 
        });
    });
}
function getDistricts(s_id){
    var pin = $("#pin").val();
    $("#districts").html('');
    $.ajax({
        url: "https://cdn-api.co-vin.in/api/v2/admin/location/districts/" + s_id
    }).then(function(data) {
        console.log(data);
        $.each(data.districts, function(index, item){  
            var item_data = `<option value="${item.district_id}">${item.district_name}</option>
            `;
          $("#districts").append(item_data);
 
        });
    });
}

function getCenters(d_id){

    let t_date = moment().format('DD-MM-YYYY');
    $("#centers1").html('');
    $.ajax({
        url: "https://cdn-api.co-vin.in/api/v2/appointment/sessions/calendarByDistrict?district_id=" + d_id + "&date=" + t_date
    }).then(function(data) {
        //console.log(data);
        let filter = data.centers.map(dd => {
            var o = new Object();
                    
            o.center_id = dd.center_id;
            o.pincode = dd.pincode;
            o.fee_type = dd.fee_type;
            o.name = dd.name;
            o.address = dd.address;
            o.available_capacity = dd.sessions.reduce((s,a)=>{return s+a.available_capacity},0);
            o.vaccine = dd.sessions.map(s=>{return s.vaccine});
            o.fee_type = dd.fee_type;
            //o.available_capacity = dd.available_capacity;


            return o;
        }).filter(data =>{
            return data.available_capacity>0;
        });

        console.log(filter);

        $.each(filter, function(index, item){  
            let seesions = item.sessions;
            
            

            var item_data = `<div class="card text-white bg-${item.fee_type==='Free'?'success':'secondary'} mb-2">
            <div class="card-header">${item.name}/${item.center_id}</div>
              
            <div class="card-body">
            <h5 class="card-title">Availability: ${item.available_capacity}</h5>
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
    });
}