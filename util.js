const superscript = (number) => {
  let numberString = number.toString();
  let res = '';
  for(let i = 0; i < numberString.length; i++) {
    const num = Number(numberString[i]);
    if(num === 1) {
      res += String.fromCodePoint(0x00B9);
    } else if(num === 2 || num === 3) {
      res += String.fromCodePoint(0x00B0 + num)
    } else {
      res += String.fromCodePoint(0x2070 + num)
    }
  }
  return res;
}

module.exports = {
  superscript
};
