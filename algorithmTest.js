
const subSetSum = function(input, sum) {
    for (let i = 0; i < input.length; i++) {
      input[i] *= 100;
    }
    sum *= 100;

    let y = input.length;
    let x = sum;

    if(input.length === 0) return 0;

    let d = [];

    //fill the rows
    for (let i = 0; i <= y; i++) {
      d[i] = [];
      d[i][0] = true;
    }
    
    for (let j = 1; j <= y; j++) { //j row
      for (let i = 1; i <= x; i++) { //i column
      let num = input[j-1];
        if(num === i) {
          d[j][i] = true;
        } else if(d[j-1][i]) {
          d[j][i] = true;
        } else if (d[j-1][i-num]) {
          d[j][i] = true;
        }
      }
    }
    
    //console.table(d); //uncomment to see the table
    if(!d[y][x]) return null;

    let searchedSet = [];
    for(let j=input.length, i=sum; j>0 && i != 0; j--) {
      if(input[j-1] !== i) {
        while(d[j-1][i]) { // go up
          j--;
        }
      }
      searchedSet.push(input[j-1]);
      i = i-input[j-1];
    }
    
    for (let i = 0; i < searchedSet.length; i++) {
      searchedSet[i] /= 100;
    }
    return searchedSet;
};
const subSetSum2 = function(arr, target) {
    let y = arr.length;
    let x = target;

    if(arr.length === 0) return 0;

    let dp = [];

    //fill the rows
    for (let i = 0; i <= y; i++) {
      dp[i] = [];
      dp[i][0] = true;
    }
    
    for (let j = 1; j <= y; j++) { //j row
      for (let i = 1; i <= x; i++) { //i column
        let num = arr[j-1];
        if(num === i) {
          dp[j][i] = true;
        } else if(dp[j-1][i]) {
          dp[j][i] = true;
        } else if (dp[j-1][i-num]) {
          dp[j][i] = true;
        }
      }
    }



    //dp = [];
    for (let i = 0; i <= target; i++) {
        dp[arr.length][i] = i;
    }
    console.table(dp);
    //infinite loop
    for (let i = arr.length - 1; i >= 0; i--) {
        for (let j = target; j >= 0; j--) {
            let pick = 0;
            if (j + arr[i] <= target) {
                pick = dp[i+1][j+arr[i]];
            }
            let leave = dp[i+1][j];
            dp[i][j] = Math.max(pick, leave);
            console.table(dp);
        }
    }
    return dp[0][0];
}
const generate = function(index, end, sum, target, arr) {
    if (index === end) {
        let result = [];
        if (sum <= target) {
        result.push(sum);
        }
        return result;
    }
    let pick = generate(index+1, end, sum + arr[index], target, arr);
    let leave = generate(index+1, end, sum, target, arr);
    return pick.concat(leave);
}
function binarySearch(ar, el, compare_fn) {
    let m = 0;
    let n = ar.length - 1;
    while (m <= n) {
        let k = (n + m) >> 1;
        let cmp = compare_fn(el, ar[k]);
        if (cmp > 0) {
            m = k + 1;
        } else if(cmp < 0) {
            n = k - 1;
        } else {
            return k;
        }
    }
    return -m - 1;
}
function compare_number(a, b) {
    return a - b;
}
const subSetSum3 = function(arr, target) {
    let first = generate(0, arr.length/2, 0, target, arr);
    let second = generate(arr.length/2, arr.length, 0, target, arr);
    second.sort();
    let result = 0;
    for (let i = 0; i < first.length - 1; i++) {
        let rem = binarySearch(second, target - first[i], compare_number);
        result = Math.max(result, arr[i] + rem);
    }
    return result;
}
const subSetSum4 = function(index, sum, target, arr) {
    if (sum > target) {
        return 0;
    }
    if (index === arr.length) {
        return sum;
    }
    let pick = subSetSum4(index+1, sum + arr[index], target, arr);
    let leave = subSetSum4(index+1, sum, target, arr);
    return Math.max(pick, leave);
}

//Check this one out: may be editable
function subArraySum(arr, n, sum) {
    //cur_sum to keep track of cumulative sum till that point
    let cur_sum = 0;
    let start = 0;
    let end = -1;
    let hashMap = new Map();

    for (let i = 0; i < n; i++) {
        cur_sum = cur_sum + arr[i];
        //check whether cur_sum - sum = 0, if 0 it means
        //the sub array is starting from index 0- so stop
        if (cur_sum - sum == 0) {
            start = 0;
            end = i;
            break;
        }
        //if hashMap already has the value, means we already
        // have subarray with the sum - so stop
        if (hashMap.has(cur_sum - sum)) {
            start = hashMap.get(cur_sum - sum) + 1;
            end = i;
            break;
        }
        //if value is not present then add to hashmap
        hashMap.set(cur_sum, i);

    }
    // if end is -1 : means we have reached end without the sum
    if (end == -1) {
        console.log("No subarray with given sum exists");
    }
    else {
        console.log("Sum found between indexes "
                        + start + " to " + end);
    }

}

//console.log(subSetSum2([5, 2, 8], 16));

function subsetSum5(numbers, target, partial, store) {
  let s, n, remaining;

  partial = partial || [];

  // sum partial
  s = partial.reduce(function (a, b) {
    return a + b;
  }, 0);

  // check if the partial sum is equals to target
  if (s === target) {
    //console.log("%s=%s", partial.join("+"), target)
    //console.log(partial, target);
    store.push(partial.slice());
  }

  if (s >= target) {
    console.log(partial);
    return;  // if we reach the number why bother to continue
  }

  for (let i = 0; i < numbers.length; i++) {
    n = numbers[i];
    remaining = numbers.slice(i + 1);
    subsetSum5(remaining, target, partial.concat([n]), result);
  }
}

//let result = [];
//subsetSum5([10, 2, 4, 8, 16],15, [], result);
//console.log(result);

function printSubArrays(arr, start, end, store) {
  // Stop if we have reached the end
  // of the array    
  if (end == arr.length)
    return;

  // Increment the end point and start
  // from 0
  else if (start > end)
    printSubArrays(arr, 0, end + 1, store);

  // Print the subarray and increment
  // the starting point
  else {
    let temp = [];
    //console.log("[");
    for (let i = start; i < end; i++) {
      //console.log( arr[i] + ", ");
      temp.push(arr[i]);
    }
    temp.push(arr[end]);
    store.push(temp);
    //console.log(arr[end] + "]<br>");
    printSubArrays(arr, start + 1, end, store);
  }
  return;
}

const arrSum = arr => {
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
  else if (less.length > 0) {
    return less[0];
  }
  else {
    return greater[0];
  }
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

//console.log(subarrayFinder([5, 3, 8, 2, 11], 16));

const bruteTest = function(arr, len, target) {
    let currSum = 0;
    for (let i = 0; i < len; i++) {
        currSum = 0;
        for (let j = i; j < len; j++) {
            currSum = currSum + arr[j];
            if (currSum === target) {
                return [arr[i], arr[j]];
            }
        }
    }
}

//let test = [[2, 4],[5, 6],[3, new Number(2)]];
//let tempTest = test.filter(credits => !credits.some(credit => typeof credit === 'object'));
//console.log(tempTest);
//console.log(typeof test === 'object');

//console.log(bruteTest([11, 5, 8, 2, 3], 5, 16));
//subArraySum([11, 2, 3, 2, 3], 5, 16);

//IDEA: instead of a complex algorithm, just loop through all of the requirements in student profile, and see if
//there is a course that fits into one of those requirements, if there is put courses in until either 
//a. the max credits are full or
//b. there are no more courses left
//POTENTIAL PROBLEM: how will decimal values be accounted for when adding together (ex: if the credit amount is 1 it shouldn't add .5 then 1)





var a = [1, 2, 3];
var b = ["orange", "poke"];
var c = ["melon", "table", 93, 71, "rock"];
var arrayA = [a, b, c];

function* productGen(arr, cur = []){
  if (arr.length < 1) yield cur;
  else {
    for (let item of arr[0]) {
      yield* productGen(arr.slice(1), [...cur, item]);
    }
  }
}


let testArr = [];
for (let combo of productGen(arrayA)){
  // do something with combo
  testArr.push(combo);

}
let test1 = [1, 3, 5, 7, 9];
let test2 = [1, 3, 5, 7, 9];
//console.log(testArr);
console.log(test1.equals(test2));

