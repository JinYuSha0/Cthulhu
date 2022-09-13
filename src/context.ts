interface Attrs {
  isAnalyzed: boolean;
  isConstruct: boolean;
  parent: Context | null; // 父级
  filePath: string; // 文件路径
  packageName: string; // 所属包名
  className: string; // 类名
  member: {
    importPackage: ClassMember[];
    childClass: ClassMember[];
    methods: ClassMember[];
    attribute: ClassMember[];
  };
  config: Config; // 根中的配置
}

export default class Context {
  public isAnalyzed: boolean;
  public isConstruct: boolean;
  public parent: Context | null;
  public filePath: string;
  public packageName: string;
  public className: string;
  public member: {
    importPackage: ClassMember[];
    childClass: ClassMember[];
    methods: ClassMember[];
    attribute: ClassMember[];
  };
  public config: Config;
  public children?: Context[] = [];

  constructor(attrs: Attrs) {
    this.isAnalyzed = attrs.isAnalyzed;
    this.isConstruct = attrs.isConstruct;
    this.parent = attrs.parent;
    this.filePath = attrs.filePath;
    this.packageName = attrs.packageName;
    this.className = attrs.className;
    this.member = attrs.member;
    this.config = attrs.config;
  }
}
