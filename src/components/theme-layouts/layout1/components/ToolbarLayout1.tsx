import { ThemeProvider } from '@mui/material/styles';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import clsx from 'clsx';
import { memo } from 'react';
import NavbarToggleButton from 'src/components/theme-layouts/components/navbar/NavbarToggleButton';
import { Layout1ConfigDefaultsType } from '@/components/theme-layouts/layout1/Layout1Config';
import useFuseLayoutSettings from '@fuse/core/FuseLayout/useFuseLayoutSettings';
import { useToolbarTheme } from '@fuse/core/FuseSettings/hooks/fuseThemeHooks';
import useThemeMediaQuery from '../../../../@fuse/hooks/useThemeMediaQuery';

type ToolbarLayout1Props = {
	className?: string;
};

/**
 * Simplified toolbar — navbar toggle only (no theme switcher, search, etc.).
 */
function ToolbarLayout1(props: ToolbarLayout1Props) {
	const { className } = props;

	const settings = useFuseLayoutSettings();
	const config = settings.config as Layout1ConfigDefaultsType;
	const isMobile = useThemeMediaQuery((theme) => theme.breakpoints.down('lg'));
	const toolbarTheme = useToolbarTheme();

	return (
		<ThemeProvider theme={toolbarTheme}>
			<AppBar
				id="fuse-toolbar"
				className={clsx('relative z-20 flex border-b', className)}
				color="default"
				sx={(theme) => ({
					backgroundColor: toolbarTheme.palette.background.default,
					...theme.applyStyles('light', {
						backgroundColor: toolbarTheme.palette.background.paper
					})
				})}
				position="static"
				elevation={0}
			>
				<Toolbar className="min-h-12 p-0 md:min-h-16">
					<div className="flex flex-1 px-2 md:px-4">
						{config.navbar.display && config.navbar.position === 'left' && isMobile && (
							<NavbarToggleButton className="h-10 w-10 p-0 sm:mx-2" />
						)}
					</div>

					{config.navbar.display && config.navbar.position === 'right' && isMobile && (
						<NavbarToggleButton className="h-10 w-10 p-0 sm:mx-2" />
					)}
				</Toolbar>
			</AppBar>
		</ThemeProvider>
	);
}

export default memo(ToolbarLayout1);
