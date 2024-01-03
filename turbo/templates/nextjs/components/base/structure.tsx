import type { FCC } from "types";

export interface AnalticsProps {
	name: string;
	version: string;
	instance?: string;
	className?: string;
	id?: string;
}

export const Module: FCC<AnalticsProps> = ({ id, className, name, version, instance = "default", children }) => {
	return (
		<section
			id={id}
			data-module-name={name}
			data-module-version={version}
			data-module-instance={instance}
			className={className}
		>
			{children}
		</section>
	);
};

export const Submodule: FCC<AnalticsProps> = ({ id, className, name, version, instance = "default", children }) => {
	return (
		<div
			id={id}
			data-submodule-name={name}
			data-submodule-version={version}
			data-submodule-instance={instance}
			className={className}
		>
			{children}
		</div>
	);
};

export const Container: FCC = ({ children }) => {
	return <div className="container mx-auto">{children}</div>;
};

export const Page: FCC<{ id?: string; className?: string }> = ({ id = "page", className = "flex-grow", children }) => {
	return (
		<Module name={id} version="1.0.0" className={className}>
			{children}
		</Module>
	);
};
