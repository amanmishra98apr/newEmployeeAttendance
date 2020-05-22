var tblhrmdailyrosterattendance = require("../models/tbl_hrm_daily_roster_attendance")
var tblhrmemployeedetails = require("../models/tbl_hrm_employee_details")
var tblemployeedesignations = require("../models/tbl_employee_designations")
var tblemployeedepartments = require("../models/tbl_employee_departments")
var tblhrmemployeeleavetrack = require("../models/tbl_hrm_employee_leave_track")
var tblhrmlogs = require("../models/tbl_hrm_logs")
const sequalize = require("../common/dbconfig").sequelize;
const Sequalize = require("sequelize");
const { Op } = require("sequelize");
tblhrmdailyrosterattendance = tblhrmdailyrosterattendance(sequalize, Sequalize)
tblhrmemployeedetails = tblhrmemployeedetails(sequalize, Sequalize)
tblemployeedesignations = tblemployeedesignations(sequalize, Sequalize)
tblemployeedepartments = tblemployeedepartments(sequalize, Sequalize)
tblhrmemployeeleavetrack = tblhrmemployeeleavetrack(sequalize, Sequalize)
const EMP_MIN_DUTY_HOUR = process.env[process.env.Environment + 'EMP_MIN_DUTY_HOUR'];

// Find data from multiple tables
exports.userAttendance = (req, res, next) => {
  var id = req.body.emp_id
  if (id != null && id != '') {
    var ed = tblhrmemployeedetails.findAll({
      offset: (req.body.page_no - 1) * 20, limit: 20,
      where: {
        id: id
      }
    })
    ed.then(l_users => {
      console.log("done emp detailes");

      if (l_users.length > 0) {
        var empId = req.body.emp_id;
      }
      else {
        var empId = -1
      }
      var attendance_date = req.body.attendance_date
      if (attendance_date != null && attendance_date != '') {
        dateArr = attendance_date.split("to")
        var count = tblhrmdailyrosterattendance.count({
          where: {
            emp_id: empId,
            date: {
              [Op.between]: dateArr,
            }
          }
        })
        count.then(c => {
          console.log("count is: ", c)
        })
        var rs = tblhrmdailyrosterattendance.findAll({
          where: {
            emp_id: empId,
            date: {
              [Op.between]: dateArr,
            }
          }
        })
      }
      else {
        var count = tblhrmdailyrosterattendance.count({
          where: {
            emp_id: empId,
          }
        })
        count.then(c => {
          console.log("count is: ", c)
        })
        var rs = tblhrmdailyrosterattendance.findAll({
          where: {
            emp_id: empId,
          }
        })
      }
      rs.then(a_users => {
        console.log('done attendance');
        console.log(a_users.length)
        startDate = `${new Date().getUTCFullYear()}-${new Date().getUTCMonth()}-1`
        tblemployeedesignations.findAll({
          where: {
            id: l_users[0].designation_id
          }
        }).then(deg_users => {
          console.log("done degination")
          tblemployeedepartments.findAll({
            where: {
              id: l_users[0].department_id
            }
          }).then(dept_users => {
            console.log("done department")
            id_ltrack = []
            for (i = 0; i < 10; i++) {
              id_ltrack.push(a_users[i].absent_type)
            }
            tblhrmemployeeleavetrack.findAll({
              where: {
                id: id_ltrack
              }
            }).then(ltrack_users => {
              console.log("done leave track")
              list = []
              for (i = 0; i < 20; i++) {
                shortDutyFlag = '0';
                if (a_users[i].checkin_time != null && a_users[i].checkout_time != null) {
                  duty_Hour = Math.round((new Date(a_users[i].checkout_time) * 0.001) / 60) / 60 - ((new Date(a_users[i].checkin_time) * 0.001) / 60) / 60
                }
                date1 = new Date(a_users[i].date)
                if (a_users[i].absent_type == '11' && `${date1.getUTCDate()}-${date1.getUTCMonth()}-${date1.getUTCFullYear()}` >= startDate) {
                  if (a_users[i].attendance_type == '2' && a_users[i].checkin_time != 0) {
                    shortDutyFlag = '1';
                  }
                  else if (a_users[i].checkin_time != 0 && a_users[i].checkout_time != 0) {
                    dutyTimeInMinutes = Math.round((new Date(a_users[i].checkout_time) * 0.001) / 60) / 60 - ((new Date(a_users[i].checkin_time) * 0.001) / 60) / 60
                    if (dutyTimeInMins < (EMP_MIN_DUTY_HOUR * 60)) {
                      shortDutyFlag = '1';
                    }
                  }
                }
                id = a_users[i].id ? a_users[i].id : 'NA';
                grab_id = l_users[0].grab_id ? l_users[0].grab_id : 'NA';
                emp_name = `${l_users[0].employee_firstname} ${l_users[0].employee_lastname}` ? `${l_users[0].employee_firstname} ${l_users[0].employee_lastname}` : 'NA'
                emp_name = emp_name.toLowerCase().replace(/\b[a-z]/g, function (letter) {
                  return letter.toUpperCase();
                });
                designation = deg_users[0].designation_name ? deg_users[0].designation_name : 'NA'
                department = dept_users[0].department_name ? dept_users[0].department_name : 'NA'
                city_id = a_users[i].city_id ? a_users[i].city_id : 'NA'
                //date1=new Date(a_users[i].date)
                date = `${date1.getUTCDate()}-${date1.getUTCMonth() + 1}-${date1.getUTCFullYear()}` ? `${date1.getUTCDate()}-${date1.getUTCMonth() + 1}-${date1.getUTCFullYear()}` : 'NA';
                checkin_time = a_users[i].checkin_time != null ? a_users[i].checkin_time : 'NA';
                checkout_time = a_users[i].checkout_time != null ? a_users[i].checkout_time : 'NA';
                dutyTimeInMinutes = Math.round((new Date(a_users[i].checkout_time).getTime() - new Date(a_users[i].checkin_time).getTime()) / 60)
                duty_Hour = `${new Date(dutyTimeInMinutes).getHours()}:${new Date(dutyTimeInMinutes).getMinutes()}`
                d_h = duty_Hour[0] > 1 ? duty_Hour + " hrs" : duty_Hour + " hr";
                attendance_type = a_users[i].attendance_type ? a_users[i].attendance_type : 'NA';
                leave_type = ltrack_users[0].leave_type ? ltrack_users[0].leave_type : 'NA';
                status = l_users[0].status ? l_users[0].status : 'NA';
                var comment = Array.prototype.slice.call(a_users[i].comments, 0)
                comments = comment != '' ? comment : '';
                attendance_id = a_users[i].id;
                duty_time_flag = shortDutyFlag;
                list.push({
                  id: id, emp_id: a_users[i].emp_id, city_id: city_id, date: date,
                  checkin_time: checkin_time, checkout_time: checkout_time, attendance_type: attendance_type,
                  absent_id: a_users[i].absent_type, comments: comments, attendance_id: attendance_id, hrm_mode: 2,
                  grab_id: grab_id, emp_name: emp_name, designation: designation, leave_type: leave_type, status: status,
                  duty_hour: d_h, department: department, duty_time_flag: duty_time_flag
                })
              }
              res.json(list);
            })
          })
        })
      })

    })
  }
  else {
    res.json({ message: "employee id is null or empty" })
  }


}



