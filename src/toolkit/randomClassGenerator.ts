import { randomNum, randomStr } from "./utils";

const classNameTable: Set<string> = new Set();

export default function (
  size: number,
  config: Config,
  fixedSize: boolean = false
) {
  const classSize = fixedSize
    ? size
    : randomNum(
        Math.ceil(size / config.random_class_capacity[0]),
        Math.ceil(size / config.random_class_capacity[1])
      );
  const result: string[] = [];
  function gen() {
    let classPath = "";
    const deep = randomNum(...config.random_package_folder_deep);
    if (deep > 1) {
      for (let i = 0; i < deep; i++) {
        classPath +=
          (classPath === "" ? "" : ".") +
          randomStr(...config.random_package_name_length);
      }
    } else {
      classPath = randomStr(...config.random_package_name_length);
    }
    return classPath;
  }
  for (let i = 0; i < classSize; i++) {
    function walk() {
      const classPath = gen();
      const classPathSplit = classPath.split(".");
      const lastName = classPathSplit[classPathSplit.length - 1];
      if (classNameTable.has(lastName)) {
        walk();
      } else {
        result.push(classPath);
        classNameTable.add(lastName);
      }
    }
    walk();
  }
  return result;
}
