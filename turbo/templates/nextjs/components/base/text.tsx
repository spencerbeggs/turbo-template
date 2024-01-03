import Link from "next/link";
import type { FCC } from "types";

interface HeadlineProps {
	as: React.ElementType;
	text: string;
	href?: string;
	style?: "category-header-1" | "category-header-2" | "category-header-3" | "category-header-4";
}

interface TextProps<C> {
	as?: C;
	style?: string;
	children: React.ReactNode;
}

export const Text = <C extends React.ElementType>({ as, children, style }: TextProps<C>) => {
	const Component = as || "span";
	return <Component className={style}>{children}</Component>;
};

export const Headline: FCC<HeadlineProps> = ({ as = "h1", text, href, style = "category-header-1" }) => {
	return (
		<Text as={as} style={style}>
			{href ? <Link href={href}>{text}</Link> : text}
		</Text>
	);
};
