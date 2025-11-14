let nums = [31, 25, 72, 79, 74]

for (let i = 0; i < nums.length; i++) {
  let currentNum = (nums[i].toString());
  let currentSum = numSum(currentNum);
  if (currentSum == i) {
    console.log(i);
  }
}
console.log(-1);



function numSum(num) {
  let count = 0;
  for (let n of num) {
    count = count + Number(n);
  }
  return count;
}