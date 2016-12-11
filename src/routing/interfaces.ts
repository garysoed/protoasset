import {Route} from './route';


export interface IRouteFactory<T> {
  create(params: T): Route;
  getMatcher(): string;
}
