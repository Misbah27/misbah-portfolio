import MainLayout from '../../components/MainLayout';

export const metadata = {
	title: 'Misbahuddin Mohammed — Engineering Portfolio',
	description: 'Senior Engineering Leader | 11+ Years at Amazon | AI-Powered Logistics Systems'
};

/**
 * Landing page layout — renders without Fuse sidebar, toolbar, or panels.
 * Only the / route uses this layout; all /apps/* routes use (control-panel).
 * Loads Google Fonts required by the SaaS App Dark design system.
 */
function Layout({ children }: { children: React.ReactNode }) {
	return (
		<MainLayout
			navbar={false}
			toolbar={false}
			leftSidePanel={false}
			rightSidePanel={false}
			footer={false}
		>
			{/* eslint-disable-next-line @next/next/no-page-custom-font */}
			<link
				href="https://fonts.googleapis.com/css2?family=Noto+Serif+KR:wght@500;700&family=Caveat:wght@700&family=DM+Sans:wght@400;500&display=swap"
				rel="stylesheet"
			/>
			{children}
		</MainLayout>
	);
}

export default Layout;
