'use client';

import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import FuseSvgIcon from '@fuse/core/FuseSvgIcon';
import usePathname from '@fuse/hooks/usePathname';
import Link from 'next/link';

const NAV_ITEMS = [
	{ label: 'Delay Alert', icon: 'heroicons-outline:bell-alert', href: '/apps/nova' },
	{ label: 'Rescue Planner', icon: 'heroicons-outline:lifebuoy', href: '/apps/nova/rescue-planner' },
] as const;

/**
 * Nova left sidebar with branding and section navigation.
 */
function NovaSidebar() {
	const pathname = usePathname();

	return (
		<div className="w-[280px] h-full flex flex-col overflow-y-auto">
			<Box className="p-6 pb-4">
				<Typography
					sx={{
						fontWeight: 900,
						fontSize: '1.75rem',
						letterSpacing: '0.15em',
						lineHeight: 1,
					}}
				>
					NOVA
				</Typography>
				<Box
					sx={{ width: 40, height: 3, mt: 1, mb: 1.5, borderRadius: 1, bgcolor: 'secondary.main' }}
				/>
				<Typography variant="body2" color="text.secondary">
					Delay Alert + Rescue Planner
				</Typography>
			</Box>

			<List component="nav" className="px-2">
				{NAV_ITEMS.map((item) => {
					const active = pathname === item.href ||
						(item.href !== '/apps/nova' && pathname.startsWith(item.href));

					return (
						<ListItemButton
							key={item.href}
							component={Link}
							href={item.href}
							selected={active}
							sx={{ borderRadius: 1, mb: 0.5 }}
						>
							<ListItemIcon sx={{ minWidth: 36 }}>
								<FuseSvgIcon size={20}>{item.icon}</FuseSvgIcon>
							</ListItemIcon>
							<ListItemText
								primary={item.label}
								primaryTypographyProps={{ variant: 'body2', fontWeight: active ? 600 : 400 }}
							/>
						</ListItemButton>
					);
				})}
			</List>
		</div>
	);
}

export default NovaSidebar;
