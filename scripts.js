const fs = require('fs');
const csv = require('fast-csv');
const { request } = require('http');

// async function readData() {
//   let data = [];

//   await fs.createReadStream('./student.csv')
//     .pipe(csv.parse({ headers: true }))
//     .on('error', error => console.error(error))
//     .on('data', row => data.push(row))
//     .on('end', () => {return data});//console.log(data));

// console.log(data)
//   return data;
// }




// const courses = []
// for (let i = 0; i < data.length; i++) {
//   console.log(data[i].course_id);
// }

//console.log(data2);


//console.log(await readData());

// readData().then(data => {
//   console.log(data);
// });


function getData(file, type) {
  let data = [];
  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on('error', error => {
        reject(error);
      })
      .pipe(csv.parse({ headers: true }))
      .on('data', (row) => {
        data.push(row);
      })
      .on('end', () => {
        resolve(data);
      });
  });
}

async function testGetData(stuFile, reqFile) {
  try {
    const data = await getData(stuFile, {});
    const base = await getData(reqFile, {});
    //console.log("testGetData: parsed CSV data:", data);
    return [data, base];
  } catch (error) {
    console.error("testGetData: An error occurred: ", error.message);
  }
}
//DO EVERYTHING IN TESTGETDATA
const ELECTIVE_DEPARTMENT_ID = '28';
const ELECTIVE_CREDIT_REQUIREMENT = 3.5;
testGetData("./student2.csv", "./requirement.csv").then(result => {
  let student = result[0];
  let requirement = result[1];



  let courseIds = student.map(obj => obj.course_id);
  //console.log(courseIds);
  // for (let i = 0; i < student.length; i++) {
  //   courseIds.push(student[i].course_id);
  // }

  let info = [];

  const count = {};

  for (const element of courseIds) {
    if (count[element]) {
      count[element] += 1;
    } else {
      count[element] = 1;
    }
  }

  for (let i = 0; i < requirement.length; i++) {
    let r = requirement[i];
    if (courseIds.indexOf(r.stateCourseCode) != -1 && count[r.stateCourseCode] != 0) {
      let takenCourse = JSON.parse(JSON.stringify(r));
      let courseInstances = requirement.filter(course => course.stateCourseCode === r.stateCourseCode);
      //requirementCourseId is also different but that's not important
      if (courseInstances.length > 1) {
        takenCourse.requirementId2 = courseInstances[1].requirementId;
      }
      else {
        takenCourse.requirementId2 = null;
      }
      while (count[r.stateCourseCode ] > 0) {
        info.push(takenCourse);//JSON.parse(JSON.stringify(r)));//[r.requirementDepartmentId, r.stateCourseCode, r.requirementId, r.requirementCreditAmount, r.stateCourseName]);
        count[r.stateCourseCode]--;
      }
    }
  }

  info.sort((a,b) => {return parseInt(a.stateCourseCode, 10) - parseInt(b.stateCourseCode, 10)});
  student.sort((a,b) => {return parseInt(a.course_id, 10) - parseInt(b.course_id, 10)});

  let tempArr = info.slice();

  for (let i = 0; i < tempArr.length; i++) {
    info[i].courseCreditAmount = student[i].transcript_credit;
  }

  info = tempArr.sort((a,b) => {return a.requirementDepartmentId - b.requirementDepartmentId});

  let acquired = 0;
  for (let i = 0; i < info.length; i++) {
    acquired += parseFloat(info[i].courseCreditAmount);
  }






  const studentProfile = {
    credits: [
      {
        passedCredits: parseFloat(acquired),
        requiredCredits: 22,
        missingCredits: 22 - acquired,
        data: [
          /*{
            departmentName: "English Language and Literature",
            departmentID: 1,
            creditAmount: 4,
            passedCredits: creditCalc("requirementDepartmentId",1,info),
            requirements: [
              {
                requirementID: 40004390,
                requirementName: 'ELA',
                creditAmount: 4,
                passedCredits: creditCalc('requirementId', 40004390, info),
                courses: []
              }
            ]
          },*/
        ]
      }
    ]
  }

  // //Adding departments based on classes taken
  // let depIds = info.map(obj => parseInt(obj.requirementDepartmentId, 10));
  // let initialized = [];
  // for (let i = 0; i < depIds.length; i++) {
  //   if (initialized.indexOf(depIds[i]) === -1) {
  //     let depAddPath = studentProfile.credits[0].data;
  //     depAddPath.push({});
  //     depAddPath = depAddPath[depAddPath.length - 1];
  //     depAddPath.departmentID = parseInt(info[i].requirementDepartmentId, 10);
  //     depAddPath.departmentName = info[i].requirementDepartment;
  //     //add total required credits after data is fixed
  //     depAddPath.passedCredits = creditCalc("requirementDepartmentId",depAddPath.departmentID,info);
  //     depAddPath.courses = [];

  //     initialized.push(depIds[i]);
  //   }
  // }

  //Adding departments based on all departments available
  let tests = [];
  let testsAdded = [];
  let reqs = [];
  let reqsAdded = [];
  for (let i = 0; i < requirement.length; i++) {
    if (testsAdded.indexOf(parseInt(requirement[i].requirementDepartmentId, 10)) === -1) {
      tests.push(requirement[i]);
      testsAdded.push(parseInt(requirement[i].requirementDepartmentId));
    }
    if (reqsAdded.indexOf(parseInt(requirement[i].requirementId, 10)) === -1) {
      reqs.push(requirement[i]);
      reqsAdded.push(parseInt(requirement[i].requirementId));
    }
  }
  tests.sort((a,b) => {return a.requirementDepartmentId - b.requirementDepartmentId});
  testsAdded.sort((a,b) => {return a - b});
  //Maybe sort by reqDepId, but art/music gets messed up, so maybe find a way to sort by deps then within the deps sort by reqid
  reqs.sort((a,b) => {return a.requirementDepartmentId - b.requirementDepartmentId});
  

  let depIds = tests.map(obj => parseInt(obj.requirementDepartmentId, 10));

  //Multireq testing site START---------------------------------------------

  let multiReqs = info.filter(course => course.requirementId2 !== null);
  //console.log(multiReqs);
  let multiReqIds = multiReqs.map(course => [course.requirementId, course.requirementId2]);
  let uniqueMultiReqIds = [];
  for (let i = 0; i < multiReqIds.length; i++) {
    for (let j = 0; j < multiReqIds[i].length; j++) {
      if (uniqueMultiReqIds.indexOf(multiReqIds[i][j]) === -1) {
        uniqueMultiReqIds.push(multiReqIds[i][j]);
      }
    }
  }
  let multiReqDirectory = {};
  for (let i = 0; i < uniqueMultiReqIds.length; i++) {
    multiReqDirectory[uniqueMultiReqIds[i]] = [];    
  }

  for (let i = 0; i < multiReqIds.length; i++) {
    for (let j = 0; j < multiReqIds[i].length; j++) {
      multiReqDirectory[multiReqIds[i][j]].push(multiReqs[i]);
    }
  }


  let multiReqDirectoryKeys = Object.keys(multiReqDirectory);
  let combinedReq = multiReqDirectoryKeys[0];

  for (let i = 1; i < multiReqDirectoryKeys.length; i++) {
    if (multiReqDirectory[multiReqDirectoryKeys[i]].length > multiReqDirectory[combinedReq].length) {
      combinedReq = multiReqDirectoryKeys[i];
    }
  }
  //NOTE: may have to move this whole section to after the requirement objects are created to get the requirementCreditAmount for each requirement
  //since the classes can't be relied upon since they all show the same requirementCreditAmount
  //This could be remedied by also adding requirementCreditAmount2, but just using the created requirement objects should be easier
  //let courseCredits = courses.map(course => parseFloat(course.courseCreditAmount, 10));
  //let countedCredits = subarrayFinder(courseCredits, tempObj.creditAmount);

  //UNCOMMENT THIS TO CONTINUE
  //for (const key in multiReqDirectory) {
  //  if (Object.hasOwnProperty.call(multiReqDirectory, key)) {
  //    
  //  }
  //}


  //Multireq testing site END---------------------------------------------

  //Might not need this directory
  let reqDirectory = {};
  for (let i = 0; i < depIds.length; i++) {
    reqDirectory[depIds[i]] = [];
  }

  for (let i = 0; i < reqs.length; i++) {
    let tempObj = {};
    tempObj.requirementID = parseInt(reqs[i].requirementId, 10);
    tempObj.requirementName = reqs[i].requirementName;
    tempObj.creditAmount = parseFloat(reqs[i].requirementCreditAmount, 10);
    tempObj.passedCredits = 0;
    tempObj.courses = [];

    let courses = info.filter(course => parseInt(course.requirementId, 10) === tempObj.requirementID);//[];
    let courseCredits = courses.map(course => parseFloat(course.courseCreditAmount, 10));
    let countedCredits = subarrayFinder(courseCredits, tempObj.creditAmount);
    //REMEMBER to add something to handle requirements with no courses since the function returns undefined for them
    //console.log(countedCredits);

    let keptCourses = [];
    for (let i = 0; i < courses.length; i++) {
      if (countedCredits.indexOf(parseFloat(courses[i].courseCreditAmount, 10)) !== -1) {
        countedCredits.splice(countedCredits.indexOf(parseFloat(courses[i].courseCreditAmount, 10)), 1);
        keptCourses.push(courses.splice(i, 1)[0]);
        i--;
      }
    }

    //console.log(keptCourses);
    let movedReq = JSON.parse(JSON.stringify(tempObj));
    movedReq.creditAmount = null;
    movedReq.passedCredits = arrSum(courses.map(course => parseFloat(course.courseCreditAmount, 10)));
    movedReq.courses = courses;
    tempObj.passedCredits = arrSum(keptCourses.map(course => parseFloat(course.courseCreditAmount, 10)));
    tempObj.courses = keptCourses;

    if (reqs[i].requirementDepartmentId === ELECTIVE_DEPARTMENT_ID) {
      tempObj.creditAmount = null;
      tempObj.courses = keptCourses.concat(courses);
    }

    //ISSUE: for some reason, band being counted is messed up, and only 1 credit is stored in the requirement despite it not being fulfilled
    reqDirectory[reqs[i].requirementDepartmentId].push(tempObj);

    //MAYBE ADD loop that checks if the req already exists in electives, if so just add the courses to that req, if not add the new req
    if (courses.length !== 0 && reqs[i].requirementDepartmentId !== '28') {
      //movedReq.passedCredits = arrSum(movedReq.courses.map(course => parseFloat(course.courseCreditAmount, 10)));
      reqDirectory[ELECTIVE_DEPARTMENT_ID].push(movedReq);
    }
    //reqDirectory[reqs[i].requirementDepartmentId].push(parseInt(reqs[i].requirementId, 10));
  }

  for (let i = 0; i < depIds.length; i++) {
    reqDirectory[depIds[i]].sort((a,b) => {return parseInt(a.requirementID, 10) - parseInt(b.requirementID, 10)});
  }

  //console.log(reqDirectory);
  //console.log(reqs.filter(obj => obj.requirementDepartmentId === '4'));

  


  let initialized = [];
  for (let i = 0; i < depIds.length; i++) {
    if (initialized.indexOf(depIds[i]) === -1) {
      let depAddPath = studentProfile.credits[0].data;
      depAddPath.push({});
      depAddPath = depAddPath[depAddPath.length - 1];
      depAddPath.departmentID = parseInt(tests[i].requirementDepartmentId, 10);
      depAddPath.departmentName = tests[i].requirementDepartment;
      //add total required credits after data is fixed
      //update - have to make this value equal to the requirementCreditAmount of all requirement types in each department added together
      //Example: Life and Phys Science department has 3 credits, but to get to that, you have to add up each of the requirements' requirementCreditAmount of 1
      //depAddPath.creditAmount = tests[i].requirementCreditAmount;
      depAddPath.passedCredits = 0;//creditCalc("requirementDepartmentId",depAddPath.departmentID, true, info);
      depAddPath.creditAmount = 0;
      depAddPath.requirements = reqDirectory[depIds[i]];
      depAddPath.passedCredits = depCreditCalc(true, depAddPath.requirements, tests[i]);
      depAddPath.creditAmount = depCreditCalc(false, depAddPath.requirements, tests[i]);


      initialized.push(depIds[i]);
    }
  }

  //for (let i = 0; i < info.length; i++) {
  //  addCourse(info[i].requirementDepartmentId, info[i].requirementId, info[i]);
  //}
  






  //console.log('searched set:'+ JSON.stringify(subSetSum([5, 6, 7, 8], 16)));

  //console.log(subSetSum2([5, 1, 8, 2], 16));

  //console.log(subSetSum3([5, 1, 8, 2], 16));


  //addCourse(1, 40004390, info[0]);
  for (let i = 0; i < studentProfile.credits[0].data.length; i++) {
     console.log(studentProfile.credits[0].data[i]);
  }
  //studentProfile.credits[0].data.forEach(element => {
  //  console.log(element);
    
  //});
  
  /*
  for (const key in reqDirectory) {
    if (Object.hasOwnProperty.call(reqDirectory, key)) {
      const element = reqDirectory[key];
      for (let i = 0; i < element.length; i++) {
        console.log(element[i].requirementName, element[i].courses);
      }
    }
  }
  */
  
  //console.log(reqDirectory);
  //console.log(studentProfile.credits[0].data);//[0].requirements[0].courses);
  //console.log(courseIds);
  //console.log(info);
}).catch(err => {
  console.log(err.message);
});




//readData();

const creditCalc = (idType, id, isAcquiredCredits, courses) => {
  let key;
  if (isAcquiredCredits) {
    key = 'courseCreditAmount';
  }
  else {
    key = 'requirementCreditAmount';
  }
  let amt = 0;
  for (let i = 0; i < courses.length; i++) {
    if (parseInt(courses[i][idType]) === parseInt(id)) {
      amt += parseFloat(courses[i][key]);
    }
  }
  return amt;
}

const depCreditCalc = (isAcquiredCredits, reqArr, testCourse) => {
  let key;
  if (isAcquiredCredits) {
    key = 'passedCredits';
  }
  else {
    key = 'creditAmount';
  }

  if (testCourse.requirementDepartmentId === ELECTIVE_DEPARTMENT_ID && key === 'creditAmount') {
    return ELECTIVE_CREDIT_REQUIREMENT;
  }

  let amt = 0;
  for (let i = 0; i < reqArr.length; i++) {
    amt += reqArr[i][key];
  }
  return amt;

}

const addCourse = (depId, reqId, course) => {
  let path = studentProfile.credits[0].data;
  for (let i = 0; i < path.length; i++) {
    if (path[i].departmentID === depId) {
      path = path[i].requirements;
      break;
    }
  }
  for (let i = 0; i < path.length; i++) {
    if (path[i].requirementID === reqId) {
      path = path[i].courses;
      break;
    }
  }
  path.push(course);
}



function powerSet(list) {
  let set = [],
    listSize = list.length,
    combinationsCount = (1 << listSize),
    combination;

  for (let i = 1; i < combinationsCount; i++) {
    let combination = [];
    for (let j = 0; j < listSize; j++) {
      if ((i & (1 << j))) {
        combination.push(list[j]);
      }
    }
    set.push(combination);
  }
  return set;
}

function arrSum(arr) {
  let sum = 0;
  //arr.forEach(element => {
  //  sum += element;
  //});
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

function subarrayFinder(arr, target) {
  if (arr.length === 0) {
    return [];
  }
  // Driver code
  //let arr = [ 1, 2, 3 ];
  //let result = [];
  let result = powerSet(arr);
  //console.log(result);

  result.sort((a, b) => arrSum(b) - arrSum(a));
  //console.log(result);

  //console.log(result);
  let resultSums = result.map(arr => arrSum(arr));
  //console.log(resultSums);
  let greater = [];
  let less = [];
  let equal = [];
  //let target = 3;
  for (let i = 0; i < resultSums.length; i++) {
    if (resultSums[i] < target) {
      less.push(result[i]);
    }
    else if (resultSums[i] > target) {
      greater.unshift(result[i]);
    }
    else {
      equal.push(result[i]);
    }
  }
  equal.sort((a, b) => a.length - b.length);
  //console.log(less, equal, greater);

  if (equal.length > 0) {
    return equal[0];
  }
  else if (greater.length > 0) {
    return greater[0];
  }
  else {
    return less[0];
  }
}




/*
IDEA FOR THE SCIENCE COURSE SORTING: while or after info is created, for each course the student took 
count the number of times it appears in requirement.csv (based on one of it's attributes, probably course ID), 
and if it does appear multiple times add a secondary attribute (EX: requirementId2) for the class that has the
other requirement it can count as (and add any other attributes that may be useful or different). 
Also maybe still put those attribute keys in the courses that appeared a single time but make them null
instead of giving them a value just to make everything equal
*/


//If there are issues with the elective constants, move the functions to the end of testgetdata