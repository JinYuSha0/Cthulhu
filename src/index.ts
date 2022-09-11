import Context from "./context";
import analysis from "./toolkit/analysis";
import memberExpand from "./toolkit/memberExpand";
import randomClassGenerator from "./toolkit/randomClassGenerator";
import { randomNum } from "./toolkit/utils";

const initConfig: Config = {
  random_package_folder_deep: [1, 3],
  random_package_name_length: [1, 3],
  random_member_name_str_length: [3, 8],
  random_class_capacity: [1, 3],
  package_white_list: ["com.microle.mara"],
  construct_white_list: ["com.microle.mara.entity"],
};

async function main(entry: string, config: Config = initConfig) {
  const context = analysis(entry, null, config);
  const [members, constructs] = memberExpand(context);

  const table: Map<string, string> = new Map();

  const memberTable: Map<string, { num: number; members: ClassMember[] }> =
    new Map();
  const memberClasses = randomClassGenerator(members.size, config);
  function getRandomName() {
    const randomIndex = randomNum(0, memberClasses.length - 1);
    return memberClasses[randomIndex];
  }
  for (let [name, classMember] of members.entries()) {
    function walk(classMember: ClassMember) {
      const randomName = getRandomName();
      const value = memberTable.get(randomName);
      if (!value) {
        memberTable.set(randomName, {
          num: 1,
          members: [classMember],
        });
        table.set(name, randomName);
        return;
      }
      const { num, members } = value;
      if (num <= config.random_class_capacity[1]) {
        memberTable.set(randomName, {
          num: num + 1,
          members: [...members, classMember],
        });
        table.set(name, randomName);
      } else {
        walk(classMember);
      }
    }
    walk(classMember);
  }

  console.log(table);

  // const constructTable: Map<string, Context | null> = new Map();
  // const constructsClasses = randomClassGenerator(constructs.size, config, true);
  // constructsClasses.forEach((clazz) => {
  //   constructTable.set(clazz, null);
  // });
  // for (let context of constructs.values()) {
  //   constructTable.set
  // }
}

main(
  "E:\\MyProject\\favorloan\\android\\app\\src\\main\\java\\com\\microle\\mara\\BizNativeModule.java"
);
