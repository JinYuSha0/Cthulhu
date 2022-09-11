import fsWrite from "./fsWrite";

export default class JavaClassTemplate {
  public classPath: string;
  public className: string;
  public config: Config;
  public importMember: ClassMember[] = [];
  public attrMember: ClassMember[] = [];
  public methodMember: MethodMember[] = [];
  public classMember: ClassMember[] = [];

  constructor(classPath: string, config: Config) {
    this.config = config;
    this.classPath = classPath;
    const splits = classPath.split(".");
    this.className = splits[splits.length - 1];
  }

  template() {
    return `
    ${this.importMember.map((item) => item.content).join("\r\n")}
    public class ${this.className} {
        ${this.attrMember.map((item) => item.content).join("\r\n")}
        ${this.methodMember.map((item) => item.content).join("\r\n")}
        ${this.classMember.map((item) => item.content).join("\r\n")}
    }`;
  }

  addImport(imp: ClassMember | ClassMember[]) {
    if (imp instanceof Array) {
      this.importMember = [...this.importMember, ...imp];
    } else {
      this.importMember.push(imp);
    }
  }

  addAttr(attr: ClassMember) {
    this.attrMember.push(attr);
  }

  addMethod(method: MethodMember) {
    this.methodMember.push(method);
  }

  addClass(clazz: ClassMember) {
    this.classMember.push(clazz);
  }

  create() {
    const content = this.template();
    fsWrite(this.classPath, content, this.config);
  }
}
