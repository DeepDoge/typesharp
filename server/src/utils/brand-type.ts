const Brand = Symbol()
type Brand = typeof Brand
export type BrandType<TBrand extends string, T> = T & { [Brand]: TBrand }
