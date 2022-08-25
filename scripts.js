const fs = require('fs');
const csv = require('fast-csv');
//const { request } = require('http');


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


let ELECTIVE_DEPARTMENT_ID;
let ELECTIVE_CREDIT_REQUIREMENT;
const MULTI_REQ_VARIABLES = ['requirementDepartmentId','requirementDepartment','requirementId','requirementName','requirementCreditAmount'];

testGetData("./student2.csv", "./requirement.csv").then(result => {
  let student = result[0];
  let requirement = result[1];

  let courseIds = student.map(obj => obj.course_id);

  let info = [];
  let multiReqCourses = [];

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
      if (courseInstances.length > 1) {
        for (let j = 0; j < MULTI_REQ_VARIABLES.length; j++) {
          takenCourse[MULTI_REQ_VARIABLES[j]] = courseInstances.map(course => course[MULTI_REQ_VARIABLES[j]]);
        }
      }
      while (count[r.stateCourseCode ] > 0) {
        if (typeof takenCourse.requirementId === 'object') {
          multiReqCourses.push(JSON.parse(JSON.stringify(takenCourse)));
        }
        else {
          info.push(JSON.parse(JSON.stringify(takenCourse)));
        }
        count[r.stateCourseCode]--;
      }
    }
  }

  info.sort((a,b) => {return parseInt(a.stateCourseCode, 10) - parseInt(b.stateCourseCode, 10)});
  multiReqCourses.sort((a,b) => {return parseInt(a.stateCourseCode, 10) - parseInt(b.stateCourseCode, 10)});
  student.sort((a,b) => {return parseInt(a.course_id, 10) - parseInt(b.course_id, 10)});

  let tempArr = info.slice();
  let multiTempArr = multiReqCourses.slice();
  let multiCourseReqIds = multiReqCourses.map(course => course.stateCourseCode);
  let singleReqStudent = student.filter(course => multiCourseReqIds.indexOf(course.course_id) === -1);
  let multiReqStudent = student.filter(course => multiCourseReqIds.indexOf(course.course_id) !== -1);

  for (let i = 0; i < tempArr.length; i++) {
    info[i].courseCreditAmount = singleReqStudent[i].transcript_credit;
  }
  for (let i = 0; i < multiTempArr.length; i++) {
    multiReqCourses[i].courseCreditAmount = multiReqStudent[i].transcript_credit;
  }

  //multiTempArr.push(JSON.parse(JSON.stringify(multiTempArr[2]))); //TEMPORARY

  info = tempArr.sort((a,b) => {return a.requirementDepartmentId - b.requirementDepartmentId});
  multiReqCourses = multiTempArr.sort((a,b) => {return a.requirementDepartmentId - b.requirementDepartmentId});

  let acquired = 0;
  for (let i = 0; i < info.length; i++) {
    acquired += parseFloat(info[i].courseCreditAmount);
  }
  for (let i = 0; i < multiReqCourses; i++) {
    acquired += parseFloat(multiReqCourses[i].courseCreditAmount);
  }


  //Instead of a constant 22 required, add up all requirement required credits
  //Also, make missing credits equal 0 if there are more credits than required using an if else statement after the declaration of studentProfile
  const studentProfile = {
    credits: [
      {
        passedCredits: acquired,
        requiredCredits: 0,
        missingCredits: 0,
        data: []
      }
    ]
  }
  


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
  reqs.sort((a,b) => {return a.requirementDepartmentId - b.requirementDepartmentId});

  let depIds = tests.map(obj => parseInt(obj.requirementDepartmentId, 10));
  ELECTIVE_DEPARTMENT_ID = Math.max.apply(Math, depIds).toString();
  ELECTIVE_CREDIT_REQUIREMENT = Math.max.apply(Math, reqs.filter(course => course.requirementDepartmentId === ELECTIVE_DEPARTMENT_ID).map(course => parseFloat(course.requirementCreditAmount, 10)));


  let reqDirectory = {};
  let multiReqDirectory = {};

  for (let i = 0; i < depIds.length; i++) {
    reqDirectory[depIds[i]] = [];
    multiReqDirectory[depIds[i]] = [];
  }

  for (let i = 0; i < reqs.length; i++) {
    let tempObj = {};
    tempObj.requirementID = parseInt(reqs[i].requirementId, 10);
    tempObj.requirementName = reqs[i].requirementName;
    tempObj.creditAmount = parseFloat(reqs[i].requirementCreditAmount, 10);
    tempObj.passedCredits = 0;
    tempObj.courses = [];

    let emptyTempObj = JSON.parse(JSON.stringify(tempObj));

    let courses = info.filter(course => parseInt(course.requirementId, 10) === tempObj.requirementID);//[];
    let courseCredits = courses.map(course => parseFloat(course.courseCreditAmount, 10));
    let countedCredits = subarrayFinder(courseCredits, tempObj.creditAmount);

    let keptCourses = [];
    for (let i = 0; i < courses.length; i++) {
      if (countedCredits.indexOf(parseFloat(courses[i].courseCreditAmount, 10)) !== -1) {
        countedCredits.splice(countedCredits.indexOf(parseFloat(courses[i].courseCreditAmount, 10)), 1);
        keptCourses.push(courses.splice(i, 1)[0]);
        i--;
      }
    }

    let movedReq = JSON.parse(JSON.stringify(tempObj));
    movedReq.creditAmount = null;

    let emptyMovedReq = JSON.parse(JSON.stringify(movedReq));

    movedReq.passedCredits = arrSum(courses.map(course => parseFloat(course.courseCreditAmount, 10)));
    movedReq.courses = courses;
    tempObj.passedCredits = arrSum(keptCourses.map(course => parseFloat(course.courseCreditAmount, 10)));
    tempObj.courses = keptCourses;

    if (reqs[i].requirementDepartmentId === ELECTIVE_DEPARTMENT_ID) {
      tempObj.creditAmount = null;
      tempObj.courses = keptCourses.concat(courses);
      emptyTempObj.creditAmount = null;
    }

    reqDirectory[reqs[i].requirementDepartmentId].push(tempObj);
    multiReqDirectory[reqs[i].requirementDepartmentId].push(emptyTempObj);

    if (courses.length !== 0 && reqs[i].requirementDepartmentId !== '28') {
      reqDirectory[ELECTIVE_DEPARTMENT_ID].push(movedReq);
      multiReqDirectory[ELECTIVE_DEPARTMENT_ID].push(emptyMovedReq);
    }
  }

  for (let i = 0; i < depIds.length; i++) {
    reqDirectory[depIds[i]].sort((a,b) => {return parseInt(a.requirementID, 10) - parseInt(b.requirementID, 10)});
    multiReqDirectory[depIds[i]].sort((a,b) => {return parseInt(a.requirementID, 10) - parseInt(b.requirementID, 10)});
  }

  let requiredCreditSum = 0;
  for (const key in reqDirectory) {
    if (Object.hasOwnProperty.call(reqDirectory, key)) {
      const dep = reqDirectory[key];
      if (key === ELECTIVE_DEPARTMENT_ID) {
        requiredCreditSum += ELECTIVE_CREDIT_REQUIREMENT;
      }
      else {
        requiredCreditSum += arrSum(dep.map(req => req.creditAmount));
      }
    }
  }

  studentProfile.credits[0].requiredCredits = requiredCreditSum;
  let creditsMissing = requiredCreditSum - acquired;
  if (creditsMissing < 0) {
    creditsMissing = 0;
  }
  studentProfile.credits[0].missingCredits = creditsMissing;

  reqDirectory = arrayComboFinder(multiReqCourses, reqDirectory);

  let initialized = [];
  for (let i = 0; i < depIds.length; i++) {
    if (initialized.indexOf(depIds[i]) === -1) {
      let depAddPath = studentProfile.credits[0].data;
      depAddPath.push({});
      depAddPath = depAddPath[depAddPath.length - 1];
      depAddPath.departmentID = parseInt(tests[i].requirementDepartmentId, 10);
      depAddPath.departmentName = tests[i].requirementDepartment;
      depAddPath.passedCredits = 0;
      depAddPath.creditAmount = 0;
      depAddPath.requirements = reqDirectory[depIds[i]];
      depAddPath.passedCredits = depCreditCalc(true, depAddPath.requirements, tests[i]);
      depAddPath.creditAmount = depCreditCalc(false, depAddPath.requirements, tests[i]);
      initialized.push(depIds[i]);
    }
  }

  console.log(studentProfile);
}).catch(err => {
  console.log(err);
});


//FUNCTIONS
//-------------------------------------------------------------------------------

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

//Potential useless variable declaration of combination
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
  for (let i = 0; i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

function subarrayFinder(arr, target) {
  if (arr.length === 0) {
    return [];
  }
  let result = powerSet(arr);
  result.sort((a, b) => arrSum(b) - arrSum(a));

  let resultSums = result.map(arr => arrSum(arr));
  
  let greater = [];
  let less = [];
  let equal = [];

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

  equal = sortOptimalCredits(equal, true);
  greater = sortOptimalCredits(greater, false);
  less = sortOptimalCredits(less, false);

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

function sortOptimalCredits(arr, isEqual) {
  if (arr.length === 0) {
    return arr;
  }
  if (!isEqual) {
    arr = arr.filter(credits => arrSum(credits) === arrSum(arr[0]));
  }
  arr.sort((a, b) => a.length - b.length);
  arr.filter(credits => credits.length === arr[0].length);
  let tempCredits = arr.filter(credits => !credits.some(credit => typeof credit === 'object'));
  if (tempCredits.length !== 0) {
    return tempCredits;
  }
  return arr;
}

function* productGen(arr, cur = []){
  if (arr.length < 1) yield cur;
  else {
    for (let item of arr[0]) {
      yield* productGen(arr.slice(1), [...cur, item]);
    }
  }
}

function difference(a, b) {
  return a.filter(function(v) {
      return !this.get(v) || !this.set(v, this.get(v) - 1);
  }, b.reduce( (acc, v) => acc.set(v, (acc.get(v) || 0) + 1), new Map() ));
}

function arrayComboFinder(arr, directory) {

  let courseReqs = arr.map(course => course.requirementId);

  let result = [];
  for (let combo of productGen(courseReqs)) {
    result.push(combo);
  }

  let directoryCopy = JSON.parse(JSON.stringify(directory));

  let mostReqsFilled = {
    numReqsFilled: 0,
    combinationArray: [],
    directory: JSON.parse(JSON.stringify(directory))
  };

  for (let i = 0; i < result.length; i++) {
    let combi = result[i];
    directoryCopy = JSON.parse(JSON.stringify(directory));
    for (let j = 0; j < arr.length; j++) {
      let course = arr[j];
      let req = combi[j];
      directoryCopy[course.requirementDepartmentId[course.requirementId.indexOf(req.toString())]].filter(obj => obj.requirementID === parseInt(req, 10))[0].courses.push(course);
    }

    //Maybe move elective calculations to final product
    let completedCount = 0;
    for (const key in directoryCopy) {
      if (Object.hasOwnProperty.call(directoryCopy, key)) {
        const element = directoryCopy[key];
        for (let j = 0; j < element.length; j++) {
          if (key !== ELECTIVE_DEPARTMENT_ID) {
            let courseArray = element[j].courses;
            let courseCredits = courseArray.map(course => parseFloat(course.courseCreditAmount), 10);
            let courseSum = arrSum(courseCredits);
            if (courseSum > element[j].creditAmount) {
              let newCombi = subarrayFinder(courseCredits, element[j].creditAmount);
              let combiDifferences = difference(courseCredits, newCombi);
              if (combiDifferences.length > 0) {
                let electiveCourses = [];
                for (let k = 0; k < combiDifferences.length; k++) {
                  electiveCourses.push(courseArray.splice(courseCredits.indexOf(combiDifferences[k]), 1)[0]);
                }
                let electiveIndex = directoryCopy[ELECTIVE_DEPARTMENT_ID].map(req => req.requirementID).indexOf(parseInt(element[j].requirementID, 10));
                if (electiveIndex === -1) {
                  let reqCopy = JSON.parse(JSON.stringify(element[j]));
                  reqCopy.courses = [];
                  reqCopy.creditAmount = null;
                  directoryCopy[ELECTIVE_DEPARTMENT_ID].push(reqCopy);
                  electiveIndex = directoryCopy[ELECTIVE_DEPARTMENT_ID].length - 1;
                }
                directoryCopy[ELECTIVE_DEPARTMENT_ID][electiveIndex].courses = directoryCopy[ELECTIVE_DEPARTMENT_ID][electiveIndex].courses.concat(electiveCourses);
                directoryCopy[ELECTIVE_DEPARTMENT_ID][electiveIndex].passedCredits = arrSum(directoryCopy[ELECTIVE_DEPARTMENT_ID][electiveIndex].courses.map(course => parseFloat(course.courseCreditAmount, 10)));
                ///sort the elective req courses and normal req courses by reqid
              }
            }
          }
          element[j].passedCredits = arrSum(element[j].courses.map(course => parseFloat(course.courseCreditAmount, 10)));
          if (element[j].creditAmount !== null && element[j].passedCredits >= element[j].creditAmount) {
            completedCount++;
          }
        }
      }
    }
    directoryCopy[ELECTIVE_DEPARTMENT_ID].sort((a,b) => {return parseInt(a.requirementID, 10) - parseInt(b.requirementID, 10)});

    if (arrSum(directoryCopy[ELECTIVE_DEPARTMENT_ID].map(req => req.passedCredits)) >= ELECTIVE_CREDIT_REQUIREMENT) {
      completedCount++;
    }

    let isMoreOptimal = false;
    if (completedCount === mostReqsFilled.numReqsFilled) {
      if (new Set(combi).size > new Set(mostReqsFilled.combinationArray).size) {
        isMoreOptimal = true;
      }
    }
    else if (completedCount > mostReqsFilled.numReqsFilled) {
      isMoreOptimal = true;
    }

    if (isMoreOptimal) {
      mostReqsFilled = {
        numReqsFilled: completedCount,
        combinationArray: combi,
        directory: JSON.parse(JSON.stringify(directoryCopy))
      }
    }
  }
  
  for (const key in mostReqsFilled.directory) {
    if (Object.hasOwnProperty.call(mostReqsFilled.directory, key)) {
      const element = mostReqsFilled.directory[key];
      for (let i = 0; i < element.length; i++) {
        let courseArr = element[i].courses;
        for (let j = 0; j < courseArr.length; j++) {
          if (typeof courseArr[j].requirementId === 'object') {
            let correctIndex = courseArr[j].requirementId.indexOf(element[i].requirementID.toString());
            for (let k = 0; k < MULTI_REQ_VARIABLES.length; k++) {
              courseArr[j][MULTI_REQ_VARIABLES[k]] = courseArr[j][MULTI_REQ_VARIABLES[k]][correctIndex];
            }
          }
        }
      }
    }
  }
  return mostReqsFilled.directory;
}