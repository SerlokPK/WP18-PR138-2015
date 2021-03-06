﻿$(document).ready(function () {
    $('#btnacptreqadm').click(function () { //admin zeli da vidi musterije u stanju 'Created'
        $('#divallreqcreatedadm').show();
        $('#divhome').hide();
        $('#divprofile').hide();
        $('#divupdate').hide();
        $('#divallcustomers').hide();
        $('#divrequest').hide();
        $('#divmodifyrequest').hide();
        $('#divcancelride').hide();
        $('#divadminrequest').hide();
        $('#divallridesadm').hide();
        $('#divridescudr').hide();

        $.ajax({                //vracam sve voznje
            method: "GET",
            url: "/api/Voznja",
            dataType: "json",
            success: function (data) {
                $('#olforcrtreqadm').empty();
                $.each(data, function (index, val) {
                    if (val.StatusString === 'Created') {
                        $.ajax({            //za svaku voznju vracam lokaciju posebno
                            method: "GET",
                            url: "/api/Address",
                            data: { id: val.StartPointID },
                            dataType: "json",
                            success: function (response) {
                                $('#olforcrtreqadm').append(`<li>Pickup location: ${response} <button id='btnaccrequestadm'>Accept</button></br>Wanted car: ${val.TypeString}<input type="hidden" id="${val.Id}"></li>`);
                            },
                            error: function (msg) {
                                alert( msg.responseText);
                            }
                        });
                    }
                });
            },
            error: function (msg) {
                //alert("Fail - " + msg.responseText);
            }
        });

    });

    $("#olforcrtreqadm").delegate("#btnaccrequestadm", "click", function (e) {
        let index = $(this).parent().index();   //zelim ID trenutnog <li>
        let temp = $('#olforcrtreqadm').find(`li:eq(${index})`).html(); //da pronadjem tekst iz tacno oznacenog <li>

        let info = temp.split('"');
        let id = info[5];      //id voznje
        id = parseInt(id);
        let drivers = [];
        sessionStorage.setItem('driveId', JSON.stringify(id));      //moram da sacuvam jer koristim na klik Create

        $.when(
            $.ajax({                        //uzmem listu svih vozaca koje cu prikazati
                method: "GET",
                url: "/api/Vozac",
                dataType: "json",
                success: function (data) {
                    $.each(data, function (index, value) {
                        if (value.DriveString !== 'InProgress' && value.DriveString !== 'Formed') {

                            drivers.push(value);
                            sessionStorage.setItem('drivers', JSON.stringify(drivers));
                        } else {
                            sessionStorage.setItem('drivers', JSON.stringify(drivers));
                        }
                    });
                },
                error: function (msg) {
                    alert( msg.responseText);
                }
            }),
        ).then(function () {
            let options = '<option value=""><strong>Drivers</strong></option>';
            let drivers = JSON.parse(sessionStorage.getItem('drivers'));
            $(drivers).each(function (index, value) {
                if (value.Car.TypeString == 'RegularCar') {
                    options += '<option value="' + value.Username + '">' + value.Username + '</option>';
                }
            });
            $('#driversadm2').html(options);

            $('#divpop').show();
            var targeted_popup_class = jQuery(this).attr('data-popup-open');
            $('[data-popup="' + targeted_popup_class + '"]').fadeIn(350);
            e.preventDefault();
        });
    });

    //close
    $('.popup-close').on('click', function (e) {
        var targeted_popup_class = jQuery(this).attr('data-popup-close');
        $('[data-popup="' + targeted_popup_class + '"]').fadeOut(350);
    });
    //----- Create
    $('#popcrt').on('click', function (e) {

        let admin = JSON.parse(sessionStorage.getItem('logged'));
        let id = JSON.parse(sessionStorage.getItem('driveId'));
        let driver = $('#driversadm2').val();
        let status = true;
        let sts = true;

        if (driver == '') {                         //ako ne izabere nekog od ponudjenih vozaca
            alert('You must choose driver!');
        } else {
            var targeted_popup_class = jQuery(this).attr('data-popup-close');       //da zatvorim popup
            $('[data-popup="' + targeted_popup_class + '"]').fadeOut(350);

            $.when(
                $.ajax({                        //da vratim trenutno stanje ulogovanog   
                    method: "GET",
                    url: "/api/Registration",
                    data: { id: id },
                    dataType: "json",
                    success: function (data) {
                        if (data.StatusString !== 'Created') {      //da vidim da li je voznja u created statusu
                            status = false;
                        }
                    },
                    error: function (msg) {
                        alert( msg.responseText);
                    }
                }),
                $.ajax({                        //proverim da li je vozac zauzet
                    method: "GET",
                    url: "/api/Vozac",
                    dataType: "json",
                    success: function (data) {
                        $.each(data, function (index, value) {
                            if (value.Username == driver && (value.DriveString === 'InProgress' || value.DriveString === 'Formed')) {
                                sts = false;
                            }
                        });
                    },
                    error: function (msg) {
                        alert( msg.responseText);
                    }
                }),
            ).then(function () {
                if (status && sts) {
                    let send = {
                        Id: id,
                        DriverID: driver,
                        AdminID: admin.Username
                    }

                    $.ajax({        //menjamo statuse voznje, vozaca - Processed
                        method: "PUT",
                        url: "/api/Smart3",
                        data: JSON.stringify(send),
                        contentType: "application/json; charset=utf-8",
                        dataType: "json",
                        success: function () {
                            alert('Drive assigned');

                            $.ajax({                    //uzimam sve voznje, ali cu priokazati samo od ovog admina
                                method: "GET",
                                url: "/api/Voznja",
                                dataType: "json",
                                success: function (response) {
                                    $("#lblhome").empty();
                                    $('#lblhome').append('================Drives=====================');
                                    let startLoc;
                                    let endLoc;
                                    let comments = [];

                                    $.each(response, function (index, value) {
                                        if (value.AdminID != null && value.AdminID == admin.Username) {
                                            $.when(
                                                $.ajax({                    //za svaku voznju vracam pocetnu lokaciju posebno
                                                    method: "GET",
                                                    url: "/api/Address",
                                                    data: { id: value.StartPointID },
                                                    dataType: "json",
                                                    success: function (loc) {
                                                        startLoc = loc;

                                                        if (value.FinalPointID != null) {
                                                            $.ajax({                    //za svaku voznju vracam krajnju lokaciju posebno, ako postoji
                                                                method: "GET",
                                                                url: "/api/Address",
                                                                data: { id: value.FinalPointID },
                                                                dataType: "json",
                                                                success: function (floc) {
                                                                    endLoc = floc;
                                                                },
                                                                error: function (msg) {
                                                                    alert( msg.responseText);
                                                                }
                                                            });
                                                        }
                                                    },
                                                    error: function (msg) {
                                                        alert( msg.responseText);
                                                    }
                                                }),

                                                $.ajax({                    //za svaku voznju vracam komentare, ukoliko su npr kom i vozac i musterija
                                                    method: "GET",
                                                    url: "/api/Smart2",
                                                    data: { startLocation: value.StartPointID },
                                                    dataType: "json",
                                                    success: function (loc) {
                                                        comments = loc;
                                                    },
                                                    error: function (msg) {
                                                        alert( msg.responseText);
                                                    }
                                                }),
                                            ).then(function () {
                                                $('#lblhome').append(`<br />Driver: ${value.DriverID} - Car type: ${value.TypeString}`);
                                                if (value.UserCallerID != null) {
                                                    $('#lblhome').append(`<br />Customer: ${value.UserCallerID}`);
                                                }
                                                $('#lblhome').append(`<br />From: ${startLoc} - To: ${endLoc}`);
                                                $('#lblhome').append(`<br />Status: ${value.StatusString} - Reservation time: ${value.TimeOfReservation}`);
                                                if (value.Payment != null) {
                                                    $('#lblhome').append(`<br />Payment: ${value.Payment}`);
                                                }
                                                if (comments.length > 0) {
                                                    $.each(comments, function (index, value) {
                                                        $('#lblhome').append(`<br />Comment posted by: ${value.UserID} - Time: ${value.PostingTime}`);
                                                        $('#lblhome').append(`<br />Grade for this ride: ${value.Grade}`);
                                                        $('#lblhome').append(`<br /><br /><textarea readonly rows="8" cols="35">${value.Description}</textarea>`);
                                                    });
                                                }
                                                $('#lblhome').append('<br />===========================================');
                                            });
                                        }
                                    });
                                    $('#divallreqcreatedadm').hide();
                                    $('#divhome').show();
                                    $('#divridescudr').show();
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
                } else if (!status) {
                    alert('Drive was assigned by another admin, try another');
                    $('#btnacptreqadm').trigger('click');
                } else {
                    alert('This driver is already taken, choose another');
                    $('#btnacptreqadm').trigger('click');
                }
            });
        }

    });

    $("#typeofcaradm2").change(function () {     //popunjavanje drop down liste u zavisnosti od tipa auta
        let car = $(this).val();
        let options = '<option value=""><strong>Drivers</strong></option>';
        let drivers = [];

        $.when(
            $.ajax({                        //uzmem listu svih vozaca koje cu prikazati
                method: "GET",
                url: "/api/Vozac",
                dataType: "json",
                success: function (data) {
                    $.each(data, function (index, value) {
                        if (value.DriveString !== 'InProgress' && value.DriveString !== 'Formed') {

                            drivers.push(value);
                            sessionStorage.setItem('drivers', JSON.stringify(drivers));
                        }
                    });
                },
                error: function (msg) {
                    alert( msg.responseText);
                }
            }),
        ).then(function () {
            let options = '<option value=""><strong>Drivers</strong></option>';
            let drivers = JSON.parse(sessionStorage.getItem('drivers'));
            $(drivers).each(function (index, value) {
                if (value.Car.TypeString == car) {
                    options += '<option value="' + value.Username + '">' + value.Username + '</option>';
                }
            });
            $('#driversadm2').html(options);
        });
    });

    //ZA PRIKAZ SVIH VOZNJI U SISTEMU
    $('#btnalldrvs').click(function () {
        $('#spansrcnmlst').show();
        $('#divallreqcreatedadm').hide();
        $('#divhome').hide();
        $('#divprofile').hide();
        $('#divupdate').hide();
        $('#divallcustomers').hide();
        $('#divrequest').hide();
        $('#divmodifyrequest').hide();
        $('#divcancelride').hide();
        $('#divadminrequest').hide(); 
        $('#divridescudr').hide();
        ShowAll();
    });
});

function ShowAll() {
    let loggedUser = JSON.parse(sessionStorage.getItem('logged'));

    $.ajax({                    //uzimam sve voznje, ali cu priokazati samo od ovog vozaca
        method: "GET",
        url: "/api/Voznja",
        dataType: "json",
        success: function (response) {
            $("#lblalldrivesadm").empty();
            $('#lblalldrivesadm').append('=================Drives=================');

            $.each(response, function (index, value) {
                let startLoc;
                let endLoc;
                let comments = [];

                $.when(
                    $.ajax({                    //za svaku voznju vracam pocetnu lokaciju posebno
                        method: "GET",
                        url: "/api/Address",
                        data: { id: value.StartPointID },
                        dataType: "json",
                        success: function (loc) {
                            startLoc = loc;

                            if (value.FinalPointID != null) {
                                $.ajax({                    //za svaku voznju vracam krajnju lokaciju posebno, ako postoji
                                    method: "GET",
                                    url: "/api/Address",
                                    data: { id: value.FinalPointID },
                                    dataType: "json",
                                    success: function (floc) {
                                        endLoc = floc;
                                    },
                                    error: function (msg) {
                                        alert( msg.responseText);
                                    }
                                });
                            }
                        },
                        error: function (msg) {
                            alert( msg.responseText);
                        }
                    }),

                    $.ajax({                    //za svaku voznju vracam komentare, ukoliko su npr kom i vozac i musterija
                        method: "GET",
                        url: "/api/Smart2",
                        data: { startLocation: value.StartPointID },
                        dataType: "json",
                        success: function (loc) {
                            comments = loc;
                        },
                        error: function (msg) {
                            alert( msg.responseText);
                        }
                    }),
                ).then(function () {
                    if (value.DriverID != null) {
                        $('#lblalldrivesadm').append(`<br />Driver: ${value.DriverID}`);
                    }

                    if (value.UserCallerID != null) {
                        $('#lblalldrivesadm').append(`<br />Customer: ${value.UserCallerID}`);
                    }
                    $('#lblalldrivesadm').append(`<br />From: ${startLoc} - To: ${endLoc}`);
                    $('#lblalldrivesadm').append(`<br />Status: ${value.StatusString} - Reservation time: ${value.TimeOfReservation}`);
                    if (value.Payment != null) {
                        $('#lblalldrivesadm').append(`<br />Payment: ${value.Payment}`);
                    }
                    if (comments.length > 0) {
                        $.each(comments, function (index, value) {
                            $('#lblalldrivesadm').append(`<br />Comment posted by: ${value.UserID} - Time: ${value.PostingTime}`);
                            $('#lblalldrivesadm').append(`<br />Grade for this ride: ${value.Grade}`);
                            $('#lblalldrivesadm').append(`<br /><br /><textarea readonly rows="8" cols="35">${value.Description}</textarea>`);
                        });
                    }
                    $('#lblalldrivesadm').append('<br />===========================================');
                });

            });
            $('#divallridesadm').show();
        },
        error: function (msg) {
            //alert("Fail - " + msg.responseText);
        }
    });
}