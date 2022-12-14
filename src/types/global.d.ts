import type Context from "../context";

declare global {
  export type Config = {
    random_package_folder_deep: [number, number]; // 随机包名深度 root.a.b.c
    random_package_name_length: [number, number]; // 随机包名长度 root.{abc}
    random_member_name_str_length: [number, number]; // 随机成员名长度 public static void {xxxxxxxx}
    random_class_capacity: [number, number]; // 随机类容量（类包含的方法数量）
    root_package: string;
    package_white_list: string[];
    construct_white_list: string[];
    class_white_list: string[];
    output: string;
  };

  export interface ClassMember {
    type: "import" | "attribute" | "method" | "class" | "childClass";
    isPublic: boolean;
    isStatic: boolean;
    name: string;
    content: string;
    ctxRef: { current: Context | null };
    depends?: ClassMember[];
    context?: Context;
    newName?: string;
  }

  export interface MethodMember extends ClassMember {
    type: "method";
    depends: ClassMember[];
  }

  export interface ChildClassMemeber extends ClassMember {
    type: "childClass";
    context: Context;
  }

  export interface NewClassMember extends ClassMember {
    newName: string;
  }
}

export {};
