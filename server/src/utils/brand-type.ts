const Brand = Symbol()
type Brand = typeof Brand
export type BrandType<T, TBrand extends string> = T & { [Brand]: TBrand }
