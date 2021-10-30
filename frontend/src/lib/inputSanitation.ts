// Functions for sanitizing function input

const mathMethods: string[] = Object.getOwnPropertyNames(Math)//.filter((item: string) => typeof (Math[item as keyof (Math)]) === 'function')
const paramStrings: string[] = Array.apply(null, Array(5)).map((_, i: number): string => `p${i + 1}`)
const stringWhitelist = ['x', 'y', ...paramStrings, ...mathMethods]

const uniqueOnly = (value: string, index: number, self: string[]) => self.indexOf(value) === index

const sanitizeFormula = (func: string): string => {
  func = func.replace(/[^a-zA-Z0-9=<>*+-\/().&^!|%;?:;{} ]/g, '') // special chars whitelist
  func = func.replace(/Math\./g, '') // clear Math if present
  // clear everything else
  const stringMatches = func.match(/p[0-9]{1}|[a-zA-Z]+/g)?.filter((string: string): boolean => stringWhitelist.indexOf(string) == -1).filter(uniqueOnly)
  stringMatches?.forEach((string: string) => {
    func = func.replaceAll(string, '')
  })

  return func
}

const extendWithMath = (func: string): string => {
  func = sanitizeFormula(func)
  const mathMatches = func.match(/p[0-9]{1}|[a-zA-Z]+/g)?.filter((string: string): boolean => mathMethods.indexOf(string) > -1).filter(uniqueOnly)
  mathMatches?.forEach((string: string) => {
    func = func.replaceAll(string, `Math.${string}`)
  })

  return func
}

export { extendWithMath, sanitizeFormula }
