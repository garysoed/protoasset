import {Route} from './route';


export interface IRouteFactory<T, M> {
  create(params: T): Route;
  getMatcher(): string;
  populateMatches(matches: {[key: string]: string}): M;
}
