interface Field {
  config: {};
  toDB(value: any): any;
  fromDB(value: any): any;
}

export function createField(type: string): Field;
