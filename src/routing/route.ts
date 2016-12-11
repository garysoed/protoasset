/**
 * Represents a route in the app.
 */
export class Route {
  private readonly location_: string;

  /**
   * @param location The location corresponding to the route.
   */
  constructor(location: string) {
    this.location_ = location;
  }

  /**
   * @return The location corresponding to the route.
   */
  getLocation(): string {
    return this.location_;
  }
}
