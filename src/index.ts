import analysis from "./toolkit/analysis";
import memberExpand from "./toolkit/memberExpand";
import randomClassGenerator from "./toolkit/randomClassGenerator";

const initConfig: Config = {
  random_package_folder_deep: [1, 3],
  random_package_name_length: [1, 3],
  random_member_name_str_length: [3, 8],
  random_class_capacity: [1, 3],
  package_white_list: ["com.lending.loan.cashx"],
  contact_white_list: ["com.lending.loan.cashx.entity"],
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
  "/Users/shaojinyu/workplace/cashx/android/app/src/main/java/com/lending/loan/cashx/BizNativeModule.java"
);
