export function randomNum(minNum: number, maxNum: number) {
  switch (arguments.length) {
    case 1:
      return parseInt(`${Math.random() * minNum + 1}`, 10);
    case 2:
      return parseInt(`${Math.random() * (maxNum - minNum + 1) + minNum}`, 10);
    default:
      return 0;
  }
}

export function randomLetter() {
  const arr = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
  ];
  const index = randomNum(0, 25);
  return arr[index].toLocaleLowerCase();
}

export function randomStr(minNum: number, maxNum: number) {
  const l = randomNum(minNum, maxNum);
  const str =
    randomLetter() + Math.random().toString(36).slice(2).toLocaleLowerCase();
  return str.slice(0, l);
}

export function deduplicationByField<T>(arr: T[], fieldName: keyof T): T[] {
  const set = new Set();
  const result = [] as unknown as T[];
  arr.forEach((item) => {
    if (!set.has(item[fieldName])) {
      result.push(item);
    }
  });
  return result;
}
