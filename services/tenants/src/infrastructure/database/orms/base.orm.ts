export class BaseOrm<T> {
  constructor(orm: Partial<T>) {
    Object.assign(this, orm);
  }
}