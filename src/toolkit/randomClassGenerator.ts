import { randomNum, randomStr } from "./utils";

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
  for (let i = 0; i < classSize; i++) {
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
    result.push(classPath);
  }
  return result;
}
