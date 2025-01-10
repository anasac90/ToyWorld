let title = "capiTalIze tHe titLe"

let newArr = title.split(' ');
for(let word of newArr){
    if(word.length <= 2) word = word.toLowerCase();
    else word = word.toUpperCase();
}
console.log(newArr.join(' '));




