﻿$(document).ready(function () {
    $('#btnchangeroles').click(function () {
        $('#divhome').hide();
        $('#divprofile').hide();
        $('#divupdate').hide();
        $('#divadminrequest').hide();
        $('#divallreqcreatedadm').hide();
        $('#divallridesadm').hide();
        $('#divridescudr').hide();

        $('#listallcustomers').empty();
        $('#divallcustomers').show();
        $.ajax({
            method: "GET",
            url: "/api/Musterija",
            dataType: "json",
            success: function (data) {

                sessionStorage.setItem("users", JSON.stringify(data));
                $.each(data, function (index, val) {
                    $('#listallcustomers').append(`<li>${val.Username} - ${val.RoleString}<button class="helper" id='btnchangerole'>Change</button></li>`);
                });

                $.ajax({
                    method: "GET",
                    url: "/api/Vozac",
                    dataType: "json",
                    success: function (data) {

                        let users = JSON.parse(sessionStorage.getItem("users"));    //spojim customere i drivere
                        $.merge(users, data);
                        sessionStorage.setItem("users", JSON.stringify(users));
                        $.each(data, function (index, val) {
                            $('#listallcustomers').append(`<li>${val.Username} - ${val.RoleString}<button class="helper" id='btnchangerole'>Change</button></li>`);
                        });

                    },
                    error: function (msg) {
                        alert( msg.responseText);
                    }
                });
            },
            error: function (msg) {
                alert( msg.responseText);
            }
        });


    });


    $("#listallcustomers").delegate("#btnchangerole", "click", function (e) {

        $(this).hide();
        $(".helper").hide();
        $(this).parent().append(`<select id="role">
                            <option selected>Customer</option>
                            <option>Driver</option>
                        </select>`);
        $(this).parent().append(`<select id="cartypespec">
                                 <option value="RegularCar" selected>Regular car</option>
                                <option value="MiniVan">Minivan</option>
                                 </select>`);
        $(this).parent().append(`<button id='btnsavechanges'>Save</button>`) //appendujem na <li>, zato parent
        let index = $(this).parent().index();   //zelim ID trenutnog <li>

        e.stopPropagation(); //da zaustavimo dom

        $('#btnsavechanges').click(function () {
            let temp = $('#listallcustomers').find(`li:eq(${index})`).text(); //da pronadjem tekst iz tacno oznacenog <li>
            let info = temp.split('-');
            let user = JSON.parse(sessionStorage.getItem("users"));
            let role = $('#role').val();
            let type = $('#cartypespec').val();
            $('.helper').show();
            $.each(user, function (key, value) {

                if (value.Username === info[0].substr(0, info[0].length - 1)) { //kod username imam razmak, pa skratim

                    let musterija = {
                        Username: value.Username,
                        Role: role
                    }

                    $.when(
                        $.ajax({
                            method: "PUT",
                            url: "/api/Vozac",
                            data: JSON.stringify(musterija),
                            contentType: "application/json; charset=utf-8",
                            dataType: "json",
                            success: function () {
                                $('#listallcustomers').find(`li:eq(${index})`).html(`${value.Username} - ${role}<button class="helper" id='btnchangerole'>Change</button></li>`);
                                
                            },
                            error: function (msg) {
                                $('#listallcustomers').find(`li:eq(${index})`).html(`${value.Username} - Customer<button class="helper" id='btnchangerole'>Change</button></li>`);
                                alert("To make a driver, he must make new account, he can't use existing one.");
                                
                            }
                        }),
                    ).then(function () {
                        if (role === 'Driver') {
                            let driver = {
                                type: type,
                                username: value.Username
                            }

                            $.ajax({
                                method: "PUT",
                                url: "/api/Smart4",
                                data: JSON.stringify(driver),
                                contentType: "application/json; charset=utf-8",
                                dataType: "json",
                                success: function () {

                                },
                                error: function (msg) {
                                    alert( msg.responseText);
                                }
                            });
                        }
                    });
                    
                }
            });
        });
    });
});

