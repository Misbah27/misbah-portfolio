import MainLayout from 'src/components/MainLayout';

/**
 * Layout for all portfolio pages — renders inside the Fuse shell
 * with navbar, toolbar, and sidebar.
 * No auth guard — this is a public portfolio.
 */
function Layout({ children }: { children: React.ReactNode }) {
	return <MainLayout>{children}</MainLayout>;
}

export default Layout;
