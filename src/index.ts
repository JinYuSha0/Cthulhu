import path from "path";
import analysis from "./toolkit/analysis";
import clearDist from "./toolkit/clearDist";
import JavaClassTemplate from "./toolkit/javaClassTemplate";
import memberExpand from "./toolkit/memberExpand";
import randomClassGenerator from "./toolkit/randomClassGenerator";
import { randomNum } from "./toolkit/utils";

const initConfig: Config = {
  random_package_folder_deep: [1, 3],
  random_package_name_length: [1, 3],
  random_member_name_str_length: [3, 8],
  random_class_capacity: [1, 3],
  root_package: "com.lending.loan.cashx",
  package_white_list: ["com.lending.loan.cashx"],
  construct_white_list: ["com.lending.loan.cashx.entity"],
  class_white_list: ["com.lending.loan.cashx.utils.EncryptJNI"],
  output: path.join(__dirname, "../dist"),
};

async function main(entry: string, config: Config = initConfig) {
  clearDist();

  const context = analysis(entry, null, config);
  const [members, constructs] = memberExpand(context);

  const table: Map<string, { class: string; member: ClassMember }> = new Map();

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
        table.set(name, { class: randomName, member: classMember });
        return;
      }
      const { num, members } = value;
      if (num <= config.random_class_capacity[1]) {
        memberTable.set(randomName, {
          num: num + 1,
          members: [...members, classMember],
        });
        table.set(name, { class: randomName, member: classMember });
      } else {
        walk(classMember);
      }
    }
    walk(classMember);
  }

  const classTable = new Map<string, JavaClassTemplate>();
  table.forEach((value, key) => {
    if (!classTable.has(value.class)) {
      classTable.set(value.class, new JavaClassTemplate(value.class, config));
    }
    const template = classTable.get(value.class)!;
    switch (value.member.type) {
      case "import":
        template.addImport(value.member);
        break;
      case "attribute":
        template.addAttr(value.member);
        break;
      case "childClass":
        template.addClass(value.member as ChildClassMemeber);
        break;
      case "method":
        const methodMember = value.member as MethodMember;
        template.addMethod(methodMember);
        template.addImport(methodMember.depends);
        break;
    }
  });
  classTable.forEach((v) => v.create());

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
  "/Users/shaojinyu/workplace/cashx/android/app/src/main/java/com/lending/loan/cashx/BizNativeModule.java"
);
