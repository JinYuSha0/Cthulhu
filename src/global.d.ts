import type Context from "./context";

declare global {
  export type Config = {
    random_package_folder_deep: [number, number]; // 随机包名深度 root.a.b.c
    random_package_name_length: [number, number]; // 随机包名长度 root.{abc}
    random_member_name_str_length: [number, number]; // 随机成员名长度 public static void {xxxxxxxx}
    random_class_capacity: [number, number]; // 随机类容量（类包含的方法数量）
    package_white_list: string[];
    contact_white_list: string[];
  };

  export type ClassMember = {
    type: "import" | "attribute" | "method" | "class";
    isPublic: boolean;
    isStatic: boolean;
    name: string;
    content: string;
    ctxRef: { current: Context | null };
  };
}

export {};
