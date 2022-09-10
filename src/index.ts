import analysis from "./toolkit/analysis";
import memberExpand from "./toolkit/memberExpand";
import randomClassGenerator from "./toolkit/randomClassGenerator";

const initConfig: Config = {
  random_package_folder_deep: [1, 3],
  random_package_name_length: [1, 3],
  random_member_name_str_length: [3, 8],
  random_class_capacity: [1, 3],
  package_white_list: ["com.microle.mara"],
  contact_white_list: ["com.microle.mara.entity"],
};

const memberTable: Map<string, { num: number; members: ClassMember[] }> =
  new Map();

async function main(entry: string, config: Config = initConfig) {
  const context = analysis(entry, null, config);
  const [members, constructs] = memberExpand(context);
  const classes = randomClassGenerator(members.size, config);
  const constructsClasses = randomClassGenerator(constructs.size, config, true);
  classes.forEach((clazz) => {
    memberTable.set(clazz, {
      members: [],
      num: 0,
    });
  });
  // 分配到随机类中
  members.forEach((member, name) => {});
}

main(
  "E:\\MyProject\\favorloan\\android\\app\\src\\main\\java\\com\\microle\\mara\\BizNativeModule.java"
);
