import React, { PropsWithChildren } from "react";

/** A special type that lets you declare a functional components with optional chrildren.
 * @example
 * ```ts
 * const MyComponent: FCC<{ title: string }> = ({ foo, children }) => {
 *     return (
 *        <div>
 *           <h1>{title}</h1>
 *          {children}
 *         </div>
 *     );
 * }
 * ```
 */
export type FCC<T = unknown> = React.FC<PropsWithChildren<T>>;
