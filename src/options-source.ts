export class OptionsSource {
  private static options: any = {}

  public static setOptions(options: any): void {
    OptionsSource.options = options
  }

  public static getOptions(): any {
    return OptionsSource.options
  }
}
